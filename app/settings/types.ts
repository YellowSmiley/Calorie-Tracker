export interface SettingsData {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  saturatesGoal: number;
  sugarsGoal: number;
  fibreGoal: number;
  saltGoal: number;
  calorieUnit: string;
  macroUnit: string;
  weightUnit: string;
  volumeUnit: string;
}

export interface UserSettings {
  calorieUnit: string | null | undefined;
  macroUnit: string | null | undefined;
  weightUnit: string | null | undefined;
  volumeUnit: string | null | undefined;
}
