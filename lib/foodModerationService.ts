import type { Food } from "@prisma/client";
import {
  DuplicateCheckInput,
  findLikelyDuplicateFood,
} from "@/lib/foodDuplicateDetection";
import {
  containsBlockedLanguage,
  validateFoodNumbersForModeration,
} from "@/lib/foodModeration";

export type FoodModerationError = {
  message: string;
  code: "FOOD_NAME_BLOCKED" | "SERVING_DESCRIPTION_BLOCKED" | "FOOD_NUMBERS_INVALID";
};

export type FoodWriteInput = {
  name: string;
  measurementType: "weight" | "volume";
  measurementAmount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
  defaultServingAmount?: number | null;
  defaultServingDescription?: string | null;
};

export type NormalizedFoodWriteInput = Omit<FoodWriteInput, "defaultServingAmount" | "defaultServingDescription"> & {
  defaultServingAmount: number | null;
  defaultServingDescription: string | null;
};

export function normalizeFoodWriteInput(
  input: FoodWriteInput,
): NormalizedFoodWriteInput {
  return {
    ...input,
    measurementAmount:
      typeof input.measurementAmount === "number" && input.measurementAmount > 0
        ? input.measurementAmount
        : 100,
    saturates: typeof input.saturates === "number" ? input.saturates : 0,
    sugars: typeof input.sugars === "number" ? input.sugars : 0,
    fibre: typeof input.fibre === "number" ? input.fibre : 0,
    salt: typeof input.salt === "number" ? input.salt : 0,
    defaultServingAmount:
      typeof input.defaultServingAmount === "number" &&
      input.defaultServingAmount > 0
        ? input.defaultServingAmount
        : null,
    defaultServingDescription:
      typeof input.defaultServingDescription === "string" &&
      input.defaultServingDescription.trim()
        ? input.defaultServingDescription.trim().slice(0, 50)
        : null,
  };
}

export function getFoodModerationError(
  input: NormalizedFoodWriteInput,
): FoodModerationError | null {
  if (containsBlockedLanguage(input.name)) {
    return {
      message: "Food name contains blocked language.",
      code: "FOOD_NAME_BLOCKED",
    };
  }

  if (
    typeof input.defaultServingDescription === "string" &&
    containsBlockedLanguage(input.defaultServingDescription)
  ) {
    return {
      message: "Serving description contains blocked language.",
      code: "SERVING_DESCRIPTION_BLOCKED",
    };
  }

  const moderationNumberError = validateFoodNumbersForModeration({
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    saturates: input.saturates,
    sugars: input.sugars,
    fibre: input.fibre,
    salt: input.salt,
  });

  if (moderationNumberError) {
    return {
      message: moderationNumberError,
      code: "FOOD_NUMBERS_INVALID",
    };
  }

  return null;
}

export function buildDuplicateCheckInput(
  input: NormalizedFoodWriteInput,
  id?: string,
): DuplicateCheckInput {
  return {
    id,
    name: input.name,
    measurementType: input.measurementType,
    measurementAmount: input.measurementAmount,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    saturates: input.saturates,
    sugars: input.sugars,
    fibre: input.fibre,
    salt: input.salt,
  };
}

export async function findDuplicateFood(
  input: DuplicateCheckInput,
): Promise<{ id: string; name: string } | null> {
  return findLikelyDuplicateFood(input);
}

export function mergeWithExistingFood(
  existingFood: Food,
  incoming: Partial<FoodWriteInput>,
): NormalizedFoodWriteInput {
  const measurementType =
    incoming.measurementType ??
    (existingFood.measurementType === "volume" ? "volume" : "weight");

  return normalizeFoodWriteInput({
    name: incoming.name ?? existingFood.name,
    measurementType,
    measurementAmount:
      typeof incoming.measurementAmount === "number"
        ? incoming.measurementAmount
        : existingFood.measurementAmount,
    calories:
      typeof incoming.calories === "number"
        ? incoming.calories
        : existingFood.calories,
    protein:
      typeof incoming.protein === "number"
        ? incoming.protein
        : existingFood.protein,
    carbs:
      typeof incoming.carbs === "number" ? incoming.carbs : existingFood.carbs,
    fat: typeof incoming.fat === "number" ? incoming.fat : existingFood.fat,
    saturates:
      typeof incoming.saturates === "number"
        ? incoming.saturates
        : existingFood.saturates,
    sugars:
      typeof incoming.sugars === "number"
        ? incoming.sugars
        : existingFood.sugars,
    fibre:
      typeof incoming.fibre === "number" ? incoming.fibre : existingFood.fibre,
    salt: typeof incoming.salt === "number" ? incoming.salt : existingFood.salt,
    defaultServingAmount:
      incoming.defaultServingAmount ?? existingFood.defaultServingAmount,
    defaultServingDescription:
      incoming.defaultServingDescription ?? existingFood.defaultServingDescription,
  });
}
