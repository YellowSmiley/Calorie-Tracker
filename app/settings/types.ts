import { User } from "@prisma/client";

export type AcceptedWeightedUnits = "g" | "oz" | "kg" | "lbs" | "mg";
export type AcceptedBodyWeightUnits = "kg" | "lbs";
export type AcceptedVolumeUnits = "ml" | "cup" | "tbsp" | "tsp" | "L";
export type AcceptedCalorieUnits = "kcal" | "kJ";

export type SettingsData = Pick<
  User,
  | "calorieGoal"
  | "proteinGoal"
  | "carbGoal"
  | "fatGoal"
  | "saturatesGoal"
  | "sugarsGoal"
  | "fibreGoal"
  | "saltGoal"
> & {
  weightUnit: AcceptedWeightedUnits;
  bodyWeightUnit: AcceptedBodyWeightUnits;
  volumeUnit: AcceptedVolumeUnits;
  calorieUnit: AcceptedCalorieUnits;
};

export type UserSettings = Pick<
  SettingsData,
  "calorieUnit" | "volumeUnit" | "weightUnit"
> & {
  bodyWeightUnit?: AcceptedBodyWeightUnits;
};
