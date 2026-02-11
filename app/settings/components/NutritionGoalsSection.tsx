import HelpButton from "@/app/components/HelpButton";
import { SettingsData } from "../types";

interface NutritionGoalsSectionProps {
  settings: {
    calorieGoal: number;
    proteinGoal: number;
    carbGoal: number;
    fatGoal: number;
    saturatesGoal: number;
    sugarsGoal: number;
    fibreGoal: number;
    saltGoal: number;
  };
  onChange: (field: keyof SettingsData, value: string | number) => void;
}

export default function NutritionGoalsSection({
  settings,
  onChange,
}: NutritionGoalsSectionProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Nutritional Goals
        </h2>
        <HelpButton
          title="Nutritional Goals"
          content="Set your daily nutrition targets here. These goals are used to calculate your daily progress on the dashboard. You can set goals for calories, macronutrients (protein, carbs, fat), and micronutrients (saturates, sugars, fibre, salt). Adjust these based on your dietary needs and health objectives."
          ariaLabel="Help: Nutritional goals explained"
        />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="calorieGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Calories
            </label>
            <input
              id="calorieGoal"
              type="number"
              min="0"
              step="1"
              value={settings.calorieGoal}
              onChange={(e) =>
                onChange("calorieGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="proteinGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Protein (g)
            </label>
            <input
              id="proteinGoal"
              type="number"
              min="0"
              step="0.1"
              value={settings.proteinGoal}
              onChange={(e) =>
                onChange("proteinGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="carbGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Carbohydrates (g)
            </label>
            <input
              id="carbGoal"
              type="number"
              min="0"
              step="0.1"
              value={settings.carbGoal}
              onChange={(e) => onChange("carbGoal", parseFloat(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="fatGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Fat (g)
            </label>
            <input
              id="fatGoal"
              type="number"
              min="0"
              step="0.1"
              value={settings.fatGoal}
              onChange={(e) => onChange("fatGoal", parseFloat(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="saturatesGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Saturates (g)
            </label>
            <input
              id="saturatesGoal"
              type="number"
              min="0"
              step="1"
              value={settings.saturatesGoal}
              onChange={(e) =>
                onChange("saturatesGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="sugarsGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Sugars (g)
            </label>
            <input
              id="sugarsGoal"
              type="number"
              min="0"
              step="1"
              value={settings.sugarsGoal}
              onChange={(e) =>
                onChange("sugarsGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="fibreGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Fibre (g)
            </label>
            <input
              id="fibreGoal"
              type="number"
              min="0"
              step="1"
              value={settings.fibreGoal}
              onChange={(e) =>
                onChange("fibreGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="saltGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Salt (g)
            </label>
            <input
              id="saltGoal"
              type="number"
              min="0"
              step="0.1"
              value={settings.saltGoal}
              onChange={(e) => onChange("saltGoal", parseFloat(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
