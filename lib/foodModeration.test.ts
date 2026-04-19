import {
  containsBlockedLanguage,
  validateFoodNumbersForModeration,
} from "./foodModeration";

describe("foodModeration", () => {
  describe("containsBlockedLanguage", () => {
    it("returns false for clean names", () => {
      expect(containsBlockedLanguage("Chicken breast")).toBe(false);
    });

    it("returns true when blocked language is present", () => {
      expect(containsBlockedLanguage("bad fuck word")).toBe(true);
    });

    it("returns true for concatenated blocked words", () => {
      expect(containsBlockedLanguage("CuntCIUNTFUCK")).toBe(true);
    });
  });

  describe("validateFoodNumbersForModeration", () => {
    it("returns null for sensible nutrition values", () => {
      expect(
        validateFoodNumbersForModeration({
          calories: 200,
          protein: 20,
          carbs: 30,
          fat: 7,
          saturates: 1,
          sugars: 3,
          fibre: 5,
          salt: 0.2,
        }),
      ).toBeNull();
    });

    it("flags very high calories", () => {
      expect(
        validateFoodNumbersForModeration({
          calories: 1000,
          protein: 20,
          carbs: 30,
          fat: 7,
          saturates: 1,
          sugars: 3,
          fibre: 5,
          salt: 0.2,
        }),
      ).toBeTruthy();
    });
  });
});