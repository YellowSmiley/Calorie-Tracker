"use client";

import { useState } from "react";
import type { FoodItem } from "../types";
import type { UserSettings } from "@/app/settings/types";
import {
  getCalorieForDisplay,
  getVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import { formatFoodNameForDisplay } from "@/lib/foodNameDisplay";
import HelpButton from "@/app/components/HelpButton";
import LoadingButton from "@/app/components/LoadingButton";
import AppModal from "@/app/components/AppModal";

interface SaveMealFavoriteModalProps {
  isOpen: boolean;
  mealName: string;
  items: FoodItem[];
  userSettings: UserSettings;
  favoriteName: string;
  error?: string | null;
  onFavoriteNameChange: (value: string) => void;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: (name: string) => void;
}

export default function SaveMealFavoriteModal({
  isOpen,
  mealName,
  items,
  userSettings,
  favoriteName,
  error = null,
  onFavoriteNameChange,
  isLoading = false,
  onCancel,
  onConfirm,
}: SaveMealFavoriteModalProps) {
  const [fieldError, setFieldError] = useState<string | null>(null);

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = favoriteName.trim();
    if (!trimmed) {
      setFieldError("Favorite name is required");
      return;
    }

    setFieldError(null);
    onConfirm(trimmed);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onCancel}
      title="Save Meal as Favorite"
      headerRight={
        <HelpButton
          title="Save Meal as Favorite"
          ariaLabel="Help: Save meal as favorite"
        >
          <p>
            This saves all current meal items and serving sizes as a reusable
            favorite.
          </p>
          <p>
            Review the item list and totals, choose a clear name, then save.
          </p>
          <p>You can apply it later to any meal from the diary.</p>
        </HelpButton>
      }
      dataTestId="save-favorite-modal"
      bodyClassName="p-4 space-y-3 max-h-[calc(100vh-8.5rem)] overflow-y-auto sm:max-h-none"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50"
            data-testid="save-favorite-cancel"
          >
            Cancel
          </button>
          <LoadingButton
            type="button"
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingLabel="Saving favorite..."
            spinnerClassName="h-4 w-4"
            className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300 transition-colors disabled:opacity-50"
            data-testid="save-favorite-confirm"
          >
            Save Favorite
          </LoadingButton>
        </div>
      }
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Save the current <span className="font-medium">{mealName}</span> items
        as a reusable favorite.
      </p>

      {error && (
        <div
          className="rounded-lg border border-zinc-300 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-900"
          role="alert"
          aria-live="polite"
          data-testid="save-favorite-error"
        >
          <p className="text-sm text-zinc-900 dark:text-zinc-200">{error}</p>
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-3 py-2 bg-zinc-50 dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-medium text-black dark:text-zinc-50">
            Items to Save ({items.length})
          </p>
        </div>

        <div className="px-3 py-3 bg-zinc-50/80 dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
            Favorite Totals
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-black dark:text-zinc-50 sm:grid-cols-4">
            <span>
              {getCalorieForDisplay(totals.calories, userSettings.calorieUnit)}
            </span>
            <span>
              Protein:{" "}
              {getWeightForDisplay(totals.protein, userSettings.weightUnit)}
            </span>
            <span>
              Carbs:{" "}
              {getWeightForDisplay(totals.carbs, userSettings.weightUnit)}
            </span>
            <span>
              Fat: {getWeightForDisplay(totals.fat, userSettings.weightUnit)}
            </span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.length === 0 ? (
            <p className="px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              No items in this meal.
            </p>
          ) : (
            items.map((item) => {
              const actualAmount = item.serving * item.measurementAmount;
              const amountStr =
                item.measurementType === "weight"
                  ? getWeightForDisplay(actualAmount, userSettings.weightUnit)
                  : getVolumeForDisplay(actualAmount, userSettings.volumeUnit);

              return (
                <div key={item.id} className="px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-black dark:text-zinc-50">
                        {formatFoodNameForDisplay(item.name)}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Serving: {amountStr}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-black dark:text-zinc-50">
                      {getCalorieForDisplay(
                        item.calories,
                        userSettings.calorieUnit,
                      )}
                    </p>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 sm:grid-cols-4">
                    <span>
                      Protein:{" "}
                      {getWeightForDisplay(
                        item.protein,
                        userSettings.weightUnit,
                      )}
                    </span>
                    <span>
                      Carbs:{" "}
                      {getWeightForDisplay(item.carbs, userSettings.weightUnit)}
                    </span>
                    <span>
                      Fat:{" "}
                      {getWeightForDisplay(item.fat, userSettings.weightUnit)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="save-favorite-name"
          className="mb-1 block text-sm font-medium text-black dark:text-zinc-50"
        >
          Favorite Name
        </label>
        <input
          id="save-favorite-name"
          type="text"
          value={favoriteName}
          onChange={(event) => {
            if (fieldError) setFieldError(null);
            onFavoriteNameChange(event.target.value);
          }}
          className={`w-full rounded-lg border px-3 py-2 bg-transparent text-black dark:text-zinc-50 ${
            fieldError
              ? "border-red-500 dark:border-red-500"
              : "border-zinc-200 dark:border-zinc-700"
          }`}
          placeholder="e.g. High Protein Breakfast"
          data-testid="save-favorite-name-input"
        />
        {fieldError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {fieldError}
          </p>
        )}
      </div>
    </AppModal>
  );
}
