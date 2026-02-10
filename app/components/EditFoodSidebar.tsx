"use client";

import { useMemo } from "react";
import type { FoodItem } from "../diary/types";
import {
  formatCalories,
  formatMacro,
  parseMeasurement,
} from "@/lib/unitConversions";

interface EditFoodSidebarProps {
  isOpen: boolean;
  food: FoodItem | null;
  amountValue: string;
  onAmountChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (serving: number) => void;
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
  };
  isLoading?: boolean;
}

export default function EditFoodSidebar({
  isOpen,
  food,
  amountValue,
  onAmountChange,
  onClose,
  onSubmit,
  userSettings,
  isLoading = false,
}: EditFoodSidebarProps) {
  const parsed = useMemo(
    () => parseMeasurement(food?.measurement || "1 serving"),
    [food?.measurement],
  );

  const calculatedNutrition = useMemo(() => {
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const amount = parseFloat(amountValue) || 0;
    const serving = amount / parsed.amount;
    return {
      calories: Number((food.baseCalories * serving).toFixed(1)),
      protein: Number((food.baseProtein * serving).toFixed(1)),
      carbs: Number((food.baseCarbs * serving).toFixed(1)),
      fat: Number((food.baseFat * serving).toFixed(1)),
    };
  }, [food, amountValue, parsed.amount]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amount = parseFloat(amountValue);
    const serving = (Number.isNaN(amount) ? 0 : amount) / parsed.amount;
    onSubmit(serving);
  };

  return (
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
          Edit Serving
        </h2>
        <div className="w-12" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {/* Food Name - Centered */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-black dark:text-zinc-50 mb-2">
                {food?.name || ""}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Per serving: {food?.measurement || ""}
              </p>
            </div>

            {/* Base Nutrition Info */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
              <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                Base Nutrition (1 serving)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Calories
                  </p>
                  <p className="text-lg font-semibold text-black dark:text-zinc-50">
                    {formatCalories(food?.baseCalories || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Protein
                  </p>
                  <p className="text-lg font-semibold text-black dark:text-zinc-50">
                    {formatMacro(food?.baseProtein || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Carbs
                  </p>
                  <p className="text-lg font-semibold text-black dark:text-zinc-50">
                    {formatMacro(food?.baseCarbs || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Fat
                  </p>
                  <p className="text-lg font-semibold text-black dark:text-zinc-50">
                    {formatMacro(food?.baseFat || 0, userSettings)}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
              <label className="block text-sm font-semibold text-black dark:text-zinc-50 mb-2">
                {parsed.inputLabel}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={amountValue}
                  onChange={(e) => onAmountChange(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 bg-transparent text-black dark:text-zinc-50 text-lg font-medium text-center pr-14"
                  placeholder={String(parsed.amount)}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500 dark:text-zinc-400">
                  {parsed.inputUnit}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center mt-2">
                {amountValue
                  ? `${amountValue}${parsed.inputUnit}${parsed.description ? ` ${parsed.description}` : ""} (base: ${food?.measurement || ""})`
                  : `Enter amount in ${parsed.inputUnit}`}
              </p>
            </div>

            {/* Calculated Nutrition */}
            <div className="rounded-lg border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 p-4">
              <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-black dark:text-zinc-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Your Total Nutrition
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Calories
                  </p>
                  <p className="text-xl font-bold text-black dark:text-zinc-50">
                    {formatCalories(calculatedNutrition.calories, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Protein
                  </p>
                  <p className="text-xl font-bold text-black dark:text-zinc-50">
                    {formatMacro(calculatedNutrition.protein, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Carbs
                  </p>
                  <p className="text-xl font-bold text-black dark:text-zinc-50">
                    {formatMacro(calculatedNutrition.carbs, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    Fat
                  </p>
                  <p className="text-xl font-bold text-black dark:text-zinc-50">
                    {formatMacro(calculatedNutrition.fat, userSettings)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="submit"
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Updating..." : "Update Serving"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
