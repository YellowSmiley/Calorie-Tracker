import HelpButton from "@/app/components/HelpButton";
import { SettingsData } from "../types";

interface FoodMeasurementUnitsSectionProps {
  settings: {
    weightUnit: string;
    volumeUnit: string;
  };
  onChange: (field: keyof SettingsData, value: string | number) => void;
}

export default function FoodMeasurementUnitsSection({
  settings,
  onChange,
}: FoodMeasurementUnitsSectionProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Food Measurement Units
        </h2>
        <HelpButton
          title="Food Measurement Units"
          content="Choose your preferred units when entering food measurements. Weight can be in grams, ounces, kilograms, or pounds. Volume can be in millilitres, cups, tablespoons, teaspoons, or litres. These units appear when you're logging foods."
          ariaLabel="Help: Food measurement units explained"
        />
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="weightUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Weight Unit
          </label>
          <select
            id="weightUnit"
            data-testid="select-weightUnit"
            value={settings.weightUnit}
            onChange={(e) => onChange("weightUnit", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="g">Grams (g)</option>
            <option value="oz">Ounces (oz)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="lbs">Pounds (lbs)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="volumeUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Volume Unit
          </label>
          <select
            id="volumeUnit"
            data-testid="select-volumeUnit"
            value={settings.volumeUnit}
            onChange={(e) => onChange("volumeUnit", e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="ml">Millilitres (ml)</option>
            <option value="cup">Cups</option>
            <option value="tbsp">Tablespoons (tbsp)</option>
            <option value="tsp">Teaspoons (tsp)</option>
            <option value="L">Litres (L)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
