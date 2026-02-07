"use client";

import type { FoodItem } from "@/app/diary/types";
import { formatCalories, formatMacro } from "@/lib/unitConversions";

interface DeleteFoodModalProps {
  item: FoodItem | null;
  mealName: string;
  isOpen: boolean;
  isLoading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-xl">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Remove Food Item?
          </h2>
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
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-black dark:text-zinc-50">
                  {item.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  {item.measurement}
                </p>
              </div>
            </div>

            {/* Calories and Macros */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Calories:
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {formatCalories(item.calories, userSettings)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Protein:
                </span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {formatMacro(item.protein, userSettings)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Carbs:</span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {formatMacro(item.carbs, userSettings)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Fat:</span>
                <span className="font-medium text-black dark:text-zinc-50">
                  {formatMacro(item.fat, userSettings)}
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
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Removing..." : "Remove Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
