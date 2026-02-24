"use client";

import FoodTable from "../components/FoodTable";
import { UserSettings } from "../settings/types";

export default function FoodDatabase() {
  const defaultUserSettings: UserSettings = {
    calorieUnit: "kcal",
    weightUnit: "g",
    volumeUnit: "ml",
  };

  return <FoodTable userSettings={defaultUserSettings} />;
}
