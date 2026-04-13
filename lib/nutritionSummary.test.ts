import {
  EMPTY_NUTRITION_TOTALS,
  calculateNutritionTotals,
} from "./nutritionSummary";

describe("calculateNutritionTotals", () => {
  it("returns zero totals for an empty list", () => {
    expect(calculateNutritionTotals([])).toEqual(EMPTY_NUTRITION_TOTALS);
  });

  it("sums nutrient values across items", () => {
    expect(
      calculateNutritionTotals([
        {
          calories: 100,
          protein: 10,
          carbs: 20,
          fat: 5,
          saturates: 2,
          sugars: 7,
          fibre: 3,
          salt: 0.4,
        },
        {
          calories: 250,
          protein: 15,
          carbs: 5,
          fat: 12,
          saturates: 4,
          sugars: 1,
          fibre: 6,
          salt: 0.8,
        },
      ]),
    ).toEqual({
      calories: 350,
      protein: 25,
      carbs: 25,
      fat: 17,
      saturates: 6,
      sugars: 8,
      fibre: 9,
      salt: 1.2000000000000002,
    });
  });
});
