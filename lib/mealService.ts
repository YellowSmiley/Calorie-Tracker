import { mealTypeSchema } from "@/lib/apiSchemas";

export const MEAL_TYPES = mealTypeSchema.options;

export type MealFood = {
  name: string;
  measurementType: string;
  measurementAmount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
  defaultServingAmount: number | null;
  defaultServingDescription: string | null;
};

export type MealEntryWithFood = {
  id: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
  serving: number;
  food: MealFood;
};

export function getDateRangeForDay(dateString?: string | null) {
  const baseDate = dateString ? new Date(`${dateString}T00:00:00`) : new Date();
  if (isNaN(baseDate.getTime())) {
    throw new Error("Invalid date");
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getMealDateForCreate(date?: string | null) {
  if (!date) {
    return new Date();
  }

  const mealDate = new Date(`${date}T00:00:00`);
  if (isNaN(mealDate.getTime())) {
    throw new Error("Invalid date");
  }

  return mealDate;
}

export function buildMealNutritionData(food: MealFood, serving: number) {
  return {
    calories: Number((food.calories * serving).toFixed(1)),
    protein: Number((food.protein * serving).toFixed(1)),
    carbs: Number((food.carbs * serving).toFixed(1)),
    fat: Number((food.fat * serving).toFixed(1)),
    saturates: Number((food.saturates * serving).toFixed(1)),
    sugars: Number((food.sugars * serving).toFixed(1)),
    fibre: Number((food.fibre * serving).toFixed(1)),
    salt: Number((food.salt * serving).toFixed(2)),
  };
}

function mapMealItem(entry: MealEntryWithFood) {
  return {
    id: entry.id,
    name: entry.food.name,
    measurementAmount: entry.food.measurementAmount,
    measurementType: entry.food.measurementType,
    calories: entry.calories,
    baseCalories: entry.food.calories,
    serving: entry.serving,
    protein: entry.protein,
    carbs: entry.carbs,
    fat: entry.fat,
    saturates: entry.saturates,
    sugars: entry.sugars,
    fibre: entry.fibre,
    salt: entry.salt,
    baseProtein: entry.food.protein,
    baseCarbs: entry.food.carbs,
    baseFat: entry.food.fat,
    baseSaturates: entry.food.saturates,
    baseSugars: entry.food.sugars,
    baseFibre: entry.food.fibre,
    baseSalt: entry.food.salt,
    defaultServingAmount: entry.food.defaultServingAmount,
    defaultServingDescription: entry.food.defaultServingDescription,
  };
}

export function buildMealsResponse(entries: MealEntryWithFood[]) {
  return MEAL_TYPES.map((type) => ({
    name: type[0] + type.slice(1).toLowerCase(),
    items: entries
      .filter((entry) => entry.mealType === type)
      .map((entry) => mapMealItem(entry)),
  }));
}
