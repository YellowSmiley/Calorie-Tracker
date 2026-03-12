// All values are stored in the database as kcal and grams
// These functions convert for display based on user preferences

import { MeasurementType } from "@/app/diary/types";
import {
  AcceptedBodyWeightUnits,
  AcceptedCalorieUnits,
  AcceptedVolumeUnits,
  AcceptedWeightedUnits,
} from "@/app/settings/types";

/**
 * Convert a kcal value stored in the database to the user's preferred display unit for calories
 */
export function convertCaloriesForDisplay(
  kcalValue: number | null | undefined,
  targetUnit: AcceptedCalorieUnits | null | undefined,
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
  inputUnit: AcceptedCalorieUnits | null | undefined,
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
export function convertWeightForDisplay(
  gramsValue: number | null | undefined,
  targetUnit: AcceptedWeightedUnits | null | undefined,
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
export function convertWeightFromInput(
  inputValue: number | null | undefined,
  inputUnit: AcceptedWeightedUnits | null | undefined,
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
 * Convert a user input value in their preferred unit (e.g cup) for volume back to millilitres for storage
 */
export function convertVolumeFromInput(
  inputValue: number | null | undefined,
  targetUnit: AcceptedVolumeUnits | null | undefined,
): number {
  if (inputValue === null || inputValue === undefined) {
    return 0;
  }

  switch (targetUnit) {
    case "cup":
      return inputValue * 236.588236;
    case "tbsp":
      return inputValue * 14.7867648;
    case "tsp":
      return inputValue * 4.92892159;
    case "L":
      return inputValue * 1000;
    case "ml":
    default:
      return inputValue;
  }
}

/**
 * Convert a millilitres value stored in the database to the user's preferred display unit (e.g. cup) for volume
 */
export function convertVolumeForDisplay(
  mlValue: number | null | undefined,
  inputUnit: AcceptedVolumeUnits | null | undefined,
): number {
  if (mlValue === null || mlValue === undefined) {
    return 0;
  }
  switch (inputUnit) {
    case "cup":
      return mlValue / 236.588236;
    case "tbsp":
      return mlValue / 14.7867648;
    case "tsp":
      return mlValue / 4.92892159;
    case "L":
      return mlValue / 1000;
    case "ml":
    default:
      return mlValue;
  }
}

/**
 * Format a kcal value for display with the appropriate unit label based on user settings
 */
export function getCalorieForDisplay(
  kcalValue: number | null | undefined,
  calorieUnit: AcceptedCalorieUnits | null,
): string {
  const converted = convertCaloriesForDisplay(kcalValue, calorieUnit);
  return `${Math.round(converted)} ${calorieUnit}`;
}

/**
 * Convert a grams value stored in the database to the user's preferred display unit and format it with the appropriate unit label based on user settings (e.g. "100 g" or "3.5 oz")
 */
export function getWeightForDisplay(
  gramsValue: number | null | undefined,
  weightUnit: AcceptedWeightedUnits | null,
  decimalPlaces: number = 2,
): string {
  const converted = convertWeightForDisplay(
    gramsValue,
    weightUnit as AcceptedWeightedUnits,
  );
  const formatted = Number(converted.toFixed(decimalPlaces));
  return `${formatted}${weightUnit}`;
}

export function convertBodyWeightForDisplay(
  kgValue: number | null | undefined,
  targetUnit: AcceptedBodyWeightUnits | null | undefined,
): number {
  if (kgValue === null || kgValue === undefined) {
    return 0;
  }

  switch (targetUnit) {
    case "lbs":
      return kgValue * 2.20462;
    case "kg":
    default:
      return kgValue;
  }
}

export function convertBodyWeightFromInput(
  inputValue: number | null | undefined,
  inputUnit: AcceptedBodyWeightUnits | null | undefined,
): number {
  if (inputValue === null || inputValue === undefined) {
    return 0;
  }

  switch (inputUnit) {
    case "lbs":
      return inputValue / 2.20462;
    case "kg":
    default:
      return inputValue;
  }
}

export function getBodyWeightForDisplay(
  kgValue: number | null | undefined,
  bodyWeightUnit: AcceptedBodyWeightUnits | null | undefined,
  decimalPlaces: number = 1,
): string {
  const converted = convertBodyWeightForDisplay(kgValue, bodyWeightUnit);
  const formatted = Number(converted.toFixed(decimalPlaces));
  return `${formatted}${bodyWeightUnit ? ` ${bodyWeightUnit}` : ""}`;
}

export function getMeasurementType(
  unit: AcceptedVolumeUnits | AcceptedWeightedUnits | null | undefined,
): MeasurementType {
  const weightUnits: AcceptedWeightedUnits[] = ["g", "oz", "kg", "lbs", "mg"];
  const volumeUnits: AcceptedVolumeUnits[] = ["ml", "cup", "tbsp", "tsp", "L"];

  if (weightUnits.includes(unit as AcceptedWeightedUnits)) {
    return "weight";
  }
  if (volumeUnits.includes(unit as AcceptedVolumeUnits)) {
    return "volume";
  }
  throw new Error(`Unknown unit: ${unit}`);
}
/**
 * Convert a millilitres value stored in the database to the user's preferred display unit and format it with the appropriate unit label based on user settings (e.g. "250 ml" or "1.5 cup")
 */
export function getVolumeForDisplay(
  mlValue: number | null | undefined,
  volumeUnit: AcceptedVolumeUnits | null | undefined,
  decimalPlaces: number = 2,
): string {
  const converted = convertVolumeForDisplay(mlValue, volumeUnit);
  const formatted = Number(converted.toFixed(decimalPlaces));
  return `${formatted} ${volumeUnit}`;
}
