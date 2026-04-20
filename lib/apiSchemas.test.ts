import {
  bodyWeightDateQuerySchema,
  bodyWeightPutBodySchema,
  foodReportBodySchema,
  mealEntryParamsSchema,
  mealEntryPatchBodySchema,
  mealFavoriteCreateBodySchema,
  mealFavoriteParamsSchema,
  mealFavoritesGetQuerySchema,
  mealsGetQuerySchema,
  mealsPostBodySchema,
  settingsPutBodySchema,
} from "./apiSchemas";

describe("apiSchemas", () => {
  test("accepts valid meals GET query", () => {
    const result = mealsGetQuerySchema.safeParse({ date: "2026-04-20" });
    expect(result.success).toBe(true);
  });

  test("rejects invalid meals GET query date format", () => {
    const result = mealsGetQuerySchema.safeParse({ date: "20/04/2026" });
    expect(result.success).toBe(false);
  });

  test("accepts valid meals POST payload", () => {
    const result = mealsPostBodySchema.safeParse({
      mealType: "BREAKFAST",
      foodId: "food_123",
      serving: 1.5,
      date: "2026-04-20",
    });

    expect(result.success).toBe(true);
  });

  test("rejects invalid meal type in meals POST payload", () => {
    const result = mealsPostBodySchema.safeParse({
      mealType: "BRUNCH",
      foodId: "food_123",
    });

    expect(result.success).toBe(false);
  });

  test("rejects invalid serving in meal entry PATCH payload", () => {
    const result = mealEntryPatchBodySchema.safeParse({ serving: 1001 });
    expect(result.success).toBe(false);
  });

  test("rejects empty id in meal entry params", () => {
    const result = mealEntryParamsSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });

  test("accepts valid food report payload", () => {
    const result = foodReportBodySchema.safeParse({
      foodId: "food_123",
      reason: "Values seem incorrect",
    });

    expect(result.success).toBe(true);
  });

  test("rejects body-weight payload with invalid weight", () => {
    const result = bodyWeightPutBodySchema.safeParse({ weight: -1 });
    expect(result.success).toBe(false);
  });

  test("accepts valid body-weight date query", () => {
    const result = bodyWeightDateQuerySchema.safeParse({ date: "2026-04-20" });
    expect(result.success).toBe(true);
  });

  test("accepts valid settings payload", () => {
    const result = settingsPutBodySchema.safeParse({
      calorieGoal: "2500",
      proteinGoal: 150,
      carbGoal: 320,
      fatGoal: 80,
      saturatesGoal: 25,
      sugarsGoal: 70,
      fibreGoal: 30,
      saltGoal: 6,
      calorieUnit: "kcal",
      weightUnit: "g",
      bodyWeightUnit: "kg",
      volumeUnit: "ml",
    });

    expect(result.success).toBe(true);
  });

  test("rejects settings payload with invalid unit", () => {
    const result = settingsPutBodySchema.safeParse({
      calorieGoal: 2500,
      proteinGoal: 150,
      carbGoal: 320,
      fatGoal: 80,
      saturatesGoal: 25,
      sugarsGoal: 70,
      fibreGoal: 30,
      saltGoal: 6,
      weightUnit: "stone",
    });

    expect(result.success).toBe(false);
  });

  test("accepts valid meal favorite creation payload", () => {
    const result = mealFavoriteCreateBodySchema.safeParse({
      name: "Post Workout",
      mealType: "LUNCH",
      items: [
        { foodId: "food_1", serving: 1.25 },
        { foodId: "food_2", serving: 2 },
      ],
    });

    expect(result.success).toBe(true);
  });

  test("rejects meal favorites query with invalid meal type", () => {
    const result = mealFavoritesGetQuerySchema.safeParse({
      mealType: "BRUNCH",
    });
    expect(result.success).toBe(false);
  });

  test("rejects empty meal favorite params id", () => {
    const result = mealFavoriteParamsSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });
});
