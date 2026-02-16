"use client";

import FoodTable from "../components/FoodTable";

export default function FoodDatabase() {
  const defaultUserSettings = {
    calorieUnit: "kcal",
    macroUnit: "g",
    weightUnit: "g",
    volumeUnit: "ml",
  };

  return <FoodTable userSettings={defaultUserSettings} />;
}
