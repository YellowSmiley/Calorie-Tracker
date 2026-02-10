"use client";

import { useState } from "react";
import { FoodItem } from "../diary/types";
import { formatCalories, parseMeasurement } from "@/lib/unitConversions";

interface FoodListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, quantity: number) => void;
  onOpenCreateForm: () => void;
  foods: FoodItem[];
  isLoading?: boolean;
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
  };
}

export default function FoodListSidebar({
  isOpen,
  onClose,
  onSelectFood,
  onOpenCreateForm,
  foods,
  isLoading = false,
  userSettings,
}: FoodListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const filteredFoods = foods.filter(
    (food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.measurement.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getQty = (foodId: string): number => {
    const raw = quantities[foodId];
    if (raw === undefined || raw === "") return 0;
    const n = parseInt(raw);
    return isNaN(n) || n < 1 ? 0 : n;
  };

  const handleClose = () => {
    setSearchQuery("");
    setQuantities({});
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    const qty = getQty(food.id) || 1;
    onSelectFood(food, qty);
    setSearchQuery("");
    setQuantities({});
  };

  const getServingDisplay = (food: FoodItem) => {
    const parsed = parseMeasurement(food.measurement);
    const unit = parsed.inputUnit;

    if (food.defaultServingAmount) {
      const servingRatio = food.defaultServingAmount / parsed.amount;
      const servingCals = Math.round(food.baseCalories * servingRatio);
      const desc = food.defaultServingDescription
        ? ` · ${food.defaultServingDescription}`
        : "";
      return {
        line: `${food.defaultServingAmount}${unit}${desc}`,
        calories: servingCals,
      };
    }
    return {
      line: `${parsed.amount}${unit}${parsed.description ? ` ${parsed.description}` : ""}`,
      calories: food.baseCalories,
    };
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={handleClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Select Food
        </h2>
        <div className="w-12" />
      </div>

      {/* Search Box */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl">
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600"
          />
        </div>
      </div>

      {/* Food List */}
      <div className="flex-1 overflow-y-auto pb-24 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Adding food...
            </div>
          </div>
        )}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-w-3xl mx-auto">
          {filteredFoods.map((food) => (
            <div key={food.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-zinc-50">
                  {food.name}
                </p>
                {(() => {
                  const serving = getServingDisplay(food);
                  return (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {serving.line} •{" "}
                      {formatCalories(serving.calories, userSettings)}
                    </p>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-zinc-400 dark:text-zinc-500">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantities[food.id] ?? "1"}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [food.id]: e.target.value,
                    }))
                  }
                  className="w-14 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-center text-sm bg-transparent text-black dark:text-zinc-50"
                />
                <button
                  onClick={() => handleSelectFood(food)}
                  disabled={isLoading || !getQty(food.id)}
                  className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-3 py-1 text-sm font-medium text-black dark:text-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Button - Fixed at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl">
          <button
            onClick={onOpenCreateForm}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
