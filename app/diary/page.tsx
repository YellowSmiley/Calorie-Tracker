import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DiaryClient from "./DiaryClient";
import type { FoodItem, Meal } from "./types";
import { UserSettings } from "../settings/types";

const initialMeals: Meal[] = [
  { name: "Breakfast", items: [] },
  { name: "Lunch", items: [] },
  { name: "Dinner", items: [] },
  { name: "Snack", items: [] },
];

const mealOrder = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const getDateRange = (dateString: string) => {
  const baseDate = new Date(`${dateString}T00:00:00`);
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const activeDate = params.date || new Date().toISOString().split("T")[0];

  // User must be authenticated due to middleware, but add safety check
  if (!session?.user?.id) {
    return null;
  }

  // Fetch user settings for unit preferences
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieUnit: true,
      weightUnit: true,
      volumeUnit: true,
      calorieGoal: true,
      proteinGoal: true,
      carbGoal: true,
      fatGoal: true,
      saturatesGoal: true,
      sugarsGoal: true,
      fibreGoal: true,
      saltGoal: true,
    },
  });

  const userSettings: UserSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    weightUnit: user?.weightUnit ?? "g",
    volumeUnit: user?.volumeUnit ?? "ml",
  };

  const userGoals = {
    calories: user?.calorieGoal ?? 3000,
    protein: user?.proteinGoal ?? 150,
    carbs: user?.carbGoal ?? 410,
    fat: user?.fatGoal ?? 83,
    saturates: user?.saturatesGoal ?? 20,
    sugars: user?.sugarsGoal ?? 90,
    fibre: user?.fibreGoal ?? 30,
    salt: user?.saltGoal ?? 6,
  };

  const { start, end } = getDateRange(activeDate);
  const entries = await prisma.mealEntry.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  });

  const meals = mealOrder.map((type) => ({
    name: type[0] + type.slice(1).toLowerCase(),
    items: entries
      .filter((entry) => entry.mealType === type)
      .map((entry) => ({
        id: entry.id,
        name: entry.food.name,
        measurementType: entry.food.measurementType,
        measurementAmount: entry.food.measurementAmount,
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
      })) as FoodItem[],
  }));

  return (
    <DiaryClient
      initialMeals={meals.length ? meals : initialMeals}
      activeDate={activeDate}
      userSettings={userSettings}
      userGoals={userGoals}
    />
  );
}
