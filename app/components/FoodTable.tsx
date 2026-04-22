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
import LoadingButton from "./LoadingButton";
import { formatFoodNameForDisplay } from "@/lib/foodNameDisplay";

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
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [punishingId, setPunishingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingDetails, setEditingDetails] = useState<{
    createdByName?: string;
    createdAt?: string | Date | null;
  } | null>(null);
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

  const startEditing = (food: FoodWithCreator) => {
    setEditingFood(food);
    setEditingDetails({
      createdByName: food.createdByName,
      createdAt: food.createdAt,
    });
    setShowCreateForm(true);
  };

  const handleApproveFood = async (
    foodId: string,
    currentlyApproved: boolean,
  ) => {
    setApprovingId(foodId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/foods/${foodId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Something went wrong"));
        return;
      }

      setFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? { ...food, isApproved: !currentlyApproved }
            : food,
        ),
      );
      setEditingFood((prev) =>
        prev?.id === foodId
          ? { ...prev, isApproved: !currentlyApproved }
          : prev,
      );
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error approving food:", err);
      }
      setError(
        currentlyApproved ? "Error unapproving food" : "Error approving food",
      );
    } finally {
      setApprovingId(null);
    }
  };

  const handlePunishCreator = async (foodId: string) => {
    setPunishingId(foodId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/foods/${foodId}/punish`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Something went wrong"));
        return;
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error punishing creator:", err);
      }
      setError("Error punishing creator");
    } finally {
      setPunishingId(null);
    }
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
    <div className="flex flex-col h-full min-h-0 p-4">
      <div className="mx-auto w-full max-w-3xl flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden flex flex-col">
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
          containerClassName="flex-1 overflow-y-auto overscroll-contain"
          isLoading={isLoading}
          loadingLabel="Loading foods"
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
                  className="ct-button-primary h-10 rounded-lg px-4 text-sm font-medium transition-colors"
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
                  className="ct-button-primary h-10 rounded-lg px-4 text-sm font-medium transition-colors"
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
                <div className="flex items-center gap-2">
                  <p className="font-medium text-black dark:text-zinc-50">
                    {formatFoodNameForDisplay(food.name)}
                  </p>
                  {food.isApproved ? (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                      Approved
                    </span>
                  ) : null}
                </div>
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
              <div
                className="shrink-0 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                {isAdmin ? (
                  <LoadingButton
                    type="button"
                    onClick={() => handleApproveFood(food.id, food.isApproved)}
                    isLoading={approvingId === food.id}
                    loadingLabel={
                      food.isApproved ? "Unapproving..." : "Approving..."
                    }
                    spinnerClassName="h-4 w-4"
                    className={[
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                      food.isApproved
                        ? "ct-button-secondary"
                        : "ct-button-primary",
                    ].join(" ")}
                    data-testid={`food-row-approve-${food.id}`}
                  >
                    {food.isApproved ? "Unapprove" : "Approve"}
                  </LoadingButton>
                ) : null}
                <button
                  onClick={() => {
                    setDeleteTarget(food);
                    setShowDeleteModal(true);
                  }}
                  className="ct-button-danger-subtle rounded-lg px-3 py-2 text-sm font-medium transition-colors"
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
          setEditingDetails(null);
          setError(null);
        }}
        onSubmit={handleFoodSubmit}
        userSettings={userSettings}
        isLoading={isLoading}
        editingFood={editingFood}
        editingDetails={editingDetails ?? undefined}
        adminActions={
          isAdmin && editingFood ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <LoadingButton
                type="button"
                onClick={() => handlePunishCreator(editingFood.id)}
                isLoading={punishingId === editingFood.id}
                loadingLabel="Punishing..."
                spinnerClassName="h-4 w-4"
                className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                data-testid="food-table-edit-punish"
              >
                Punish
              </LoadingButton>
              <button
                type="button"
                className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                onClick={() => {
                  const fullFood = foods.find(
                    (food) => food.id === editingFood.id,
                  );
                  if (fullFood) {
                    setDeleteTarget(fullFood);
                    setShowDeleteModal(true);
                  }
                }}
                data-testid="food-table-edit-delete"
              >
                Delete
              </button>
              <LoadingButton
                type="button"
                onClick={() =>
                  handleApproveFood(editingFood.id, editingFood.isApproved)
                }
                isLoading={approvingId === editingFood.id}
                loadingLabel={
                  editingFood.isApproved ? "Unapproving..." : "Approving..."
                }
                spinnerClassName="h-4 w-4"
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                  editingFood.isApproved
                    ? "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    : "ct-button-primary",
                ].join(" ")}
                data-testid="food-table-edit-approve"
              >
                {editingFood.isApproved ? "Unapprove" : "Approve"}
              </LoadingButton>
            </div>
          ) : undefined
        }
        error={error}
      />

      <DeleteFoodModal
        isOpen={showDeleteModal}
        item={
          deleteTarget
            ? {
                ...deleteTarget,
                name: formatFoodNameForDisplay(deleteTarget.name),
              }
            : null
        }
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
