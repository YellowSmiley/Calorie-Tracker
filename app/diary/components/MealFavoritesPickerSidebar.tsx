"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FavoriteMealSummary, MealType } from "@/app/meal-favorites/types";
import SearchInput from "@/app/components/SearchInput";
import DataTableShell from "@/app/components/DataTableShell";
import HelpButton from "@/app/components/HelpButton";
import {
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import { UserSettings } from "@/app/settings/types";

interface MealFavoritesPickerSidebarProps {
  isOpen: boolean;
  targetMealType: MealType;
  currentDate: string;
  userSettings: UserSettings;
  onClose: () => void;
  onApplied: () => void;
  onError: (message: string | null) => void;
}

export default function MealFavoritesPickerSidebar({
  isOpen,
  targetMealType,
  currentDate,
  userSettings,
  onClose,
  onApplied,
  onError,
}: MealFavoritesPickerSidebarProps) {
  const [favorites, setFavorites] = useState<FavoriteMealSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchFavorites = useCallback(
    async (search: string) => {
      setIsLoading(true);
      onError(null);

      try {
        const params = new URLSearchParams({
          search,
          take: "200",
          skip: "0",
        });
        const response = await fetch(
          `/api/meal-favorites?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch favorites");
        }

        const data = (await response.json()) as {
          favorites: FavoriteMealSummary[];
        };

        setFavorites(data.favorites || []);
      } catch (err) {
        onError(
          err instanceof Error ? err.message : "Failed to fetch favorites",
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
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [fetchFavorites, isOpen, searchQuery]);

  const handleApplyFavorite = async (favoriteId: string) => {
    setIsApplying(true);
    onError(null);

    try {
      const response = await fetch("/api/meal-favorites/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          favoriteId,
          mealType: targetMealType,
          date: currentDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to apply favorite");
      }

      setSearchQuery("");
      onApplied();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to apply favorite");
    } finally {
      setIsApplying(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={handleClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Apply Favorite Meal
          </h2>
          <HelpButton
            title="Apply Favorite Meal"
            ariaLabel="Help: Apply favorite meal"
          >
            <p>
              Pick any saved favorite to set this meal for the selected date.
            </p>
            <p>Applying a favorite replaces the current meal items.</p>
            <p>
              Use search to find favorites quickly and review each summary
              before applying.
            </p>
          </HelpButton>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex flex-col h-full p-4">
        <div className="mx-auto w-full max-w-3xl flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden flex flex-col">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            showSuggestions={false}
            suggestions={[]}
            onSuggestionClick={() => {}}
            data-testid="meal-favorites-search"
          />

          <DataTableShell
            scrollRef={scrollRef}
            onScroll={() => {}}
            containerClassName="flex-1 overflow-y-auto"
            isLoading={isLoading}
            loadingLabel="Loading favorite meals"
            emptyNode={
              !isLoading && favorites.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400 text-center">
                  {searchQuery
                    ? `No favorites found for "${searchQuery}"`
                    : "No favorites found."}
                </div>
              ) : undefined
            }
          >
            {!isLoading &&
              favorites.map((favorite) => (
                <div
                  key={favorite.id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
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
                  <button
                    type="button"
                    onClick={() => handleApplyFavorite(favorite.id)}
                    disabled={isApplying}
                    className="shrink-0 rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              ))}
          </DataTableShell>
        </div>
      </div>
    </div>
  );
}
