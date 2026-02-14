"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import CreateFoodSidebar, {
  CreateFoodSidebarOnSubmitData,
} from "../diary/components/create-food-sidebar/CreateFoodSidebar";
import { UserSettings } from "../settings/types";
import { Food } from "@prisma/client";
import { getMeasurementInputLabel } from "@/lib/unitConversions";
import { MeasurementType } from "../diary/types";
import { FoodWithCreator } from "../api/admin/foods/route";

interface FoodTableProps {
  userSettings: UserSettings;
  apiBasePath: string; // "/api/foods" or "/api/admin/foods"
  showCreatedBy?: boolean;
  emptyMessage?: string;
}

const PAGE_SIZE = 50;

export default function FoodTable({
  userSettings,
  apiBasePath,
  showCreatedBy = false,
  emptyMessage = "You haven't created any foods yet. Click 'Create Food' to get started.",
}: FoodTableProps) {
  // For admin API, foods may have createdByName
  const [foods, setFoods] = useState<FoodWithCreator[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
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
        const res = await fetch(`${apiBasePath}?${params}`);
        if (!res.ok) {
          setError("Failed to fetch foods");
          return;
        }
        const data = (await res.json()) as {
          foods: FoodWithCreator[];
          total: number;
        };
        const fetched = data.foods || [];
        setFoods((prev) => (append ? [...prev, ...fetched] : fetched));
        setTotal(data.total ?? 0);
        setIsLoading(false);
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.error("Error fetching foods:", err);
        setError("Error fetching foods");
      } finally {
        setIsLoading(false);
      }
    },
    [apiBasePath],
  );

  // Fetch on mount
  useEffect(() => {
    fetchFoods("", 0, false);
  }, [fetchFoods]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery) return; // Don't search if input is empty
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
        const url = apiBasePath.includes("admin")
          ? `${apiBasePath}/${editingFood.id}`
          : apiBasePath;

        const body = apiBasePath.includes("admin")
          ? formData
          : { id: editingFood.id, ...formData };

        const response = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const updated = await response.json();
          setFoods((prev) =>
            prev.map((f) => (f.id === editingFood.id ? updated : f)),
          );
          setEditingFood(null);
          setShowCreateForm(false);
        } else {
          setError("Failed to update food");
        }
      } else {
        // Create new food
        const response = await fetch(apiBasePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          // Re-fetch to get proper sorted position
          fetchFoods(searchQuery, 0, false);
          setShowCreateForm(false);
        } else {
          setError("Failed to create food");
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

  const handleDeleteFood = async (foodId: string) => {
    try {
      const url = apiBasePath.includes("admin")
        ? `${apiBasePath}/${foodId}`
        : apiBasePath;

      const options: RequestInit = {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      };

      if (!apiBasePath.includes("admin")) {
        options.body = JSON.stringify({ id: foodId });
      }

      const response = await fetch(url, options);

      if (response.ok) {
        setFoods((prev) => prev.filter((f) => f.id !== foodId));
        setTotal((prev) => prev - 1);
        setDeleteConfirm(null);
        setError(null);
      } else {
        setError("Failed to delete food");
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error("Error deleting food:", err);
      setError("Error deleting food");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Box */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl">
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 pt-4">
          <div className="mx-auto w-full max-w-3xl rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-900 dark:text-zinc-200">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Food List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-w-3xl mx-auto">
          {foods.map((food) => (
            <div
              key={food.id}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
              onClick={() => startEditing(food)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-zinc-50">
                  {food.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {food.measurementAmount}
                  {
                    getMeasurementInputLabel(
                      food.measurementType as MeasurementType,
                      userSettings,
                    ).inputUnit
                  }{" "}
                  • {food.calories} kcal
                  {food.defaultServingDescription
                    ? ` • ${food.defaultServingDescription}${food.defaultServingAmount ? ` (${food.defaultServingAmount})` : ""}`
                    : ""}
                  {showCreatedBy
                    ? ` • ${food.createdByName || food.createdBy || "Unknown"}`
                    : ""}
                </p>
              </div>
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                {deleteConfirm === food.id ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteFood(food.id)}
                      className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(food.id)}
                    className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="px-4 py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Loading...
            </div>
          )}

          {/* No results */}
          {!isLoading && foods.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                {searchQuery
                  ? `No foods found for "${searchQuery}"`
                  : emptyMessage}
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
              >
                Create Food
              </button>
            </div>
          )}

          {/* Create button at end of list */}
          {!isLoading && foods.length > 0 && foods.length >= total && (
            <div className="px-4 py-4 text-center">
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
              >
                Create Food
              </button>
            </div>
          )}
        </div>
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
      />
    </div>
  );
}
