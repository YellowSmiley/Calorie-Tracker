import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch user settings and goals
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      calorieGoal: true,
      proteinGoal: true,
      carbGoal: true,
      fatGoal: true,
      calorieUnit: true,
      macroUnit: true,
    },
  });

  const userSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    macroUnit: user?.macroUnit ?? "g",
  };

  const userGoals = {
    calories: user?.calorieGoal ?? 3000,
    protein: user?.proteinGoal ?? 150,
    carbs: user?.carbGoal ?? 410,
    fat: user?.fatGoal ?? 83,
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
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
