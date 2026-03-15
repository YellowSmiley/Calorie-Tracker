"use client";

import { useEffect, useMemo, useState } from "react";
import FoodListSidebar from "@/app/diary/components/FoodListSidebar";
import EditFoodSidebar from "@/app/diary/components/EditFoodSidebar";
import MealItemRow from "@/app/diary/components/MealItemRow";
import { UserSettings } from "../types";
import { FoodItem } from "@/app/diary/types";
import {
  FavoriteMealDetail,
  FavoriteMealItem,
} from "@/app/meal-favorites/types";
import { getCalorieForDisplay } from "@/lib/unitConversions";
import ValidatedTextField from "@/app/components/ValidatedTextField";

interface FavoriteMealEditorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userSettings: UserSettings;
  editingFavorite: FavoriteMealDetail | null;
  onSaved: () => void;
  onError: (message: string | null) => void;
}

const buildFavoriteItemFromFood = (
  food: FoodItem,
  serving: number,
): FavoriteMealItem => ({
  id: `favorite-item-${crypto.randomUUID()}`,
  foodId: food.id,
  name: food.name,
  measurementType: food.measurementType,
  measurementAmount: food.measurementAmount,
  calories: Number((food.baseCalories * serving).toFixed(1)),
  baseCalories: food.baseCalories,
  serving,
  protein: Number((food.baseProtein * serving).toFixed(1)),
  carbs: Number((food.baseCarbs * serving).toFixed(1)),
  fat: Number((food.baseFat * serving).toFixed(1)),
  saturates: Number((food.baseSaturates * serving).toFixed(1)),
  sugars: Number((food.baseSugars * serving).toFixed(1)),
  fibre: Number((food.baseFibre * serving).toFixed(1)),
  salt: Number((food.baseSalt * serving).toFixed(1)),
  baseProtein: food.baseProtein,
  baseCarbs: food.baseCarbs,
  baseFat: food.baseFat,
  baseSaturates: food.baseSaturates,
  baseSugars: food.baseSugars,
  baseFibre: food.baseFibre,
  baseSalt: food.baseSalt,
  defaultServingAmount: food.defaultServingAmount,
  defaultServingDescription: food.defaultServingDescription,
  sortOrder: 0,
});

export default function FavoriteMealEditorSidebar({
  isOpen,
  onClose,
  userSettings,
  editingFavorite,
  onSaved,
  onError,
}: FavoriteMealEditorSidebarProps) {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<FavoriteMealItem[]>([]);
  const [showFoodList, setShowFoodList] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingFood, setIsLoadingFood] = useState(false);

  const selectedFood = useMemo(() => {
    if (!editTargetId) return null;
    return items.find((item) => item.id === editTargetId) || null;
  }, [editTargetId, items]);

  const totalCalories = useMemo(
    () => items.reduce((sum, item) => sum + item.calories, 0),
    [items],
  );

  useEffect(() => {
    if (!isOpen) return;

    if (editingFavorite) {
      setName(editingFavorite.name);
      setNameError(undefined);
      setItems(editingFavorite.items);
      return;
    }

    setName("");
    setNameError(undefined);
    setItems([]);
    setEditTargetId(null);
  }, [editingFavorite, isOpen]);

  const handleAddFood = async (food: FoodItem, servingAmount: number = 1) => {
    setIsLoadingFood(true);
    onError(null);

    try {
      let servingMultiplier = 1;
      if (servingAmount || food.defaultServingAmount) {
        servingMultiplier =
          ((servingAmount || food.defaultServingAmount) ?? 0) /
          food.measurementAmount;
      }

      const newItem = buildFavoriteItemFromFood(food, servingMultiplier);
      setItems((prev) => [
        ...prev,
        {
          ...newItem,
          sortOrder: prev.length,
        },
      ]);
      setShowFoodList(false);
    } finally {
      setIsLoadingFood(false);
    }
  };

  const handleServingChange = async (serving: number) => {
    if (!editTargetId) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== editTargetId) return item;
        return {
          ...item,
          serving,
          calories: Number((item.baseCalories * serving).toFixed(1)),
          protein: Number((item.baseProtein * serving).toFixed(1)),
          carbs: Number((item.baseCarbs * serving).toFixed(1)),
          fat: Number((item.baseFat * serving).toFixed(1)),
          saturates: Number((item.baseSaturates * serving).toFixed(1)),
          sugars: Number((item.baseSugars * serving).toFixed(1)),
          fibre: Number((item.baseFibre * serving).toFixed(1)),
          salt: Number((item.baseSalt * serving).toFixed(1)),
        };
      }),
    );

    setEditTargetId(null);
  };

  const handleRemoveFood = (itemId: string) => {
    setItems((prev) =>
      prev
        .filter((item) => item.id !== itemId)
        .map((item, index) => ({ ...item, sortOrder: index })),
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError("Favorite name is required.");
      return;
    }

    setNameError(undefined);

    if (items.length === 0) {
      onError("Add at least one food item to save this favorite");
      return;
    }

    setIsSaving(true);
    onError(null);

    try {
      const payload = {
        name: name.trim(),
        items: items.map((item) => ({
          foodId: item.foodId,
          serving: item.serving,
        })),
      };

      const response = await fetch(
        editingFavorite
          ? `/api/meal-favorites/${editingFavorite.id}`
          : "/api/meal-favorites",
        {
          method: editingFavorite ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to save favorite");
      }

      onSaved();
      onClose();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save favorite");
    } finally {
      setIsSaving(false);
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
            onClick={onClose}
            className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
          >
            Back
          </button>
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {editingFavorite ? "Edit Favorite" : "Create Favorite"}
          </h2>
          <div className="w-12" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-4">
            <ValidatedTextField
              id="favorite-name"
              label="Favorite Name"
              value={name}
              onChange={(value) => {
                setName(value);
                if (nameError && value.trim()) {
                  setNameError(undefined);
                }
              }}
              onBlur={() => {
                if (!name.trim()) {
                  setNameError("Favorite name is required.");
                }
              }}
              placeholder="e.g. High Protein Breakfast"
              dataTestId="favorite-name-input"
              error={nameError}
              required
            />

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
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
                  {items.map((item) => (
                    <MealItemRow
                      key={item.id}
                      item={item}
                      mealIndex={0}
                      userSettings={userSettings}
                      onEdit={(_mealIndex, itemId) => setEditTargetId(itemId)}
                      onRemove={(_mealIndex, itemId) =>
                        handleRemoveFood(itemId)
                      }
                    />
                  ))}
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-3 text-black dark:text-zinc-50 font-semibold">
                      Total
                    </td>
                    <td className="px-4 py-3 text-sm text-black dark:text-zinc-50 font-semibold">
                      {getCalorieForDisplay(
                        totalCalories,
                        userSettings.calorieUnit,
                      )}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-center">
                      <button
                        type="button"
                        className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-center text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                        onClick={() => setShowFoodList(true)}
                        data-testid="favorite-add-food-button"
                      >
                        Add Food
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-lg bg-foreground text-background px-6 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              data-testid="favorite-save-button"
            >
              {isSaving
                ? "Saving..."
                : editingFavorite
                  ? "Save Favorite"
                  : "Create Favorite"}
            </button>
          </div>
        </div>
      </div>

      <FoodListSidebar
        isOpen={showFoodList}
        onClose={() => setShowFoodList(false)}
        onSelectFood={handleAddFood}
        onOpenCreateForm={() => {
          onError("Create food from Settings > My Foods, then add it here.");
        }}
        userSettings={userSettings}
        isLoading={isLoadingFood}
      />

      <EditFoodSidebar
        isOpen={Boolean(editTargetId)}
        food={selectedFood}
        onClose={() => setEditTargetId(null)}
        onSubmit={handleServingChange}
        userSettings={userSettings}
        isLoading={false}
      />
    </>
  );
}
