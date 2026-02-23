import HelpButton from "@/app/components/HelpButton";
import { SettingsData, UserSettings } from "../types";

interface NutritionGoalsSectionProps {
  settings: SettingsData;
  onChange: (field: keyof SettingsData, value: string | number) => void;
  userSettings: UserSettings;
}

export default function NutritionGoalsSection({
  settings,
  onChange,
  userSettings,
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
              Calories ({settings.calorieUnit}) *
            </label>
            <input
              id="calorieGoal"
              data-testid="nutritional-goals-calorie-goal-input"
              type="number"
              min="0"
              step="1"
              value={settings.calorieGoal || ""}
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
              Protein ({settings.weightUnit}) *
            </label>
            <input
              id="proteinGoal"
              data-testid="nutritional-goals-protein-goal-input"
              type="number"
              min="0"
              step="0.1"
              value={settings.proteinGoal || ""}
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
              Carbohydrates ({settings.weightUnit}) *
            </label>
            <input
              id="carbGoal"
              data-testid="nutritional-goals-carb-goal-input"
              type="number"
              min="0"
              step="0.1"
              value={settings.carbGoal || ""}
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
              Fat ({settings.weightUnit}) *
            </label>
            <input
              id="fatGoal"
              data-testid="nutritional-goals-fat-goal-input"
              type="number"
              min="0"
              step="0.1"
              value={settings.fatGoal || ""}
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
              Saturates ({settings.weightUnit}) *
            </label>
            <input
              id="saturatesGoal"
              data-testid="nutritional-goals-saturates-goal-input"
              type="number"
              min="0"
              step="1"
              value={settings.saturatesGoal}
              onChange={(e) =>
                onChange("saturatesGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="sugarsGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Sugars ({settings.weightUnit}) *
            </label>
            <input
              id="sugarsGoal"
              data-testid="nutritional-goals-sugars-goal-input"
              type="number"
              min="0"
              step="1"
              value={settings.sugarsGoal}
              onChange={(e) =>
                onChange("sugarsGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="fibreGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Fibre ({settings.weightUnit}) *
            </label>
            <input
              id="fibreGoal"
              data-testid="nutritional-goals-fibre-goal-input"
              type="number"
              min="0"
              step="1"
              value={settings.fibreGoal}
              onChange={(e) =>
                onChange("fibreGoal", parseFloat(e.target.value))
              }
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>

          <div>
            <label
              htmlFor="saltGoal"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Salt ({settings.weightUnit}) *
            </label>
            <input
              id="saltGoal"
              data-testid="nutritional-goals-salt-goal-input"
              type="number"
              min="0"
              step="0.1"
              value={settings.saltGoal}
              onChange={(e) => onChange("saltGoal", parseFloat(e.target.value))}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
