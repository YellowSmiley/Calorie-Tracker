import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { defaultFoods } from "@/lib/defaultFoods";
import DiaryClient from "./DiaryClient";
import type { FoodItem, Meal } from "./types";

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

const mapFoodToItem = (food: {
  id: string;
  name: string;
  measurement: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): FoodItem => ({
  id: food.id,
  name: food.name,
  measurement: food.measurement,
  calories: food.calories,
  baseCalories: food.calories,
  serving: 1,
  protein: food.protein,
  carbs: food.carbs,
  fat: food.fat,
  baseProtein: food.protein,
  baseCarbs: food.carbs,
  baseFat: food.fat,
});

export default async function DiaryPage() {
  const session = await auth();
  const activeDate = new Date().toISOString().split("T")[0];

  if (!session?.user?.id) {
    return (
      <DiaryClient
        initialMeals={initialMeals}
        initialFoods={[]}
        isAuthenticated={false}
        activeDate={activeDate}
      />
    );
  }

  const count = await prisma.food.count();
  if (count === 0) {
    await prisma.food.createMany({ data: defaultFoods });
  }

  const foods = await prisma.food.findMany({
    orderBy: { name: "asc" },
  });

  const { start, end } = getDateRange(activeDate);
  const entries = (await prisma.mealEntry.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: { food: true },
    orderBy: { createdAt: "asc" },
  })) as Array<{
    id: string;
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving: number;
    food: {
      name: string;
      measurement: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }>;

  const meals = mealOrder.map((type) => ({
    name: type[0] + type.slice(1).toLowerCase(),
    items: entries
      .filter((entry) => entry.mealType === type)
      .map((entry) => ({
        id: entry.id,
        name: entry.food.name,
        measurement: entry.food.measurement,
        calories: entry.calories,
        baseCalories: entry.food.calories,
        serving: entry.serving,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        baseProtein: entry.food.protein,
        baseCarbs: entry.food.carbs,
        baseFat: entry.food.fat,
      })),
  }));

  return (
    <DiaryClient
      initialMeals={meals.length ? meals : initialMeals}
      initialFoods={foods.map(mapFoodToItem)}
      isAuthenticated={true}
      activeDate={activeDate}
    />
  );
}
