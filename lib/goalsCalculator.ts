export type GoalType = "lose" | "maintain" | "gain" | "muscle";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very";
export type SexType = "male" | "female";
export type WeightChangePace = "mild" | "normal";

export interface GoalCalculatorInput {
  age: number;
  heightCm: number;
  weightKg: number;
  sex: SexType;
  goal: GoalType;
  activity: ActivityLevel;
  weightChangePace: WeightChangePace;
}

export interface GoalRecommendationsBase {
  calorieTargetKcal: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
}

export interface GoalMicronutrientLimitsBase {
  saturatesGrams: number;
  sugarsGrams: number;
  fibreGrams: number;
  saltGrams: number;
}

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

const PROTEIN_FACTORS: Record<GoalType, number> = {
  lose: 2,
  maintain: 1.6,
  gain: 1.8,
  muscle: 2.2,
};

const CALORIE_ADJUSTMENT_FOR_MILD = 275;
const CALORIE_ADJUSTMENT_FOR_NORMAL = 550;

const FAT_RATIOS: Record<GoalType, number> = {
  lose: 0.3,
  maintain: 0.3,
  gain: 0.27,
  muscle: 0.25,
};

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export function getGoalCalculatorValidationError(
  input: GoalCalculatorInput,
): string | null {
  if (input.age < 13 || input.age > 100) {
    return "Enter an age between 13 and 100.";
  }
  if (input.heightCm < 120 || input.heightCm > 240) {
    return "Enter a height between 120 and 240 cm.";
  }
  if (input.weightKg < 30 || input.weightKg > 300) {
    return "Enter a weight between 30 and 300 kg.";
  }

  return null;
}

export function calculateGoalRecommendations(
  input: GoalCalculatorInput,
): GoalRecommendationsBase | null {
  const validationError = getGoalCalculatorValidationError(input);
  if (validationError) {
    return null;
  }

  const sexOffset = input.sex === "male" ? 5 : -161;
  const bmr =
    10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + sexOffset;
  const maintenanceCalories = bmr * ACTIVITY_FACTORS[input.activity];

  const calorieAdjustment =
    input.goal === "lose"
      ? input.weightChangePace === "mild"
        ? -CALORIE_ADJUSTMENT_FOR_MILD
        : -CALORIE_ADJUSTMENT_FOR_NORMAL
      : input.goal === "gain"
        ? input.weightChangePace === "mild"
          ? CALORIE_ADJUSTMENT_FOR_MILD
          : CALORIE_ADJUSTMENT_FOR_NORMAL
        : input.goal === "muscle"
          ? 200
          : 0;

  const calorieTargetKcal = Math.max(
    1200,
    Math.round(maintenanceCalories + calorieAdjustment),
  );

  const proteinGrams = input.weightKg * PROTEIN_FACTORS[input.goal];
  const fatGrams = (calorieTargetKcal * FAT_RATIOS[input.goal]) / 9;
  const carbGrams = Math.max(
    0,
    (calorieTargetKcal - proteinGrams * 4 - fatGrams * 9) / 4,
  );

  return {
    calorieTargetKcal,
    proteinGrams: roundToTenth(proteinGrams),
    carbGrams: roundToTenth(carbGrams),
    fatGrams: roundToTenth(fatGrams),
  };
}

export function calculateMicronutrientLimitsFromCalories(
  calorieTargetKcal: number,
): GoalMicronutrientLimitsBase {
  const safeCalories = Math.max(0, calorieTargetKcal);

  return {
    // Approximate max limits based on total calories.
    saturatesGrams: roundToTenth((safeCalories * 0.1) / 9),
    sugarsGrams: roundToTenth((safeCalories * 0.1) / 4),
    // Approximate minimum target used by common nutrition guidelines.
    fibreGrams: roundToTenth((safeCalories / 1000) * 14),
    // Daily upper guideline.
    saltGrams: 6,
  };
}
