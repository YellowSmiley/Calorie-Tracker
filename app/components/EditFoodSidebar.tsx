"use client";

import { useMemo } from "react";
import type { FoodItem } from "../diary/types";

interface EditFoodSidebarProps {
  isOpen: boolean;
  food: FoodItem | null;
  servingValue: string;
  onServingChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (serving: number) => void;
}

export default function EditFoodSidebar({
  isOpen,
  food,
  servingValue,
  onServingChange,
  onClose,
  onSubmit,
}: EditFoodSidebarProps) {
  const calculatedCalories = useMemo(() => {
    if (!food) return 0;
    const serving = parseFloat(servingValue);
    if (Number.isNaN(serving)) return 0;
    return Number((food.baseCalories * serving).toFixed(1));
  }, [food, servingValue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const serving = parseFloat(servingValue);
    onSubmit(Number.isNaN(serving) ? 0 : serving);
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
          Edit Food
        </h2>
        <div className="w-12" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Food</p>
                <p className="text-base font-medium text-black dark:text-zinc-50">
                  {food?.name || ""}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {food?.measurement || ""}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Serving
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={servingValue}
                  onChange={(e) => onServingChange(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="1"
                />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Calories: {calculatedCalories}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Update
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
