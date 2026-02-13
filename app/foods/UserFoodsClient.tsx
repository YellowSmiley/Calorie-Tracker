"use client";

import FoodTable from "../components/FoodTable";
import { UserSettings } from "../settings/types";

interface UserFoodsClientProps {
  userSettings: UserSettings;
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
