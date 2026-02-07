"use client";

import { useEffect, useState } from "react";
import CreateFoodSidebar from "../components/CreateFoodSidebar";

interface Food {
  id: string;
  name: string;
  measurement: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdBy: string | null;
  createdByName?: string | null;
}

export default function FoodDatabase() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoadingCustom, setIsLoadingCustom] = useState(false);

  // Default user settings for admin create
  const defaultUserSettings = {
    calorieUnit: "kcal",
    macroUnit: "g",
    weightUnit: "g",
    volumeUnit: "ml",
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/foods");
      if (response.ok) {
        const data = await response.json();
        setFoods(data);
        setError(null);
      } else {
        setError("Failed to fetch foods");
      }
    } catch (err) {
      console.error("Error fetching foods:", err);
      setError("Error fetching foods");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoodSubmit = async (formData: {
    name: string;
    measurement: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => {
    setIsLoadingCustom(true);
    setError(null);

    try {
      if (editingFood) {
        // Update existing food
        const response = await fetch(`/api/admin/foods/${editingFood.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const updated = await response.json();
          setFoods(foods.map((f) => (f.id === editingFood.id ? updated : f)));
          setEditingFood(null);
          setShowCreateForm(false);
        } else {
          setError("Failed to update food");
        }
      } else {
        // Create new food
        const response = await fetch("/api/admin/foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const newFood = await response.json();
          setFoods([...foods, newFood]);
          setShowCreateForm(false);
        } else {
          setError("Failed to create food");
        }
      }
    } catch (err) {
      console.error("Error saving food:", err);
      setError("Error saving food");
    } finally {
      setIsLoadingCustom(false);
    }
  };

  const startEditing = (food: Food) => {
    setEditingFood(food);
    setShowCreateForm(true);
  };
  const handleDeleteFood = async (foodId: string) => {
    try {
      const response = await fetch(`/api/admin/foods/${foodId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFoods(foods.filter((f) => f.id !== foodId));
        setDeleteConfirm(null);
        setError(null);
      } else {
        setError("Failed to delete food");
      }
    } catch (err) {
      console.error("Error deleting food:", err);
      setError("Error deleting food");
    }
  };

  const filteredFoods = foods.filter(
    (food) =>
      food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      food.measurement.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg">Loading foods...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Create */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 p-4">
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600"
          />
        </div>
        <div className="px-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-2 font-medium transition-colors text-black dark:text-zinc-50 whitespace-nowrap"
          >
            Create Food
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-900 dark:text-zinc-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Foods Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse bg-white dark:bg-zinc-950">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Measurement
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Calories
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Protein (g)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Carbs (g)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Fat (g)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Created By
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFoods.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-3 text-center text-zinc-500">
                  No foods found
                </td>
              </tr>
            ) : (
              filteredFoods.map((food) => (
                <tr
                  key={food.id}
                  className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                  onClick={() => startEditing(food)}
                >
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {food.name}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {food.measurement}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {food.calories}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {food.protein}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {food.carbs}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {food.fat}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50 text-sm">
                    {food.createdByName || "Unknown"}
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {deleteConfirm === food.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteFood(food.id)}
                          className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(food.id)}
                        className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateFoodSidebar
        isOpen={showCreateForm}
        onClose={() => {
          setShowCreateForm(false);
          setEditingFood(null);
          setError(null);
        }}
        onSubmit={handleFoodSubmit}
        userSettings={defaultUserSettings}
        isLoading={isLoadingCustom}
        editingFood={editingFood}
      />
    </div>
  );
}
