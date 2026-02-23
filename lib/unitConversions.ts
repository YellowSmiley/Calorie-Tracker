// All values are stored in the database as kcal and grams
// These functions convert for display based on user preferences

import { MeasurementType } from "@/app/diary/types";
import { AcceptedUnits, UserSettings } from "@/app/settings/types";

/**
 * Convert a kcal value stored in the database to the user's preferred display unit for calories
 */
export function convertCaloriesForDisplay(
  kcalValue: number | null | undefined,
  targetUnit: string | null | undefined,
): number {
  if (kcalValue === null || kcalValue === undefined || !targetUnit) {
    return 0;
  }
  switch (targetUnit) {
    case "kJ":
      return kcalValue * 4.184;
    case "kcal":
    default:
      return kcalValue;
  }
}

/**
 * Convert a user input value in their preferred unit for calories back to kcal for storage
 */
export function convertCaloriesFromInput(
  inputValue: number | null | undefined,
  inputUnit: string | null | undefined,
): number {
  if (inputValue === null || inputValue === undefined || !inputUnit) {
    return 0;
  }
  switch (inputUnit) {
    case "kJ":
      return inputValue / 4.184;
    case "kcal":
    default:
      return inputValue;
  }
}

/**
 * Convert a grams value stored in the database to the user's preferred display unit for macros
 */
export function convertMacroForDisplay(
  gramsValue: number | null | undefined,
  targetUnit: AcceptedUnits | null | undefined,
): number {
  if (gramsValue === null || gramsValue === undefined) {
    return 0;
  }
  switch (targetUnit) {
    case "oz":
      return gramsValue * 0.035274;
    case "mg":
      return gramsValue * 1000;
    case "kg":
      return gramsValue / 1000;
    case "lbs":
      return gramsValue * 0.00220462;
    case "g":
    default:
      return gramsValue;
  }
}

/**
 * Convert a user input value in their preferred unit back to grams for storage
 */
export function convertMacroFromInput(
  inputValue: number | null | undefined,
  inputUnit: AcceptedUnits | null | undefined,
): number {
  if (inputValue === null || inputValue === undefined) {
    return 0;
  }
  switch (inputUnit) {
    case "oz":
      return inputValue / 0.035274;
    case "mg":
      return inputValue / 1000;
    case "kg":
      return inputValue * 1000;
    case "lbs":
      return inputValue / 0.00220462;
    case "g":
    default:
      return inputValue;
  }
}

/**
 * Format a kcal value for display with the appropriate unit label based on user settings
 */
export function formatCalories(
  kcalValue: number | null | undefined,
  settings: Omit<UserSettings, "weightUnit" | "volumeUnit">,
): string {
  const converted = convertCaloriesForDisplay(kcalValue, settings.calorieUnit);
  return `${Math.round(converted)} ${settings.calorieUnit}`;
}

/**
 * Format a grams value for display with the appropriate unit label based on user settings
 */
export function formatMacro(
  gramsValue: number | null | undefined,
  settings: Omit<UserSettings, "calorieUnit" | "volumeUnit">,
): string {
  const converted = convertMacroForDisplay(
    gramsValue,
    settings.weightUnit as AcceptedUnits,
  );
  const formatted =
    settings.weightUnit === "mg"
      ? Math.round(converted)
      : Math.round(converted * 10) / 10;
  return `${formatted}${settings.weightUnit}`;
}

/**
 * Format a salt value for display, ensuring that very small values are shown as 0 and using the appropriate unit label based on user settings
 */
export function formatSalt(
  gramsValue: number | null | undefined,
  settings: Omit<UserSettings, "calorieUnit" | "volumeUnit">,
): string {
  if (gramsValue === null || gramsValue === undefined) {
    return "0g";
  }
  const converted = convertMacroForDisplay(
    gramsValue,
    settings.weightUnit as AcceptedUnits,
  );
  const unit = settings.weightUnit || "g";
  return `${Number(converted.toFixed(2))}${unit}`;
}

/**
 * Get the appropriate label and input unit for a measurement input based on the measurement type and user settings
 */
export function getMeasurementInputLabel(
  measurementType: MeasurementType | undefined,
  settings: Omit<UserSettings, "calorieUnit">,
): { label: string; inputUnit: string } {
  if (measurementType === "weight") {
    const unit = settings.weightUnit || "g";
    return { label: `Weight (${unit})`, inputUnit: unit };
  } else if (measurementType === "volume") {
    const unit = settings.volumeUnit || "ml";
    return { label: `Volume (${unit})`, inputUnit: unit };
  } else {
    return { label: "Measurement", inputUnit: "" };
  }
}

/**
 * Convert a user input value in their preferred unit for calories or macros back to the standard unit for storage (kcal for calories, grams for macros
 */
export function convertInputToStorageValue(
  inputValue: number | null | undefined,
  inputUnit: AcceptedUnits | null | undefined,
  measurementType: (MeasurementType | "calorie") | undefined,
): number {
  if (inputValue === null || inputValue === undefined || !inputUnit) {
    return 0;
  }
  if (measurementType === "weight") {
    return convertMacroFromInput(inputValue, inputUnit);
  } else if (measurementType === "volume") {
    // For volume, we currently only support ml which is stored as is
    return inputValue;
  } else {
    // Assume it's a calorie value
    return convertCaloriesFromInput(inputValue, inputUnit);
  }
}

/**
 * Convert a value stored in the database to the user's preferred display unit for calories or macros, based on the measurement type and user settings
 */
export function convertStorageToDisplayValue(
  storageValue: number | null | undefined,
  inputUnit: AcceptedUnits | null | undefined,
  measurementType: (MeasurementType | "calorie") | undefined,
): number {
  if (storageValue === null || storageValue === undefined || !inputUnit) {
    return 0;
  }
  if (measurementType === "weight") {
    return convertMacroForDisplay(storageValue, inputUnit);
  } else if (measurementType === "volume") {
    // For volume, we currently only support ml which is stored as is
    return storageValue;
  } else {
    // Assume it's a calorie value
    return convertCaloriesForDisplay(storageValue, inputUnit);
  }
}
