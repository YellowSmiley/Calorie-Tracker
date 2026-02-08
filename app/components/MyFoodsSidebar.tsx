"use client";

import { Food } from "@prisma/client";
import FoodTable from "./FoodTable";

interface MyFoodsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialFoods: Food[];
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
}

export default function MyFoodsSidebar({
  isOpen,
  onClose,
  initialFoods,
  userSettings,
}: MyFoodsSidebarProps) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={onClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          My Foods
        </h2>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto">
        <FoodTable
          initialFoods={initialFoods}
          userSettings={userSettings}
          apiBasePath="/api/foods"
          showCreatedBy={false}
          emptyMessage="You haven't created any foods yet. Click 'Create Food' to get started."
        />
      </div>
    </div>
  );
}
