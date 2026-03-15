jest.mock("@/lib/prisma", () => ({
  prisma: {
    food: {
      findMany: jest.fn(),
    },
  },
}));

import {
  CALORIE_TOLERANCE,
  NUTRITION_TOLERANCE,
  normalizeName,
  tokenSet,
  tokenOverlap,
  isWithinTolerance,
  nutritionWithinTolerance,
  isLikelyDuplicate,
  findLikelyDuplicateFood,
  type DuplicateCheckInput,
} from "./foodDuplicateDetection";
import { prisma } from "@/lib/prisma";

const baseFood: DuplicateCheckInput = {
  name: "Chicken Breast",
  measurementType: "weight",
  measurementAmount: 100,
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  saturates: 1,
  sugars: 0,
  fibre: 0,
  salt: 0.2,
};

describe("foodDuplicateDetection helpers", () => {
  describe("normalizeName", () => {
    it("normalizes case, punctuation and spacing", () => {
      expect(normalizeName("  Chicken-Breast (Cooked)  ")).toBe(
        "chicken breast cooked",
      );
    });
  });

  describe("tokenSet", () => {
    it("returns deduplicated normalized tokens", () => {
      expect(Array.from(tokenSet("Apple apple PIE")).sort()).toEqual([
        "apple",
        "pie",
      ]);
    });
  });

  describe("tokenOverlap", () => {
    it("returns 1 for same token content regardless of order", () => {
      expect(tokenOverlap("chicken breast", "breast chicken")).toBe(1);
    });

    it("returns partial overlap score", () => {
      expect(tokenOverlap("greek yogurt plain", "greek yogurt")).toBeCloseTo(
        2 / 3,
      );
    });

    it("returns 0 for empty token sets", () => {
      expect(tokenOverlap("", "")).toBe(0);
    });
  });

  describe("isWithinTolerance", () => {
    it("returns true within boundary", () => {
      expect(isWithinTolerance(31, 35, NUTRITION_TOLERANCE)).toBe(true);
    });

    it("returns false outside boundary", () => {
      expect(isWithinTolerance(31, 37, NUTRITION_TOLERANCE)).toBe(false);
    });
  });

  describe("nutritionWithinTolerance", () => {
    it("returns true when all nutrition values are within tolerance", () => {
      expect(
        nutritionWithinTolerance(baseFood, {
          ...baseFood,
          calories: baseFood.calories + CALORIE_TOLERANCE,
          protein: baseFood.protein + 4,
        }),
      ).toBe(true);
    });

    it("returns false when any nutrition value exceeds tolerance", () => {
      expect(
        nutritionWithinTolerance(baseFood, {
          ...baseFood,
          calories: baseFood.calories + CALORIE_TOLERANCE + 1,
        }),
      ).toBe(false);
    });
  });

  describe("isLikelyDuplicate", () => {
    it("flags duplicates within tolerance even when names differ", () => {
      const result = isLikelyDuplicate(baseFood, {
        ...baseFood,
        name: "Totally Different Name",
        protein: 35,
      });

      expect(result.likelyDuplicate).toBe(true);
      expect(result.nutritionMatch).toBe(true);
    });

    it("does not flag when one nutrition field is out of tolerance", () => {
      const result = isLikelyDuplicate(baseFood, {
        ...baseFood,
        name: "Almost Same",
        protein: baseFood.protein + NUTRITION_TOLERANCE + 0.1,
      });

      expect(result.likelyDuplicate).toBe(false);
      expect(result.nutritionMatch).toBe(false);
    });

    it("ignores measurementAmount differences", () => {
      const result = isLikelyDuplicate(baseFood, {
        ...baseFood,
        name: "Another Name",
        measurementAmount: 1000,
      });

      expect(result.likelyDuplicate).toBe(true);
    });
  });

  describe("findLikelyDuplicateFood", () => {
    it("queries by nutrition bounds and measurementType, not by name", async () => {
      const findManyMock = prisma.food.findMany as jest.Mock;
      findManyMock.mockResolvedValue([{ id: "1", ...baseFood }]);

      await findLikelyDuplicateFood(baseFood);

      expect(findManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            measurementType: baseFood.measurementType,
            calories: {
              gte: baseFood.calories - CALORIE_TOLERANCE,
              lte: baseFood.calories + CALORIE_TOLERANCE,
            },
          }),
        }),
      );
      const whereArg = findManyMock.mock.calls[0][0].where;
      expect(whereArg).not.toHaveProperty("name");
    });
  });
});
