import {
  adminFoodUpsertBodySchema,
  adminUserPatchBodySchema,
  authRegisterBodySchema,
  authResetPasswordBodySchema,
  authVerifyQuerySchema,
  bodyWeightDateQuerySchema,
  bodyWeightPutBodySchema,
  dashboardGetQuerySchema,
  foodReportBodySchema,
  mealEntryParamsSchema,
  mealEntryPatchBodySchema,
  mealFavoriteApplyBodySchema,
  mealFavoriteClearMealBodySchema,
  mealFavoriteCreateBodySchema,
  mealFavoriteParamsSchema,
  mealFavoriteSaveCurrentBodySchema,
  mealFavoritesGetQuerySchema,
  mealsGetQuerySchema,
  mealsPostBodySchema,
  searchPaginationQuerySchema,
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

  test("accepts valid paginated search query", () => {
    const result = searchPaginationQuerySchema.safeParse({
      search: "oats",
      take: "25",
      skip: "0",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid dashboard query", () => {
    const result = dashboardGetQuerySchema.safeParse({
      range: "week",
      chartRange: "3m",
      date: "2026-04-20",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid register payload", () => {
    const result = authRegisterBodySchema.safeParse({
      name: "Alex",
      email: "alex@example.com",
      password: "Password1!",
    });

    expect(result.success).toBe(true);
  });

  test("rejects register payload with invalid email", () => {
    const result = authRegisterBodySchema.safeParse({
      email: "not-an-email",
      password: "Password1!",
    });

    expect(result.success).toBe(false);
  });

  test("accepts valid reset password payload", () => {
    const result = authResetPasswordBodySchema.safeParse({
      email: "alex@example.com",
      token: "abcd1234",
      password: "Password1!",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid verify query", () => {
    const result = authVerifyQuerySchema.safeParse({
      token: "abcd1234",
      email: "alex@example.com",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid admin food upsert payload", () => {
    const result = adminFoodUpsertBodySchema.safeParse({
      name: "Oats",
      measurementType: "weight",
      measurementAmount: 100,
      calories: 370,
      protein: 13.5,
      carbs: 60,
      fat: 7,
      saturates: 1,
      sugars: 1,
      fibre: 10,
      salt: 0.1,
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid admin user patch action", () => {
    const result = adminUserPatchBodySchema.safeParse({
      action: "addMark",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid meal favorite apply payload", () => {
    const result = mealFavoriteApplyBodySchema.safeParse({
      favoriteId: "fav_1",
      date: "2026-04-20",
      mealType: "DINNER",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid meal favorite save current payload", () => {
    const result = mealFavoriteSaveCurrentBodySchema.safeParse({
      name: "Dinner",
      mealType: "DINNER",
      date: "2026-04-20",
    });

    expect(result.success).toBe(true);
  });

  test("accepts valid meal favorite clear meal payload", () => {
    const result = mealFavoriteClearMealBodySchema.safeParse({
      mealType: "DINNER",
      date: "2026-04-20",
    });

    expect(result.success).toBe(true);
  });
});
