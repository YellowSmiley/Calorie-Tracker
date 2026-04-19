export type MeasurementType = "weight" | "volume";

export interface FoodItem {
  id: string;
  name: string;
  measurementType: MeasurementType;
  measurementAmount: number;
  calories: number;
  baseCalories: number;
  serving: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
  baseProtein: number;
  baseCarbs: number;
  baseFat: number;
  baseSaturates: number;
  baseSugars: number;
  baseFibre: number;
  baseSalt: number;
  defaultServingAmount?: number | null;
  defaultServingDescription?: string | null;
  createdByName?: string;
  isApproved?: boolean;
  hasUserReported?: boolean;
  reportCount?: number;
}

export interface Meal {
  name: string;
  items: FoodItem[];
}
