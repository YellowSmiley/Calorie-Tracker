"use client";

import {
  getCalorieForDisplay,
  getVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import HelpButton from "../../components/HelpButton";
import { UserSettings } from "../../settings/types";
import LoadingButton from "@/app/components/LoadingButton";
import AppModal from "@/app/components/AppModal";
import { formatFoodNameForDisplay } from "@/lib/foodNameDisplay";
import { trackEvent } from "@/app/components/analyticsEvents";

type DeleteFoodModalItem = {
  name: string;
  measurementType: string;
  measurementAmount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
};

interface DeleteFoodModalProps {
  item: DeleteFoodModalItem | null;
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
    <AppModal
      isOpen={isOpen && !!item}
      onClose={onCancel}
      title="Remove Food Item?"
      headerRight={
        <HelpButton
          title="Remove Food"
          ariaLabel="Help: How to remove a food item"
        >
          <p>Click Remove to delete this food item from your meal.</p>
          <p>This decreases your daily totals.</p>
          <p>You can always add the food back if you change your mind.</p>
        </HelpButton>
      }
      dataTestId="delete-food-modal"
      bodyClassName="p-4 space-y-4 max-h-[calc(100vh-8.5rem)] overflow-y-auto sm:max-h-none"
      footer={
        <div className="flex gap-3 sm:flex-row flex-col">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-food-cancel"
          >
            Cancel
          </button>
          <LoadingButton
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              trackEvent("delete_food_confirmed", {
                // No personally identifiable information should be included in analytics events.
              });
              onConfirm();
            }}
            isLoading={isLoading}
            loadingLabel="Removing item..."
            spinnerClassName="h-4 w-4"
            className="ct-button-danger-solid flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-food-confirm"
          >
            Remove Item
          </LoadingButton>
        </div>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Are you sure you want to remove this item from{" "}
        <span className="font-medium text-black dark:text-zinc-50">
          {mealName}
        </span>
        ?
      </p>

      {error && (
        <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 border border-zinc-300 dark:border-zinc-700">
          <p className="text-sm text-zinc-900 dark:text-zinc-200">{error}</p>
        </div>
      )}

      {/* Item Details */}
      <div
        className="rounded-lg bg-zinc-50 dark:bg-black p-4 space-y-3 border border-zinc-200 dark:border-zinc-800"
        data-testid="delete-food-details"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium text-black dark:text-zinc-50">
              {formatFoodNameForDisplay(item.name)}
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
            <span className="text-zinc-600 dark:text-zinc-400">Calories:</span>
            <span
              className="font-medium text-black dark:text-zinc-50"
              data-testid="delete-food-calories"
            >
              {getCalorieForDisplay(item.calories, userSettings.calorieUnit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Protein:</span>
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
            <span className="text-zinc-600 dark:text-zinc-400">Saturates:</span>
            <span
              className="font-medium text-black dark:text-zinc-50"
              data-testid="delete-food-saturates"
            >
              {getWeightForDisplay(item.saturates, userSettings.weightUnit)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Sugars:</span>
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
    </AppModal>
  );
}
