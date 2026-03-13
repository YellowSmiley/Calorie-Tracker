import HelpButton from "@/app/components/HelpButton";
import { SettingsData } from "../types";
import ValidatedNumberField from "@/app/diary/components/ValidatedNumberField";

type NutritionGoalField =
  | "calorieGoal"
  | "proteinGoal"
  | "carbGoal"
  | "fatGoal"
  | "saturatesGoal"
  | "sugarsGoal"
  | "fibreGoal"
  | "saltGoal";

type NutritionGoalErrors = Partial<Record<NutritionGoalField, string>>;

interface NutritionGoalsSectionProps {
  settings: SettingsData;
  onChange: (field: keyof SettingsData, value: string | number) => void;
  fieldErrors: NutritionGoalErrors;
  onFieldBlur: (field: NutritionGoalField) => void;
}

export default function NutritionGoalsSection({
  settings,
  onChange,
  fieldErrors,
  onFieldBlur,
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
          <ValidatedNumberField
            id="calorieGoal"
            label={`Calories (${settings.calorieUnit}) *`}
            dataTestId="nutritional-goals-calorie-goal-input"
            min="0"
            step="1"
            value={
              Number.isFinite(settings.calorieGoal)
                ? String(settings.calorieGoal)
                : ""
            }
            onChange={(value) => onChange("calorieGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("calorieGoal")}
            error={fieldErrors.calorieGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <ValidatedNumberField
            id="proteinGoal"
            label={`Protein (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-protein-goal-input"
            min="0"
            step="0.1"
            value={
              Number.isFinite(settings.proteinGoal)
                ? String(settings.proteinGoal)
                : ""
            }
            onChange={(value) => onChange("proteinGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("proteinGoal")}
            error={fieldErrors.proteinGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ValidatedNumberField
            id="carbGoal"
            label={`Carbohydrates (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-carb-goal-input"
            min="0"
            step="0.1"
            value={
              Number.isFinite(settings.carbGoal)
                ? String(settings.carbGoal)
                : ""
            }
            onChange={(value) => onChange("carbGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("carbGoal")}
            error={fieldErrors.carbGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <ValidatedNumberField
            id="fatGoal"
            label={`Fat (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-fat-goal-input"
            min="0"
            step="0.1"
            value={
              Number.isFinite(settings.fatGoal) ? String(settings.fatGoal) : ""
            }
            onChange={(value) => onChange("fatGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("fatGoal")}
            error={fieldErrors.fatGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <ValidatedNumberField
            id="saturatesGoal"
            label={`Saturates (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-saturates-goal-input"
            min="0"
            step="1"
            value={
              Number.isFinite(settings.saturatesGoal)
                ? String(settings.saturatesGoal)
                : ""
            }
            onChange={(value) => onChange("saturatesGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("saturatesGoal")}
            error={fieldErrors.saturatesGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <ValidatedNumberField
            id="sugarsGoal"
            label={`Sugars (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-sugars-goal-input"
            min="0"
            step="1"
            value={
              Number.isFinite(settings.sugarsGoal)
                ? String(settings.sugarsGoal)
                : ""
            }
            onChange={(value) => onChange("sugarsGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("sugarsGoal")}
            error={fieldErrors.sugarsGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <ValidatedNumberField
            id="fibreGoal"
            label={`Fibre (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-fibre-goal-input"
            min="0"
            step="1"
            value={
              Number.isFinite(settings.fibreGoal)
                ? String(settings.fibreGoal)
                : ""
            }
            onChange={(value) => onChange("fibreGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("fibreGoal")}
            error={fieldErrors.fibreGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />

          <ValidatedNumberField
            id="saltGoal"
            label={`Salt (${settings.weightUnit}) *`}
            dataTestId="nutritional-goals-salt-goal-input"
            min="0"
            step="0.1"
            value={
              Number.isFinite(settings.saltGoal)
                ? String(settings.saltGoal)
                : ""
            }
            onChange={(value) => onChange("saltGoal", parseFloat(value))}
            onBlur={() => onFieldBlur("saltGoal")}
            error={fieldErrors.saltGoal}
            required
            labelClassName="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            inputClassName="w-full rounded-lg border bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          />
        </div>
      </div>
    </div>
  );
}
