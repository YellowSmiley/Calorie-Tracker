"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FoodListSidebar from "./components/FoodListSidebar";
import CreateFoodSidebar, {
  CreateFoodSidebarOnSubmitData,
} from "./components/create-food-sidebar/CreateFoodSidebar";
import EditFoodSidebar from "./components/EditFoodSidebar";
import DeleteFoodModal from "./components/DeleteFoodModal";
import DailySummaryAccordion from "./components/DailySummaryAccordion";
import HelpButton from "@/app/components/HelpButton";
import {
  formatCalories,
  getMeasurementInputLabel,
} from "@/lib/unitConversions";
import type { FoodItem, Meal } from "./types";
import { UserSettings } from "../settings/types";
import { FoodWithCreator } from "../api/admin/foods/route";

export interface DiaryClientProps {
  initialMeals: Meal[];
  activeDate: string;
  userSettings: UserSettings;
  userGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
  };
}

export default function DiaryClient({
  initialMeals,
  activeDate,
  userSettings,
  userGoals,
}: DiaryClientProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(activeDate);
  const [goals] = useState(userGoals);

  const [meals, setMeals] = useState<Meal[]>(initialMeals);

  // Sync state when server data changes
  useEffect(() => {
    setMeals(initialMeals);
  }, [initialMeals]);

  useEffect(() => {
    setCurrentDate(activeDate);
  }, [activeDate]);

  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null,
  );
  const [showFoodList, setShowFoodList] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    mealIndex: number;
    itemId: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    mealIndex: number;
    itemId: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Loading states for async operations
  const [isLoadingFood, setIsLoadingFood] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [isLoadingServing, setIsLoadingServing] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const selectedFood = useMemo(() => {
    if (!editTarget) return null;
    return (
      meals[editTarget.mealIndex]?.items.find(
        (item) => item.id === editTarget.itemId,
      ) || null
    );
  }, [editTarget, meals]);

  const deleteItem = useMemo(() => {
    if (!deleteTarget) return null;
    return (
      meals[deleteTarget.mealIndex]?.items.find(
        (item) => item.id === deleteTarget.itemId,
      ) || null
    );
  }, [deleteTarget, meals]);

  const mealTypeByIndex = useMemo(
    () => ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const,
    [],
  );

  const totals = useMemo(() => {
    const allItems = meals.flatMap((meal) => meal.items);
    return {
      calories: allItems.reduce((sum, item) => sum + item.calories, 0),
      protein: allItems.reduce((sum, item) => sum + item.protein, 0),
      carbs: allItems.reduce((sum, item) => sum + item.carbs, 0),
      fat: allItems.reduce((sum, item) => sum + item.fat, 0),
      saturates: allItems.reduce((sum, item) => sum + item.saturates, 0),
      sugars: allItems.reduce((sum, item) => sum + item.sugars, 0),
      fibre: allItems.reduce((sum, item) => sum + item.fibre, 0),
      salt: allItems.reduce((sum, item) => sum + item.salt, 0),
    };
  }, [meals]);

  const getMealTotals = (mealIndex: number) => {
    const items = meals[mealIndex].items;
    return {
      calories: items.reduce((sum, item) => sum + item.calories, 0),
      protein: items.reduce((sum, item) => sum + item.protein, 0),
      carbs: items.reduce((sum, item) => sum + item.carbs, 0),
      fat: items.reduce((sum, item) => sum + item.fat, 0),
      saturates: items.reduce((sum, item) => sum + item.saturates, 0),
      sugars: items.reduce((sum, item) => sum + item.sugars, 0),
      fibre: items.reduce((sum, item) => sum + item.fibre, 0),
      salt: items.reduce((sum, item) => sum + item.salt, 0),
    };
  };
  const addFoodFromList = async (food: FoodItem, serving: number = 1) => {
    if (selectedMealIndex === null) return;

    setIsLoadingFood(true);
    setError(null);

    try {
      // Calculate serving multiplier from total amount (serving)
      let servingMultiplier = 1;
      if (serving || food.defaultServingAmount) {
        servingMultiplier =
          ((serving || food.defaultServingAmount) ?? 0) /
          food.measurementAmount;
      }
      // Do NOT multiply by quantity again; serving should already be total amount

      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: mealTypeByIndex[selectedMealIndex],
          foodId: food.id,
          serving: servingMultiplier,
          date: currentDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add food to meal");
      }

      const data = await response.json();
      if (data.item) {
        setMeals((prev) =>
          prev.map((meal, index) =>
            index === selectedMealIndex
              ? { ...meal, items: [...meal.items, data.item] }
              : meal,
          ),
        );
      }
      setShowFoodList(false);
      setSelectedMealIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add food");
    } finally {
      setIsLoadingFood(false);
    }
  };

  const addCustomFood = async (formData: CreateFoodSidebarOnSubmitData) => {
    if (selectedMealIndex === null || !formData.name) return;

    setIsLoadingCustom(true);
    setError(null);

    try {
      const createResponse = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create food");
      }

      const created = (await createResponse.json()) as {
        food: FoodWithCreator;
        total: number;
      };

      if (created.food?.id) {
        // Calculate serving multiplier from default serving amount if available
        let servingMultiplier = 1;
        if (created.food.defaultServingAmount) {
          servingMultiplier =
            created.food.defaultServingAmount / created.food.measurementAmount;
        }

        const entryResponse = await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealType: mealTypeByIndex[selectedMealIndex],
            foodId: created.food.id,
            serving: servingMultiplier,
            date: currentDate,
          }),
        });

        if (!entryResponse.ok) {
          throw new Error("Failed to add food to meal");
        }

        const data = await entryResponse.json();
        if (data.item) {
          setMeals((prev) =>
            prev.map((meal, index) =>
              index === selectedMealIndex
                ? { ...meal, items: [...meal.items, data.item] }
                : meal,
            ),
          );
        }
      }

      setShowCreateForm(false);
      setShowFoodList(false);
      setSelectedMealIndex(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add custom food",
      );
    } finally {
      setIsLoadingCustom(false);
    }
  };

  const applyServingChange = async (serving: number) => {
    if (!editTarget) return;

    setIsLoadingServing(true);
    setError(null);

    try {
      const response = await fetch(`/api/meals/${editTarget.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serving }),
      });

      if (!response.ok) {
        throw new Error("Failed to update serving size");
      }

      const data = await response.json();
      if (data.item) {
        setMeals((prev) =>
          prev.map((meal, index) =>
            index === editTarget.mealIndex
              ? {
                  ...meal,
                  items: meal.items.map((item) =>
                    item.id === data.item.id ? data.item : item,
                  ),
                }
              : meal,
          ),
        );
      }

      setShowEditForm(false);
      setEditTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update serving");
    } finally {
      setIsLoadingServing(false);
    }
  };

  const removeFood = async (mealIndex: number, itemId: string) => {
    try {
      const response = await fetch(`/api/meals/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove food");
      }

      setMeals((prev) =>
        prev.map((meal, index) =>
          index === mealIndex
            ? {
                ...meal,
                items: meal.items.filter((item) => item.id !== itemId),
              }
            : meal,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove food");
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);

    try {
      await removeFood(deleteTarget.mealIndex, deleteTarget.itemId);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch {
      // Error is already set in removeFood
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteModal = (mealIndex: number, itemId: string) => {
    setError(null);
    setDeleteTarget({ mealIndex, itemId });
    setShowDeleteConfirm(true);
  };

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    router.push(`/diary?date=${newDate}`);
    router.refresh();
  };

  const handlePreviousDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    const newDate = date.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  const handleNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    const newDate = date.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Diary
            </h1>
            <HelpButton
              title="Food Diary"
              content="Log your daily food intake to track calories and nutrition. Click on any food to adjust serving size, or remove it if needed. Use the date selector to view and record meals from different days."
              ariaLabel="Help: Food diary overview"
            />
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePreviousDay}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
              aria-label="Previous day"
            >
              <svg
                className="w-5 h-5 text-black dark:text-zinc-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <input
              type="date"
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 text-center cursor-pointer scheme-light dark:scheme-dark"
              style={{ minWidth: "160px" }}
            />

            <button
              onClick={handleNextDay}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
              aria-label="Next day"
            >
              <svg
                className="w-5 h-5 text-black dark:text-zinc-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-900 dark:text-zinc-200">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300 text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <DailySummaryAccordion
            totals={totals}
            goals={goals}
            userSettings={userSettings}
          />
          <div className="mb-6 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Meals
            </h2>
            <HelpButton
              title="How to Use"
              content="Click 'Add Food' at the bottom of each meal section to log foods. Click on any food item to adjust the serving size. Click the 'Remove' button to delete a food from your diary. Your daily totals are calculated automatically and displayed at the top."
              ariaLabel="Help: How to add and manage foods"
            />
          </div>
          {meals.map((meal, mealIndex) => (
            <div key={meal.name} className="mb-8">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
                {meal.name}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                <table className="w-full border-collapse bg-white dark:bg-zinc-950">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                        Food Item
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                        Calories
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setEditTarget({
                            mealIndex,
                            itemId: item.id,
                          });
                          setShowEditForm(true);
                        }}
                        className="cursor-pointer border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <td className="px-4 py-3">
                          <p className="text-black dark:text-zinc-50 font-medium">
                            {item.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {(() => {
                              const actualAmount = Number(
                                (item.serving * item.measurementAmount).toFixed(
                                  2,
                                ),
                              );
                              const parsed = getMeasurementInputLabel(
                                item.measurementType,
                                userSettings,
                              );
                              const amountStr = `${actualAmount}${parsed.inputUnit}`;
                              if (
                                item.defaultServingDescription &&
                                item.defaultServingAmount
                              ) {
                                const servingQty = Number(
                                  (
                                    actualAmount / item.defaultServingAmount
                                  ).toFixed(1),
                                );
                                const qtyStr =
                                  servingQty === 1
                                    ? item.defaultServingDescription
                                    : `${servingQty} × ${item.defaultServingDescription}`;
                                return `${amountStr} (${qtyStr})`;
                              }
                              return amountStr;
                            })()}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {formatCalories(item.calories, userSettings)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              showDeleteModal(mealIndex, item.id);
                            }}
                            className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                      <td className="px-4 py-3 text-black dark:text-zinc-50 font-semibold">
                        Total
                      </td>
                      <td className="px-4 py-3 text-sm text-black dark:text-zinc-50 font-semibold">
                        {formatCalories(
                          getMealTotals(mealIndex).calories,
                          userSettings,
                        )}
                      </td>
                      <td className="px-4 py-3"></td>
                    </tr>
                    <tr
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() => {
                        setSelectedMealIndex(mealIndex);
                        setShowFoodList(true);
                      }}
                    >
                      <td colSpan={3} className="px-4 py-3">
                        <p className="w-full text-left text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors font-medium">
                          Add Food
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FoodListSidebar
        isOpen={showFoodList}
        onClose={() => {
          setShowFoodList(false);
          setSelectedMealIndex(null);
          setError(null);
        }}
        onSelectFood={addFoodFromList}
        onOpenCreateForm={() => {
          setError(null);
          setShowCreateForm(true);
        }}
        userSettings={userSettings}
        isLoading={isLoadingFood}
      />

      <CreateFoodSidebar
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setError(null);
        }}
        onSubmit={addCustomFood}
        userSettings={userSettings}
        isLoading={isLoadingCustom}
      />

      <EditFoodSidebar
        isOpen={showEditForm}
        food={selectedFood}
        onClose={() => {
          setShowEditForm(false);
          setEditTarget(null);
          setError(null);
        }}
        onSubmit={applyServingChange}
        userSettings={userSettings}
        isLoading={isLoadingServing}
      />

      <DeleteFoodModal
        isOpen={showDeleteConfirm}
        item={deleteItem}
        mealName={deleteTarget ? mealTypeByIndex[deleteTarget.mealIndex] : ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
          setError(null);
        }}
        isLoading={isDeleting}
        error={error}
        userSettings={userSettings}
      />
    </div>
  );
}
