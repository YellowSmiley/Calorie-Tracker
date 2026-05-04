import { prisma } from "@/lib/prisma";

export type DuplicateCheckInput = {
  id?: string;
  name: string;
  measurementType: string;
  measurementAmount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
};

export const CALORIE_TOLERANCE = 50;
export const NUTRITION_TOLERANCE = 5;
export const MIN_NAME_OVERLAP = 0.6;

export function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenSet(value: string) {
  return new Set(normalizeName(value).split(" ").filter(Boolean));
}

export function tokenOverlap(a: string, b: string) {
  const aTokens = tokenSet(a);
  const bTokens = tokenSet(b);
  if (aTokens.size === 0 || bTokens.size === 0) return 0;

  let intersection = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1;
  }

  return intersection / Math.max(aTokens.size, bTokens.size);
}

export function isWithinTolerance(a: number, b: number, tolerance: number) {
  return Math.abs(a - b) <= tolerance;
}

export function nutritionWithinTolerance(
  a: DuplicateCheckInput,
  b: DuplicateCheckInput,
) {
  return (
    isWithinTolerance(a.calories, b.calories, CALORIE_TOLERANCE) &&
    isWithinTolerance(a.protein, b.protein, NUTRITION_TOLERANCE) &&
    isWithinTolerance(a.carbs, b.carbs, NUTRITION_TOLERANCE) &&
    isWithinTolerance(a.fat, b.fat, NUTRITION_TOLERANCE) &&
    isWithinTolerance(a.saturates, b.saturates, NUTRITION_TOLERANCE) &&
    isWithinTolerance(a.sugars, b.sugars, NUTRITION_TOLERANCE) &&
    isWithinTolerance(a.fibre, b.fibre, NUTRITION_TOLERANCE) &&
    isWithinTolerance(a.salt, b.salt, NUTRITION_TOLERANCE)
  );
}

export function isLikelyDuplicate(
  input: DuplicateCheckInput,
  existing: DuplicateCheckInput,
) {
  const nameScore = tokenOverlap(input.name, existing.name);
  const nutritionMatch = nutritionWithinTolerance(input, existing);

  // Only block when nutrition is close and names are substantially similar.
  const likelyDuplicate = nutritionMatch && nameScore >= MIN_NAME_OVERLAP;

  return {
    likelyDuplicate,
    nameScore,
    nutritionMatch,
  };
}

export async function findLikelyDuplicateFood(input: DuplicateCheckInput) {
  const candidates = await prisma.food.findMany({
    where: {
      ...(input.id ? { id: { not: input.id } } : {}),
      measurementType: input.measurementType,
      calories: {
        gte: input.calories - CALORIE_TOLERANCE,
        lte: input.calories + CALORIE_TOLERANCE,
      },
    },
    take: 300,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      measurementType: true,
      measurementAmount: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      saturates: true,
      sugars: true,
      fibre: true,
      salt: true,
    },
  });

  for (const candidate of candidates) {
    const result = isLikelyDuplicate(input, candidate);
    if (result.likelyDuplicate) {
      return {
        id: candidate.id,
        name: candidate.name,
      };
    }
  }

  return null;
}
