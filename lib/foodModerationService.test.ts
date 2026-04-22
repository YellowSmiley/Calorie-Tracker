jest.mock("@/lib/foodDuplicateDetection", () => ({
  findLikelyDuplicateFood: jest.fn(async () => null),
}));

import {
  buildDuplicateCheckInput,
  getFoodModerationError,
  normalizeFoodWriteInput,
} from "./foodModerationService";

describe("foodModerationService", () => {
  test("normalizeFoodWriteInput applies safe defaults", () => {
    const normalized = normalizeFoodWriteInput({
      name: "Food",
      measurementType: "weight",
      measurementAmount: -1,
      calories: 100,
      protein: 10,
      carbs: 10,
      fat: 10,
      saturates: 1,
      sugars: 1,
      fibre: 1,
      salt: 1,
      defaultServingAmount: -4,
      defaultServingDescription: "  some serving  ",
    });

    expect(normalized.measurementAmount).toBe(100);
    expect(normalized.defaultServingAmount).toBeNull();
    expect(normalized.defaultServingDescription).toBe("some serving");
  });

  test("getFoodModerationError flags blocked language", () => {
    const error = getFoodModerationError(
      normalizeFoodWriteInput({
        name: "fuck food",
        measurementType: "weight",
        measurementAmount: 100,
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 10,
        saturates: 1,
        sugars: 1,
        fibre: 1,
        salt: 1,
      }),
    );

    expect(error).toEqual({
      message: "Food name contains blocked language.",
      code: "FOOD_NAME_BLOCKED",
    });
  });

  test("buildDuplicateCheckInput maps normalized values", () => {
    const normalized = normalizeFoodWriteInput({
      name: "Greek Yogurt",
      measurementType: "weight",
      measurementAmount: 100,
      calories: 70,
      protein: 8,
      carbs: 4,
      fat: 2,
      saturates: 1,
      sugars: 3,
      fibre: 0,
      salt: 0.1,
    });

    const duplicateCheck = buildDuplicateCheckInput(normalized, "food-1");
    expect(duplicateCheck.id).toBe("food-1");
    expect(duplicateCheck.name).toBe("Greek Yogurt");
    expect(duplicateCheck.calories).toBe(70);
  });
});
