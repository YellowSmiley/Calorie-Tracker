import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./components/DashboardClient";
import { SettingsData, UserSettings } from "./settings/types";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch user settings and goals
  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieGoal: true,
      proteinGoal: true,
      carbGoal: true,
      fatGoal: true,
      saturatesGoal: true,
      sugarsGoal: true,
      fibreGoal: true,
      saltGoal: true,
      calorieUnit: true,
      weightUnit: true,
      bodyWeightUnit: true,
    },
  })) as SettingsData;

  const userSettings: Omit<UserSettings, "volumeUnit"> = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    weightUnit: user?.weightUnit ?? "g",
    bodyWeightUnit: user?.bodyWeightUnit ?? "kg",
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

  // Fetch today's totals
  const today = new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  const entries = await prisma.mealEntry.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      food: true,
    },
  });

  const initialTotals = entries.reduce(
    (acc, entry) => {
      const serving = entry.serving || 1;
      acc.calories += entry.food.calories * serving;
      acc.protein += entry.food.protein * serving;
      acc.carbs += entry.food.carbs * serving;
      acc.fat += entry.food.fat * serving;
      acc.saturates += entry.food.saturates * serving;
      acc.sugars += entry.food.sugars * serving;
      acc.fibre += entry.food.fibre * serving;
      acc.salt += entry.food.salt * serving;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      saturates: 0,
      sugars: 0,
      fibre: 0,
      salt: 0,
    },
  );

  return (
    <DashboardClient
      userName={session.user.name || "User"}
      userSettings={userSettings}
      userGoals={userGoals}
      initialTotals={initialTotals}
    />
  );
}
