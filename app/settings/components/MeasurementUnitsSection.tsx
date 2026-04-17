import HelpButton from "@/app/components/HelpButton";
import {
  AcceptedBodyWeightUnits,
  AcceptedCalorieUnits,
  AcceptedWeightedUnits,
  SettingsData,
} from "../types";
import {
  convertCaloriesForDisplay,
  convertCaloriesFromInput,
  convertWeightForDisplay,
  convertWeightFromInput,
} from "@/lib/unitConversions";

interface MeasurementUnitsSectionProps {
  settings: SettingsData;
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
          ariaLabel="Help: Measurement units explained"
        >
          <p>Choose how nutrition information is displayed in the app.</p>
          <p>
            Calories can be shown as kcal or kJ. Food and nutrition weights can
            use grams, ounces, kilograms, pounds, or milligrams.
          </p>
          <p>
            Body weight can use kilograms or pounds. These preferences apply
            across dashboards and food logs.
          </p>
        </HelpButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="calorieUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Calorie Unit
          </label>
          <select
            id="calorieUnit"
            data-testid="measurement-calorie-unit-select"
            value={settings.calorieUnit || "kcal"}
            onChange={(e) => {
              onChange("calorieUnit", e.target.value);
              const convertedCalorieGoal = convertCaloriesForDisplay(
                settings.calorieUnit === "kcal"
                  ? settings.calorieGoal
                  : convertCaloriesFromInput(
                      settings.calorieGoal,
                      settings.calorieUnit,
                    ),
                e.target.value as AcceptedCalorieUnits,
              );
              onChange("calorieGoal", convertedCalorieGoal);
            }}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="kcal">Kilocalorie (kcal)</option>
            <option value="kJ">Kilojoule (kJ)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="weightUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Weight Unit
          </label>
          <select
            id="weightUnit"
            data-testid="measurement-weight-unit-select"
            value={settings.weightUnit || "g"}
            onChange={(e) => {
              onChange("weightUnit", e.target.value);
              const propsToUpdate = [
                "proteinGoal",
                "carbGoal",
                "fatGoal",
                "saturatesGoal",
                "sugarsGoal",
                "fibreGoal",
                "saltGoal",
              ] as (keyof Pick<
                SettingsData,
                | "proteinGoal"
                | "carbGoal"
                | "fatGoal"
                | "saturatesGoal"
                | "sugarsGoal"
                | "fibreGoal"
                | "saltGoal"
              >)[];
              propsToUpdate.forEach((prop) => {
                const convertedGoal = convertWeightForDisplay(
                  settings.weightUnit === "g"
                    ? settings[prop]
                    : convertWeightFromInput(
                        settings[prop],
                        settings.weightUnit as AcceptedWeightedUnits,
                      ),
                  e.target.value as AcceptedWeightedUnits,
                );
                onChange(prop, convertedGoal);
              });
            }}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
            <option value="g">Grams (g)</option>
            <option value="oz">Ounces (oz)</option>
            <option value="kg">Kilograms (kg)</option>
            <option value="lbs">Pounds (lbs)</option>
            <option value="mg">Milligrams (mg)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="bodyWeightUnit"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            Body Weight Unit
          </label>
          <select
            id="bodyWeightUnit"
            data-testid="measurement-body-weight-unit-select"
            value={settings.bodyWeightUnit || "kg"}
            onChange={(e) => {
              onChange(
                "bodyWeightUnit",
                e.target.value as AcceptedBodyWeightUnits,
              );
            }}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
          >
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
            data-testid="measurement-volume-unit-select"
            value={settings.volumeUnit || "ml"}
            onChange={(e) => {
              onChange("volumeUnit", e.target.value);
              const propsToUpdate = [
                "proteinGoal",
                "carbGoal",
                "fatGoal",
                "saturatesGoal",
                "sugarsGoal",
                "fibreGoal",
                "saltGoal",
              ] as (keyof Pick<
                SettingsData,
                | "proteinGoal"
                | "carbGoal"
                | "fatGoal"
                | "saturatesGoal"
                | "sugarsGoal"
                | "fibreGoal"
                | "saltGoal"
              >)[];
              propsToUpdate.forEach((prop) => {
                const convertedGoal = convertWeightForDisplay(
                  settings.volumeUnit === "ml"
                    ? settings[prop]
                    : convertWeightFromInput(
                        settings[prop],
                        settings.volumeUnit as AcceptedWeightedUnits,
                      ),
                  e.target.value as AcceptedWeightedUnits,
                );
                onChange(prop, convertedGoal);
              });
            }}
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
