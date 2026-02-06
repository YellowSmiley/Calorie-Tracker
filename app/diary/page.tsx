"use client";

import { useMemo, useState } from "react";
import FoodListSidebar from "../components/FoodListSidebar";
import CreateFoodSidebar from "../components/CreateFoodSidebar";
import EditFoodSidebar from "../components/EditFoodSidebar";

export interface FoodItem {
  id: string;
  name: string;
  measurement: string;
  calories: number;
  baseCalories: number;
  serving: number;
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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editServingValue, setEditServingValue] = useState("1");
  const [editTarget, setEditTarget] = useState<{
    mealIndex: number;
    itemId: string;
  } | null>(null);

  const selectedFood = useMemo(() => {
    if (!editTarget) return null;
    return (
      meals[editTarget.mealIndex]?.items.find(
        (item) => item.id === editTarget.itemId,
      ) || null
    );
  }, [editTarget, meals]);

  const addFoodFromList = (food: FoodItem) => {
    if (selectedMealIndex === null) return;

    const updatedMeals = [...meals];
    updatedMeals[selectedMealIndex].items.push({
      id: Date.now().toString(),
      name: food.name,
      measurement: food.measurement,
      calories: food.baseCalories,
      baseCalories: food.baseCalories,
      serving: 1,
    });
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

    const baseCalories = parseFloat(formData.calories) || 0;
    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: formData.name,
      measurement: formData.measurement,
      calories: baseCalories,
      baseCalories,
      serving: 1,
    };

    const updatedMeals = [...meals];
    updatedMeals[selectedMealIndex].items.push(newItem);
    setMeals(updatedMeals);
    setShowCreateForm(false);
    setShowFoodList(false);
    setSelectedMealIndex(null);
  };

  const applyServingChange = (serving: number) => {
    if (!editTarget) return;

    const updatedMeals = [...meals];
    const item = updatedMeals[editTarget.mealIndex].items.find(
      (i) => i.id === editTarget.itemId,
    );
    if (item) {
      item.serving = serving;
      item.calories = Number((item.baseCalories * serving).toFixed(1));
    }
    setMeals(updatedMeals);
    setShowEditForm(false);
    setEditTarget(null);
  };

  const removeFood = (mealIndex: number, itemId: string) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].items = updatedMeals[mealIndex].items.filter(
      (i) => i.id !== itemId,
    );
    setMeals(updatedMeals);
  };

  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black p-4 pb-24">
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
                      onClick={() => {
                        setEditTarget({
                          mealIndex,
                          itemId: item.id,
                        });
                        setEditServingValue(String(item.serving));
                        setShowEditForm(true);
                      }}
                      className="cursor-pointer border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                      <td className="px-4 py-3">
                        <p className="text-black dark:text-zinc-50 font-medium">
                          {item.name}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {item.measurement}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {item.calories} cal
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFood(mealIndex, item.id);
                          }}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr
                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => {
                      setSelectedMealIndex(mealIndex);
                      setShowFoodList(true);
                    }}
                  >
                    <td colSpan={3} className="px-4 py-3">
                      <p className="w-full text-left text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 transition-colors font-medium">
                        Add Food
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

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

      <EditFoodSidebar
        isOpen={showEditForm}
        food={selectedFood}
        servingValue={editServingValue}
        onServingChange={setEditServingValue}
        onClose={() => {
          setShowEditForm(false);
          setEditTarget(null);
        }}
        onSubmit={applyServingChange}
      />
    </div>
  );
}
