"use client";

import FoodTable from "../components/FoodTable";

interface UserFoodsClientProps {
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
}

export default function UserFoodsClient({
  userSettings,
}: UserFoodsClientProps) {
  return (
    <FoodTable
      userSettings={userSettings}
      apiBasePath="/api/foods"
      showCreatedBy={false}
      emptyMessage="You haven't created any foods yet. Click 'Create Food' to get started."
    />
  );
}
