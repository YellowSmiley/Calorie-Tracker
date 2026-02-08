"use client";

import { useEffect, useState } from "react";
import FoodTable from "../components/FoodTable";

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
      }
    } catch (err) {
      console.error("Error fetching foods:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg">Loading foods...</p>
      </div>
    );
  }

  return (
    <FoodTable
      initialFoods={foods}
      userSettings={defaultUserSettings}
      apiBasePath="/api/admin/foods"
      showCreatedBy={true}
      emptyMessage="No foods found"
    />
  );
}
