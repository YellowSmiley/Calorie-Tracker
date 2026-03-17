"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DeleteFoodModal from "../diary/components/DeleteFoodModal";
import CreateFoodSidebar, {
  CreateFoodSidebarOnSubmitData,
} from "../diary/components/create-food-sidebar/CreateFoodSidebar";
import { UserSettings } from "../settings/types";
import { Food } from "@prisma/client";
import { FoodWithCreator } from "../api/admin/foods/route";
import {
  convertVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import { getApiErrorMessage } from "@/lib/apiError";
import SearchInput from "./SearchInput";
import DataTableShell from "./DataTableShell";

interface FoodTableProps {
  userSettings: UserSettings;
  isAdmin?: boolean;
}

const PAGE_SIZE = 50;
export default function FoodTable({
  userSettings,
  isAdmin = false,
}: FoodTableProps) {
  // For admin API, foods may have createdByName
  const [foods, setFoods] = useState<FoodWithCreator[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodWithCreator | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFoods = useCallback(
    async (search: string, skip: number, append: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search,
          take: String(PAGE_SIZE),
          skip: String(skip),
        });
        const res = await fetch(`/api/admin/foods?${params}`);
        if (!res.ok) {
          setError("Failed to fetch foods");
          return;
        }
        const data = (await res.json()) as {
          foods: FoodWithCreator[];
          total: number;
          suggestions?: string[];
        };
        const fetched = data.foods || [];
        setFoods((prev) => (append ? [...prev, ...fetched] : fetched));
        setTotal(data.total ?? 0);
        if (!append) {
          setSuggestions(data.suggestions ?? []);
        }
        setIsLoading(false);
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.error("Error fetching foods:", err);
        setError("Error fetching foods");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery) {
      setSuggestions([]);
      fetchFoods("", 0, false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchFoods(searchQuery, 0, false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchFoods]);

  const loadMore = useCallback(() => {
    if (isLoading || foods.length >= total) return;
    fetchFoods(searchQuery, foods.length, true);
  }, [isLoading, foods.length, total, searchQuery, fetchFoods]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Only load more if user has scrolled past 2720px (40 rows * 68px)
    if (el.scrollTop < 2720) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      loadMore();
    }
  }, [loadMore]);

  const handleFoodSubmit = async (formData: CreateFoodSidebarOnSubmitData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (editingFood) {
        // Update existing food
        const url = `/api/admin/foods/${editingFood.id}`;
        const body = formData;

        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const updated = (await response.json()) as FoodWithCreator;
          setFoods((prev) =>
            prev.map((f) => (f.id === editingFood.id ? updated : f)),
          );
          setEditingFood(null);
          setShowCreateForm(false);
        } else {
          setError(await getApiErrorMessage(response, "Something went wrong"));
        }
      } else {
        // Create new food
        const response = await fetch("/api/admin/foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          // Re-fetch to get proper sorted position
          fetchFoods(searchQuery, 0, false);
          setShowCreateForm(false);
        } else {
          setError(await getApiErrorMessage(response, "Something went wrong"));
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error("Error saving food:", err);
      setError("Error saving food");
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (food: Food) => {
    setEditingFood(food);
    setShowCreateForm(true);
  };

  const handleDeleteFood = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setIsLoading(true);
    try {
      const url = `/api/admin/foods/${deleteTarget.id}`;

      const options: RequestInit = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      };

      const response = await fetch(url, options);

      if (response.ok) {
        setFoods((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        setTotal((prev) => prev - 1);
        setDeleteTarget(null);
        setShowDeleteModal(false);
        setError(null);
      } else {
        setError(await getApiErrorMessage(response, "Something went wrong"));
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error("Error deleting food:", err);
      setError("Error deleting food");
    } finally {
      setIsLoading(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mx-auto w-full max-w-3xl flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          showSuggestions={!isLoading && foods.length === 0 && !!searchQuery}
          suggestions={suggestions}
          onSuggestionClick={setSearchQuery}
          data-testid="food-table-search"
        />

        {/* Error Message */}
        {error && (
          <div className="px-4 pt-4" data-testid="food-table-error">
            <div className="rounded-lg border border-zinc-300 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-900 dark:text-zinc-200">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <DataTableShell
          scrollRef={scrollRef}
          onScroll={handleScroll}
          loadingNode={
            isLoading ? (
              <div
                className="px-4 py-3 text-center text-sm text-zinc-500 dark:text-zinc-400"
                data-testid="loading-foods"
              >
                Loading...
              </div>
            ) : undefined
          }
          emptyNode={
            !isLoading && foods.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p
                  className="text-sm text-zinc-500 dark:text-zinc-400 mb-3"
                  data-testid="no-foods-found"
                >
                  {searchQuery
                    ? `No foods found for "${searchQuery}"`
                    : isAdmin
                      ? "No foods found. Click 'Create Food' to add one."
                      : "You haven't created any foods yet. Click 'Create Food' to get started."}
                </p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                  data-testid="create-food-button"
                >
                  Create Food
                </button>
              </div>
            ) : undefined
          }
          footerNode={
            !isLoading && foods.length > 0 && foods.length >= total ? (
              <div className="px-4 py-4 text-center">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                  data-testid="create-food-button"
                >
                  Create Food
                </button>
              </div>
            ) : undefined
          }
        >
          {foods.map((food, i) => (
            <div
              key={food.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              onClick={() => startEditing(food)}
              data-testid={`food-search-result-${food.id}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-zinc-50">
                  {food.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {food.measurementType === "weight"
                    ? getWeightForDisplay(
                        food.measurementAmount,
                        userSettings.weightUnit,
                      )
                    : convertVolumeForDisplay(
                        food.measurementAmount,
                        userSettings.volumeUnit,
                      )}{" "}
                  - {food.calories} kcal
                  {food.defaultServingDescription
                    ? ` - ${food.defaultServingDescription}${food.defaultServingAmount ? ` (${food.defaultServingAmount})` : ""}`
                    : ""}
                  {` - ${food.createdByName || food.createdBy || "Unknown"}`}
                </p>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setDeleteTarget(food);
                    setShowDeleteModal(true);
                  }}
                  className="rounded-lg border border-solid border-black/8 hover:border-black hover:bg-black/4 dark:border-white/[.145] dark:hover:border-white dark:hover:bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                  data-testid={`delete-food-button-${i}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </DataTableShell>
      </div>

      <CreateFoodSidebar
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setEditingFood(null);
          setError(null);
        }}
        onSubmit={handleFoodSubmit}
        userSettings={userSettings}
        isLoading={isLoading}
        editingFood={editingFood}
        error={error}
      />

      <DeleteFoodModal
        isOpen={showDeleteModal}
        item={deleteTarget}
        mealName={"My Foods"}
        onConfirm={handleDeleteFood}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        isLoading={isDeleting}
        error={error}
        userSettings={userSettings}
      />
    </div>
  );
}
