export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
}

export const EMPTY_NUTRITION_TOTALS: NutritionTotals = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  saturates: 0,
  sugars: 0,
  fibre: 0,
  salt: 0,
};

export const NUTRITION_SUMMARY_FIELDS = [
  { key: "calories", label: "Calories", isCalorie: true },
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbohydrates" },
  { key: "fat", label: "Fat" },
  { key: "saturates", label: "Saturates" },
  { key: "sugars", label: "Sugars" },
  { key: "fibre", label: "Fibre" },
  { key: "salt", label: "Salt" },
] as const satisfies ReadonlyArray<{
  key: keyof NutritionTotals;
  label: string;
  isCalorie?: boolean;
}>;

export function calculateNutritionTotals<T extends NutritionTotals>(
  items: T[],
): NutritionTotals {
  return items.reduce(
    (totals, item) => ({
      calories: totals.calories + item.calories,
      protein: totals.protein + item.protein,
      carbs: totals.carbs + item.carbs,
      fat: totals.fat + item.fat,
      saturates: totals.saturates + item.saturates,
      sugars: totals.sugars + item.sugars,
      fibre: totals.fibre + item.fibre,
      salt: totals.salt + item.salt,
    }),
    EMPTY_NUTRITION_TOTALS,
  );
}
