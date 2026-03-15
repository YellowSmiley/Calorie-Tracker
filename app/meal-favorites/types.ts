import { FoodItem } from "@/app/diary/types";

export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export interface FavoriteMealSummary {
  id: string;
  name: string;
  mealType: MealType;
  updatedAt: string;
  itemCount: number;
  usageCount: number;
  totals?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  itemPreview?: string[];
}

export interface FavoriteMealItem extends FoodItem {
  foodId: string;
  sortOrder: number;
}

export interface FavoriteMealDetail {
  id: string;
  name: string;
  mealType: MealType;
  updatedAt: string;
  items: FavoriteMealItem[];
}
