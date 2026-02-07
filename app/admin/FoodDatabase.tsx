"use client";

import { useEffect, useState } from "react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Food>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const startEditing = (food: Food) => {
    setEditingId(food.id);
    setEditData({ ...food });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/foods/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updated = await response.json();
        setFoods(foods.map((f) => (f.id === editingId ? updated : f)));
        setEditingId(null);
        setEditData({});
        setError(null);
      } else {
        setError("Failed to update food");
      }
    } catch (err) {
      console.error("Error updating food:", err);
      setError("Error updating food");
    } finally {
      setIsSaving(false);
    }
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
      {/* Search */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
        <input
          type="text"
          placeholder="Search by name or measurement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
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
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Name
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Measurement
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Calories
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Protein (g)
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Carbs (g)
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Fat (g)
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
                Created By
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50 whitespace-nowrap">
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
                  className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  {editingId === food.id ? (
                    <>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.name || ""}
                          onChange={(e) =>
                            setEditData({ ...editData, name: e.target.value })
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editData.measurement || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              measurement: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={editData.calories || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              calories: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={editData.protein || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              protein: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={editData.carbs || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              carbs: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={editData.fat || ""}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              fat: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50"
                        />
                      </td>
                      <td className="px-4 py-3 text-black dark:text-zinc-50 text-sm">
                        {food.createdByName || "Unknown"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveEdit}
                            disabled={isSaving}
                            className="px-3 py-1 rounded text-sm font-medium bg-black text-white dark:bg-zinc-50 dark:text-black hover:opacity-90 disabled:opacity-50"
                          >
                            {isSaving ? "..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 rounded text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:opacity-90"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
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
                      <td className="px-4 py-3">
                        {deleteConfirm === food.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeleteFood(food.id)}
                              className="px-3 py-1 rounded text-sm font-medium bg-black text-white dark:bg-zinc-50 dark:text-black hover:opacity-90"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 rounded text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:opacity-90"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditing(food)}
                              className="px-3 py-1 rounded text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:opacity-90"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(food.id)}
                              className="px-3 py-1 rounded text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:opacity-90"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
