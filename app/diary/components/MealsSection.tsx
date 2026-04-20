"use client";

import { useMemo, useState } from "react";
import FoodListSidebar from "./FoodListSidebar";
import CreateFoodSidebar, {
  CreateFoodSidebarOnSubmitData,
} from "./create-food-sidebar/CreateFoodSidebar";
import { getApiErrorMessage } from "@/lib/apiError";
import EditFoodSidebar from "./EditFoodSidebar";
import DeleteFoodModal from "./DeleteFoodModal";
import MealItemRow from "./MealItemRow";
import MealFavoritesPickerSidebar from "./MealFavoritesPickerSidebar";
import SaveMealFavoriteModal from "./SaveMealFavoriteModal";
import NutritionSummaryAccordion from "./NutritionSummaryAccordion";
import HelpButton from "@/app/components/HelpButton";
import LoadingButton from "@/app/components/LoadingButton";
import { getCalorieForDisplay } from "@/lib/unitConversions";
import { calculateNutritionTotals } from "@/lib/nutritionSummary";
import type { FoodItem, Meal } from "../types";
import { UserSettings } from "@/app/settings/types";
import { FoodWithCreator } from "@/app/api/admin/foods/route";
import { MealType } from "@/app/meal-favorites/types";

interface MealsSectionProps {
  meals: Meal[];
  setMeals: React.Dispatch<React.SetStateAction<Meal[]>>;
  currentDate: string;
  userSettings: UserSettings;
  error: string | null;
  onError: (message: string | null) => void;
}

export default function MealsSection({
  meals,
  setMeals,
  currentDate,
  userSettings,
  error,
  onError,
}: MealsSectionProps) {
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

  const [isLoadingFood, setIsLoadingFood] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);
  const [isLoadingServing, setIsLoadingServing] = useState(false);
  const [favoritePickerMealIndex, setFavoritePickerMealIndex] = useState<
    number | null
  >(null);
  const [clearMealIndex, setClearMealIndex] = useState<number | null>(null);
  const [isSavingFavorite, setIsSavingFavorite] = useState(false);
  const [isClearingMeal, setIsClearingMeal] = useState(false);
  const [saveFavoriteMealIndex, setSaveFavoriteMealIndex] = useState<
    number | null
  >(null);
  const [saveFavoriteName, setSaveFavoriteName] = useState("");

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

  const getMealTotals = (mealIndex: number) => {
    return calculateNutritionTotals(meals[mealIndex].items);
  };

  const addFoodFromList = async (food: FoodItem, serving: number = 1) => {
    if (selectedMealIndex === null) return;

    setIsLoadingFood(true);
    onError(null);

    try {
      let servingMultiplier = 1;
      if (serving || food.defaultServingAmount) {
        servingMultiplier =
          ((serving || food.defaultServingAmount) ?? 0) /
          food.measurementAmount;
      }

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

      const data = (await response.json()) as { item: FoodItem };
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
      onError(err instanceof Error ? err.message : "Failed to add food");
    } finally {
      setIsLoadingFood(false);
    }
  };

  const addCustomFood = async (formData: CreateFoodSidebarOnSubmitData) => {
    if (selectedMealIndex === null || !formData.name) return;

    setIsLoadingCustom(true);
    onError(null);

    try {
      const createResponse = await fetch("/api/admin/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!createResponse.ok) {
        throw new Error(
          await getApiErrorMessage(createResponse, "Failed to create food"),
        );
      }

      const created = (await createResponse.json()) as FoodWithCreator;

      if (created.id) {
        let servingMultiplier = 1;
        if (created.defaultServingAmount) {
          servingMultiplier =
            created.defaultServingAmount / created.measurementAmount;
        }

        const entryResponse = await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mealType: mealTypeByIndex[selectedMealIndex],
            foodId: created.id,
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
      onError(err instanceof Error ? err.message : "Failed to add custom food");
    } finally {
      setIsLoadingCustom(false);
    }
  };

  const applyServingChange = async (serving: number) => {
    if (!editTarget) return;

    setIsLoadingServing(true);
    onError(null);

    try {
      const response = await fetch(`/api/meals/${editTarget.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serving }),
      });

      if (!response.ok) {
        throw new Error("Failed to update serving size");
      }

      const data = (await response.json()) as { item: FoodItem };
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
      onError(err instanceof Error ? err.message : "Failed to update serving");
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
      onError(err instanceof Error ? err.message : "Failed to remove food");
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    onError(null);

    try {
      await removeFood(deleteTarget.mealIndex, deleteTarget.itemId);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch {
      // Error is already handled in removeFood
    } finally {
      setIsDeleting(false);
    }
  };

  const showDeleteModal = (mealIndex: number, itemId: string) => {
    onError(null);
    setDeleteTarget({ mealIndex, itemId });
    setShowDeleteConfirm(true);
  };

  const refreshMealsForDate = async () => {
    const response = await fetch(`/api/meals?date=${currentDate}`);
    if (!response.ok) {
      throw new Error("Failed to refresh meals");
    }
    const data = (await response.json()) as { meals: Meal[] };
    setMeals(data.meals);
  };

  const handleSaveMealAsFavorite = async (mealIndex: number, name: string) => {
    setIsSavingFavorite(true);
    onError(null);

    try {
      const response = await fetch("/api/meal-favorites/save-current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          mealType: mealTypeByIndex[mealIndex],
          date: currentDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to save favorite");
      }

      setSaveFavoriteMealIndex(null);
      setSaveFavoriteName("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save favorite");
    } finally {
      setIsSavingFavorite(false);
    }
  };

  const handleClearMeal = async () => {
    if (clearMealIndex === null) return;

    setIsClearingMeal(true);
    onError(null);

    try {
      const response = await fetch("/api/meal-favorites/clear-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType: mealTypeByIndex[clearMealIndex],
          date: currentDate,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to clear meal");
      }

      setMeals((prev) =>
        prev.map((meal, index) =>
          index === clearMealIndex ? { ...meal, items: [] } : meal,
        ),
      );
      setClearMealIndex(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to clear meal");
    } finally {
      setIsClearingMeal(false);
    }
  };

  return (
    <>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
        <div className="mb-6 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Meals
          </h2>
          <HelpButton
            title="How to Use"
            ariaLabel="Help: How to add and manage foods"
          >
            <p>Step 1: Click Add Item at the bottom of a meal section.</p>
            <p>
              Step 2: Select a food, then enter serving size and quantity before
              confirming.
            </p>
            <p>Click any logged food item later to adjust serving size.</p>
            <p>
              Click Remove to delete a food from your diary. Daily totals update
              automatically.
            </p>
          </HelpButton>
        </div>
        {meals.map((meal, mealIndex) => (
          <div
            key={meal.name}
            className="mb-8 last:mb-0"
            data-testid={`diary-meal-${meal.name.toLowerCase()}`}
          >
            {(() => {
              const mealTotals = getMealTotals(mealIndex);

              return (
                <>
                  <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
                    {meal.name}
                  </h2>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onError(null);
                        setSaveFavoriteMealIndex(mealIndex);
                        setSaveFavoriteName(`${meal.name} Favorite`);
                      }}
                      disabled={isSavingFavorite}
                      className="ct-button-secondary h-10 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50"
                      data-testid={`save-favorite-${meal.name.toLowerCase()}`}
                    >
                      Save as Favorite
                    </button>
                    <button
                      type="button"
                      onClick={() => setFavoritePickerMealIndex(mealIndex)}
                      className="ct-button-secondary h-10 rounded-lg px-4 text-sm font-medium transition-colors"
                      data-testid={`apply-favorite-${meal.name.toLowerCase()}`}
                    >
                      Apply Favorite
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearMealIndex(mealIndex)}
                      className="ct-button-secondary h-10 rounded-lg px-4 text-sm font-medium transition-colors"
                      data-testid={`clear-meal-${meal.name.toLowerCase()}`}
                    >
                      Clear Meal
                    </button>
                    <HelpButton
                      title="Favorite Meals"
                      ariaLabel={`Help: Favorite meals for ${meal.name}`}
                    >
                      <p>
                        Save the current meal as a favorite so you can reuse it
                        later.
                      </p>
                      <p>
                        Use Apply Favorite to replace this meal with a saved
                        favorite.
                      </p>
                      <p>
                        The apply list includes search, item previews, nutrition
                        totals, and usage-based ordering.
                      </p>
                    </HelpButton>
                  </div>
                  <NutritionSummaryAccordion
                    title={`${meal.name} Summary`}
                    totals={mealTotals}
                    userSettings={userSettings}
                    testIdPrefix={`meal-summary-${meal.name.toLowerCase()}`}
                    className="mb-3"
                  />
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full border-collapse bg-white dark:bg-black">
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
                          <MealItemRow
                            key={item.id}
                            item={item}
                            mealIndex={mealIndex}
                            userSettings={userSettings}
                            onEdit={(targetMealIndex, itemId) => {
                              setEditTarget({
                                mealIndex: targetMealIndex,
                                itemId,
                              });
                              setShowEditForm(true);
                            }}
                            onRemove={showDeleteModal}
                          />
                        ))}
                        <tr
                          className="border-b border-zinc-200 dark:border-zinc-800"
                          data-testid={`diary-meal-total-${meal.name.toLowerCase()}`}
                        >
                          <td className="px-4 py-3 text-black dark:text-zinc-50 font-semibold">
                            Total
                          </td>
                          <td className="px-4 py-3 text-sm text-black dark:text-zinc-50 font-semibold">
                            {getCalorieForDisplay(
                              mealTotals.calories,
                              userSettings.calorieUnit,
                            )}
                          </td>
                          <td className="px-4 py-3"></td>
                        </tr>
                        <tr
                          data-testid={`diary-add-food-${meal.name.toLowerCase()}`}
                          onClick={() => {
                            setSelectedMealIndex(mealIndex);
                            setShowFoodList(true);
                          }}
                        >
                          <td colSpan={3} className="px-4 py-3 text-center">
                            <button
                              type="button"
                              className="ct-button-primary h-10 rounded-lg px-4 text-center text-sm font-medium transition-colors"
                              data-testid={`diary-add-food-button-${meal.name.toLowerCase()}`}
                            >
                              Add Item
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        ))}
      </div>

      <FoodListSidebar
        isOpen={showFoodList}
        onClose={() => {
          setShowFoodList(false);
          setSelectedMealIndex(null);
          onError(null);
        }}
        onSelectFood={addFoodFromList}
        onOpenCreateForm={() => {
          onError(null);
          setShowCreateForm(true);
        }}
        userSettings={userSettings}
        isLoading={isLoadingFood}
      />

      <CreateFoodSidebar
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          onError(null);
        }}
        onSubmit={addCustomFood}
        userSettings={userSettings}
        isLoading={isLoadingCustom}
        error={error}
      />

      <EditFoodSidebar
        isOpen={showEditForm}
        food={selectedFood}
        onClose={() => {
          setShowEditForm(false);
          setEditTarget(null);
          onError(null);
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
          onError(null);
        }}
        isLoading={isDeleting}
        error={error}
        userSettings={userSettings}
      />

      {favoritePickerMealIndex !== null && (
        <MealFavoritesPickerSidebar
          isOpen={favoritePickerMealIndex !== null}
          targetMealType={mealTypeByIndex[favoritePickerMealIndex] as MealType}
          currentDate={currentDate}
          userSettings={userSettings}
          onClose={() => setFavoritePickerMealIndex(null)}
          onApplied={refreshMealsForDate}
          onError={onError}
        />
      )}

      {clearMealIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div
            className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                Clear Meal?
              </h2>
            </div>
            <div className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Remove all foods from
                <span className="font-medium text-black dark:text-zinc-50">
                  {` ${meals[clearMealIndex]?.name}`}
                </span>
                ?
              </p>
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex gap-3">
              <button
                onClick={() => setClearMealIndex(null)}
                disabled={isClearingMeal}
                className="ct-button-secondary h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <LoadingButton
                onClick={handleClearMeal}
                isLoading={isClearingMeal}
                loadingLabel="Clearing meal..."
                spinnerClassName="h-4 w-4"
                className="ct-button-danger-solid h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Clear Meal
              </LoadingButton>
            </div>
          </div>
        </div>
      )}

      {saveFavoriteMealIndex !== null && (
        <SaveMealFavoriteModal
          isOpen={saveFavoriteMealIndex !== null}
          mealName={meals[saveFavoriteMealIndex]?.name ?? "Meal"}
          items={meals[saveFavoriteMealIndex]?.items ?? []}
          userSettings={userSettings}
          favoriteName={saveFavoriteName}
          error={error}
          onFavoriteNameChange={setSaveFavoriteName}
          isLoading={isSavingFavorite}
          onCancel={() => {
            if (isSavingFavorite) return;
            setSaveFavoriteMealIndex(null);
            setSaveFavoriteName("");
          }}
          onConfirm={(name) =>
            handleSaveMealAsFavorite(saveFavoriteMealIndex, name)
          }
        />
      )}
    </>
  );
}
