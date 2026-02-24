"use client";

import {
  getCalorieForDisplay,
  getVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import HelpButton from "../../components/HelpButton";
import { UserSettings } from "../../settings/types";
import { FoodItem } from "../types";

interface DeleteFoodModalProps {
  item: FoodItem | null;
  mealName: string;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  userSettings: UserSettings;
}

export default function DeleteFoodModal({
  item,
  mealName,
  isOpen,
  isLoading = false,
  error = null,
  onConfirm,
  onCancel,
  userSettings,
}: DeleteFoodModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      data-testid="delete-food-modal"
      style={{ pointerEvents: "auto" }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-xl"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
              Remove Food Item?
            </h2>
            <HelpButton
              title="Remove Food"
              content="Click 'Remove' to delete this food item from your meal. This action will decrease your daily totals. You can always add the food back if you change your mind."
              ariaLabel="Help: How to remove a food item"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Are you sure you want to remove this item from{" "}
            <span className="font-medium text-black dark:text-zinc-50">
              {mealName}
            </span>
            ?
          </p>

          {error && (
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 border border-zinc-300 dark:border-zinc-700">
              <p className="text-sm text-zinc-900 dark:text-zinc-200">
                {error}
              </p>
            </div>
          )}

          {/* Item Details */}
          <div
            className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 space-y-3"
            data-testid="delete-food-details"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {item.name}
                </p>
                <p
                  className="text-sm text-zinc-600 dark:text-zinc-400 mt-1"
                  data-testid="delete-food-serving-size"
                >
                  {item.measurementType === "weight"
                    ? getWeightForDisplay(
                        item.measurementAmount,
                        userSettings.weightUnit,
                      )
                    : getVolumeForDisplay(
                        item.measurementAmount,
                        userSettings.volumeUnit,
                      )}
                </p>
              </div>
            </div>

            {/* Calories and Macros */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Calories:
                </span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-calories"
                >
                  {getCalorieForDisplay(
                    item.calories,
                    userSettings.calorieUnit,
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Protein:
                </span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-protein"
                >
                  {getWeightForDisplay(item.protein, userSettings.weightUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Carbs:</span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-carbs"
                >
                  {getWeightForDisplay(item.carbs, userSettings.weightUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Fat:</span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-fat"
                >
                  {getWeightForDisplay(item.fat, userSettings.weightUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Saturates:
                </span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-saturates"
                >
                  {getWeightForDisplay(item.saturates, userSettings.weightUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Sugars:
                </span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-sugars"
                >
                  {getWeightForDisplay(item.sugars, userSettings.weightUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Fibre:</span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-fibre"
                >
                  {getWeightForDisplay(item.fibre, userSettings.weightUnit)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Salt:</span>
                <span
                  className="font-medium text-black dark:text-zinc-50"
                  data-testid="delete-food-salt"
                >
                  {getWeightForDisplay(item.salt, userSettings.weightUnit)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex gap-3 sm:flex-row flex-col">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-food-cancel"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-food-confirm"
          >
            {isLoading ? "Removing..." : "Remove Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
