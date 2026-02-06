"use client";

import { useState } from "react";
import FoodListSidebar from "../components/FoodListSidebar";
import CreateFoodSidebar from "../components/CreateFoodSidebar";

export interface FoodItem {
  id: string;
  name: string;
  measurement: string;
  calories: number;
}

interface Meal {
  name: string;
  items: FoodItem[];
}

export default function Diary() {
  const [meals, setMeals] = useState<Meal[]>([
    { name: "Breakfast", items: [] },
    { name: "Lunch", items: [] },
    { name: "Dinner", items: [] },
    { name: "Snack", items: [] },
  ]);

  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null,
  );
  const [showFoodList, setShowFoodList] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const addFoodFromList = (food: FoodItem) => {
    if (selectedMealIndex === null) return;

    const updatedMeals = [...meals];
    updatedMeals[selectedMealIndex].items.push(food);
    setMeals(updatedMeals);
    setShowFoodList(false);
    setSelectedMealIndex(null);
  };

  const addCustomFood = (formData: {
    name: string;
    measurement: string;
    calories: string;
  }) => {
    if (selectedMealIndex === null || !formData.name) return;

    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: formData.name,
      measurement: formData.measurement,
      calories: parseInt(formData.calories) || 0,
    };

    const updatedMeals = [...meals];
    updatedMeals[selectedMealIndex].items.push(newItem);
    setMeals(updatedMeals);
    setShowCreateForm(false);
    setShowFoodList(false);
    setSelectedMealIndex(null);
  };

  const updateFoodItem = (
    mealIndex: number,
    itemId: string,
    field: keyof FoodItem,
    value: string | number,
  ) => {
    const updatedMeals = [...meals];
    const item = updatedMeals[mealIndex].items.find((i) => i.id === itemId);
    if (item) {
      item[field] = value as never;
    }
    setMeals(updatedMeals);
  };

  const removeFood = (mealIndex: number, itemId: string) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].items = updatedMeals[mealIndex].items.filter(
      (i) => i.id !== itemId,
    );
    setMeals(updatedMeals);
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50 mb-6">
          Diary
        </h1>

        {meals.map((meal, mealIndex) => (
          <div key={meal.name} className="mb-8">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-3">
              {meal.name}
            </h2>
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="w-full border-collapse bg-white dark:bg-zinc-950">
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
                    <tr
                      key={item.id}
                      className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateFoodItem(
                              mealIndex,
                              item.id,
                              "name",
                              e.target.value,
                            )
                          }
                          className="block w-full border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent text-black dark:text-zinc-50 font-medium mb-1"
                          placeholder="Food name"
                        />
                        <input
                          type="text"
                          value={item.measurement}
                          onChange={(e) =>
                            updateFoodItem(
                              mealIndex,
                              item.id,
                              "measurement",
                              e.target.value,
                            )
                          }
                          className="block w-full border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent text-zinc-500 dark:text-zinc-400 text-sm"
                          placeholder="Measurement"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.calories}
                          onChange={(e) =>
                            updateFoodItem(
                              mealIndex,
                              item.id,
                              "calories",
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-full border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-transparent text-black dark:text-zinc-50 text-sm"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeFood(mealIndex, item.id)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td colSpan={3} className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedMealIndex(mealIndex);
                          setShowFoodList(true);
                        }}
                        className="w-full text-left text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors font-medium"
                      >
                        + Add Food
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Food List Sidebar */}
      <FoodListSidebar
        isOpen={showFoodList}
        onClose={() => {
          setShowFoodList(false);
          setSelectedMealIndex(null);
        }}
        onSelectFood={addFoodFromList}
        onOpenCreateForm={() => setShowCreateForm(true)}
      />

      <CreateFoodSidebar
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSubmit={addCustomFood}
      />
    </div>
  );
}
