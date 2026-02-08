"use client";

import { Food } from "@prisma/client";
import FoodTable from "../components/FoodTable";

interface UserFoodsClientProps {
  initialFoods: Food[];
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
}

export default function UserFoodsClient({
  initialFoods,
  userSettings,
}: UserFoodsClientProps) {
  return (
    <FoodTable
      initialFoods={initialFoods}
      userSettings={userSettings}
      apiBasePath="/api/foods"
      showCreatedBy={false}
      emptyMessage="You haven't created any foods yet. Click 'Create Food' to get started."
    />
  );
}
