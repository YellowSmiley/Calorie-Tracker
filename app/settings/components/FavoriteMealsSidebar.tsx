"use client";

import { useCallback, useEffect, useState } from "react";
import SearchInput from "@/app/components/SearchInput";
import DataTableShell from "@/app/components/DataTableShell";
import FavoriteMealEditorSidebar from "./FavoriteMealEditorSidebar";
import { UserSettings } from "../types";
import {
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import {
  FavoriteMealDetail,
  FavoriteMealSummary,
} from "@/app/meal-favorites/types";

interface FavoriteMealsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  onError: (message: string | null) => void;
}

export default function FavoriteMealsSidebar({
  isOpen,
  onClose,
  userSettings,
  onError,
}: FavoriteMealsSidebarProps) {
  const [favorites, setFavorites] = useState<FavoriteMealSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingFavorite, setEditingFavorite] =
    useState<FavoriteMealDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FavoriteMealSummary | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFavorites = useCallback(
    async (search: string) => {
      setIsLoading(true);
      onError(null);

      try {
        const params = new URLSearchParams({ search, take: "200", skip: "0" });
        const response = await fetch(
          `/api/meal-favorites?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load favorites");
        }

        const data = (await response.json()) as {
          favorites: FavoriteMealSummary[];
        };

        setFavorites(data.favorites || []);
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Failed to load favorites",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onError],
  );

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      fetchFavorites(searchQuery.trim());
    }, 250);

    return () => clearTimeout(timeout);
  }, [fetchFavorites, isOpen, searchQuery]);

  const openEditorForCreate = () => {
    setEditingFavorite(null);
    setShowEditor(true);
  };

  const openEditorForEdit = async (favoriteId: string) => {
    setIsLoading(true);
    onError(null);

    try {
      const response = await fetch(`/api/meal-favorites/${favoriteId}`);
      if (!response.ok) {
        throw new Error("Failed to load favorite details");
      }

      const detail = (await response.json()) as FavoriteMealDetail;
      setEditingFavorite(detail);
      setShowEditor(true);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to load favorite details",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFavorite = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    onError(null);

    try {
      const response = await fetch(`/api/meal-favorites/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to delete favorite");
      }

      setFavorites((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to delete favorite");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
          <button
            data-testid="favorite-meals-back-button"
            onClick={onClose}
            className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            Back
          </button>
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Favorite Meals
          </h2>
          <div className="w-12" />
        </div>

        <div className="flex flex-col h-full p-4">
          <div className="mx-auto w-full max-w-3xl flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              showSuggestions={false}
              suggestions={[]}
              onSuggestionClick={() => {}}
              data-testid="favorite-meals-search"
            />

            <DataTableShell
              scrollRef={{ current: null }}
              onScroll={() => {}}
              containerClassName="flex-1 overflow-y-auto"
              loadingNode={
                isLoading ? (
                  <div className="px-4 py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                    Loading...
                  </div>
                ) : undefined
              }
              emptyNode={
                !isLoading && favorites.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                      {searchQuery
                        ? `No favorites found for "${searchQuery}"`
                        : "No favorite meals yet. Create your first favorite to quickly apply meals in Diary."}
                    </p>
                    <button
                      onClick={openEditorForCreate}
                      className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                      data-testid="create-favorite-button"
                    >
                      Create Favorite
                    </button>
                  </div>
                ) : undefined
              }
              footerNode={
                !isLoading && favorites.length > 0 ? (
                  <div className="px-4 py-4 text-center">
                    <button
                      onClick={openEditorForCreate}
                      className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                      data-testid="create-favorite-button"
                    >
                      Create Favorite
                    </button>
                  </div>
                ) : undefined
              }
            >
              {favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  onClick={() => openEditorForEdit(favorite.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-black dark:text-zinc-50">
                      {favorite.name}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {favorite.itemCount} items · Used {favorite.usageCount}{" "}
                      times
                    </p>
                    {favorite.itemPreview &&
                      favorite.itemPreview.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {favorite.itemPreview.join(", ")}
                          {favorite.itemCount > favorite.itemPreview.length
                            ? " ..."
                            : ""}
                        </p>
                      )}
                    {favorite.totals && (
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {getCalorieForDisplay(
                          favorite.totals.calories,
                          userSettings.calorieUnit,
                        )}
                        {` · P ${getWeightForDisplay(favorite.totals.protein, userSettings.weightUnit)} · C ${getWeightForDisplay(favorite.totals.carbs, userSettings.weightUnit)} · F ${getWeightForDisplay(favorite.totals.fat, userSettings.weightUnit)}`}
                      </p>
                    )}
                  </div>
                  <div
                    className="shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      onClick={() => setDeleteTarget(favorite)}
                      className="rounded-lg border border-solid border-black/8 hover:border-black hover:bg-black/4 dark:border-white/[.145] dark:hover:border-white dark:hover:bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </DataTableShell>
          </div>
        </div>
      </div>

      <FavoriteMealEditorSidebar
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingFavorite(null);
        }}
        userSettings={userSettings}
        editingFavorite={editingFavorite}
        onSaved={() => fetchFavorites(searchQuery.trim())}
        onError={onError}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                Delete Favorite?
              </h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Are you sure you want to delete
                <span className="font-medium text-black dark:text-zinc-50">
                  {" "}
                  {deleteTarget.name}
                </span>
                ?
              </p>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFavorite}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
