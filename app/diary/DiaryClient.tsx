"use client";

import { useMemo, useState } from "react";
import FoodListSidebar from "../components/FoodListSidebar";
import CreateFoodSidebar from "../components/CreateFoodSidebar";
import EditFoodSidebar from "../components/EditFoodSidebar";
import DeleteFoodModal from "../components/DeleteFoodModal";
import DailySummaryAccordion from "../components/DailySummaryAccordion";
import { formatCalories } from "@/lib/unitConversions";
import type { FoodItem, Meal } from "./types";

interface DiaryClientProps {
  initialMeals: Meal[];
  initialFoods: FoodItem[];
  activeDate: string;
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
  userGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function DiaryClient({
  initialMeals,
  initialFoods,
  activeDate,
  userSettings,
  userGoals,
}: DiaryClientProps) {
  const [goals] = useState(userGoals);

  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const [meals, setMeals] = useState<Meal[]>(initialMeals);

  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null,
  );
  const [showFoodList, setShowFoodList] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editServingValue, setEditServingValue] = useState("1");
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

  const mapFoodToItem = (food: {
    id: string;
    name: string;
    measurement: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }): FoodItem => ({
    id: food.id,
    name: food.name,
    measurement: food.measurement,
    calories: food.calories,
    baseCalories: food.calories,
    serving: 1,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    baseProtein: food.protein,
    baseCarbs: food.carbs,
    baseFat: food.fat,
  });

  const totals = useMemo(() => {
    const allItems = meals.flatMap((meal) => meal.items);
    return {
      calories: allItems.reduce((sum, item) => sum + item.calories, 0),
      protein: allItems.reduce((sum, item) => sum + item.protein, 0),
      carbs: allItems.reduce((sum, item) => sum + item.carbs, 0),
      fat: allItems.reduce((sum, item) => sum + item.fat, 0),
    };
  }, [meals]);

  const getMealTotals = (mealIndex: number) => {
    const items = meals[mealIndex].items;
    return {
      calories: items.reduce((sum, item) => sum + item.calories, 0),
      protein: items.reduce((sum, item) => sum + item.protein, 0),
      carbs: items.reduce((sum, item) => sum + item.carbs, 0),
      fat: items.reduce((sum, item) => sum + item.fat, 0),
    };
  };

  const addFoodFromList = async (food: FoodItem) => {
    if (selectedMealIndex === null) return;

    setIsLoadingFood(true);
    setError(null);

    try {
      const response = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: mealTypeByIndex[selectedMealIndex],
          foodId: food.id,
          serving: 1,
          date: activeDate,
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

  const addCustomFood = async (formData: {
    name: string;
    measurement: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
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

      const created = await createResponse.json();
      if (created.food) {
        setFoods((prev) => [...prev, mapFoodToItem(created.food)]);
      }

      if (created.food?.id) {
        const entryResponse = await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealType: mealTypeByIndex[selectedMealIndex],
            foodId: created.food.id,
            serving: 1,
            date: activeDate,
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
    } catch (err) {
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

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Diary
          </h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
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
                          setEditServingValue(String(item.serving));
                          setShowEditForm(true);
                        }}
                        className="cursor-pointer border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      >
                        <td className="px-4 py-3">
                          <p className="text-black dark:text-zinc-50 font-medium">
                            {item.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {item.measurement}
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
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
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
        foods={foods}
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
        servingValue={editServingValue}
        onServingChange={setEditServingValue}
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
