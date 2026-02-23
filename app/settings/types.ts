import { User } from "@prisma/client";

export type AcceptedUnits = "g" | "oz" | "kg" | "lbs" | "mg";

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
  | "calorieUnit"
  | "volumeUnit"
> & {
  weightUnit: AcceptedUnits;
};

export type UserSettings = Pick<User, "calorieUnit" | "volumeUnit"> & {
  weightUnit: AcceptedUnits;
};
