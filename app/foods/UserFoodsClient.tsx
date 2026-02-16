"use client";

import FoodTable from "../components/FoodTable";
import { UserSettings } from "../settings/types";

interface UserFoodsClientProps {
  userSettings: UserSettings;
}

export default function UserFoodsClient({
  userSettings,
}: UserFoodsClientProps) {
  return <FoodTable userSettings={userSettings} />;
}
