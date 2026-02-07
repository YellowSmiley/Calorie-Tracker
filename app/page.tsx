import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatCalories, formatMacro } from "@/lib/unitConversions";

export default async function Home() {
  const session = await auth();

  // Fetch user settings for goals
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    select: {
      calorieGoal: true,
      proteinGoal: true,
      calorieUnit: true,
      macroUnit: true,
    },
  });

  const userSettings = {
    calorieUnit: user?.calorieUnit ?? "kcal",
    macroUnit: user?.macroUnit ?? "g",
  };

  const calorieGoal = user?.calorieGoal ?? 3000;
  const proteinGoal = user?.proteinGoal ?? 150;

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
              Welcome, {session?.user?.name || "User"}!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Track your daily calorie intake and macronutrients to reach your
              health goals.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Daily Goal
                </p>
                <p className="text-2xl font-bold text-black dark:text-zinc-50">
                  {formatCalories(calorieGoal, userSettings)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Protein Goal
                </p>
                <p className="text-2xl font-bold text-black dark:text-zinc-50">
                  {formatMacro(proteinGoal, userSettings)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
            <h3 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
              Quick Actions
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Use the navigation below to access your food diary and start
              tracking your meals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
