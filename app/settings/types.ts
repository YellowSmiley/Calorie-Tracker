import { User } from "@prisma/client";

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
  | "weightUnit"
  | "volumeUnit"
>;

export type UserSettings = Pick<
  User,
  "calorieUnit" | "weightUnit" | "volumeUnit"
>;
