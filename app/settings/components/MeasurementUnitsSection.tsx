import HelpButton from "@/app/components/HelpButton";
import { SettingsData } from "../types";

interface MeasurementUnitsSectionProps {
  settings: {
    calorieUnit: string;
    macroUnit: string;
  };
  onChange: (field: keyof SettingsData, value: string | number) => void;
}

export default function MeasurementUnitsSection({
  settings,
  onChange,
}: MeasurementUnitsSectionProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Measurement Units
        </h2>
        <HelpButton
          title="Measurement Units"
          content="Choose how you want nutrition information displayed. You can display calories in kcal or kJ, and macronutrients in grams, ounces, or milligrams. Your preference applies throughout the app on dashboards and food logs."
          ariaLabel="Help: Measurement units explained"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="calorieUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Calorie Unit
          </label>
          <select
            id="calorieUnit"
            data-testid="select-calorieUnit"
            value={settings.calorieUnit}
            onChange={(e) => onChange("calorieUnit", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="kcal">kcal</option>
            <option value="kJ">kJ</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="macroUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Macronutrient Unit
          </label>
          <select
            id="macroUnit"
            data-testid="select-macroUnit"
            value={settings.macroUnit}
            onChange={(e) => onChange("macroUnit", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="g">Grams (g)</option>
            <option value="oz">Ounces (oz)</option>
            <option value="mg">Milligrams (mg)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
