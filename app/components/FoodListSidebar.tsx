"use client";

import { useState } from "react";
import { FoodItem } from "../diary/page";

interface FoodListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem) => void;
  onOpenCreateForm: () => void;
}

export default function FoodListSidebar({
  isOpen,
  onClose,
  onSelectFood,
  onOpenCreateForm,
}: FoodListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const [FoodItems] = useState<FoodItem[]>([
    {
      id: "1",
      name: "Chicken Breast",
      measurement: "100g",
      calories: 165,
      baseCalories: 165,
      serving: 1,
    },
    {
      id: "2",
      name: "Brown Rice",
      measurement: "1 cup cooked",
      calories: 215,
      baseCalories: 215,
      serving: 1,
    },
    {
      id: "3",
      name: "Broccoli",
      measurement: "1 cup",
      calories: 55,
      baseCalories: 55,
      serving: 1,
    },
    {
      id: "4",
      name: "Eggs",
      measurement: "1 large",
      calories: 78,
      baseCalories: 78,
      serving: 1,
    },
    {
      id: "5",
      name: "Salmon",
      measurement: "100g",
      calories: 206,
      baseCalories: 206,
      serving: 1,
    },
    {
      id: "6",
      name: "Oatmeal",
      measurement: "1 cup cooked",
      calories: 150,
      baseCalories: 150,
      serving: 1,
    },
  ]);

  const filteredFoods = FoodItems.filter(
    (food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.measurement.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleClose = () => {
    setSearchQuery("");
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    onSelectFood(food);
    setSearchQuery("");
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-white dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
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
        <div className="mx-auto w-full max-w-6xl">
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
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => handleSelectFood(food)}
              className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
            >
              <p className="font-medium text-black dark:text-zinc-50">
                {food.name}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {food.measurement} • {food.calories} cal
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Create Button - Fixed at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-6xl">
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
