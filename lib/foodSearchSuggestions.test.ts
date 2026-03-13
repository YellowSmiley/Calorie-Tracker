import {
  normalizeForComparison,
  damerauLevenshtein,
  scoreSuggestion,
  findCloseFoodSuggestions,
  sortByRelevanceAndUsage,
} from "./foodSearchSuggestions";

describe("foodSearchSuggestions", () => {
  describe("normalizeForComparison", () => {
    it("trims and lowercases", () => {
      expect(normalizeForComparison("  ChIcKeN Breast  ")).toBe(
        "chicken breast",
      );
    });
  });

  describe("damerauLevenshtein", () => {
    it("returns 0 for equal strings ignoring case and surrounding spaces", () => {
      expect(damerauLevenshtein("  Apple ", "apple")).toBe(0);
    });

    it("handles insertion/deletion", () => {
      expect(damerauLevenshtein("banana", "bananas")).toBe(1);
      expect(damerauLevenshtein("bananas", "banana")).toBe(1);
    });

    it("handles transposition typo", () => {
      expect(damerauLevenshtein("aplpe", "apple")).toBe(1);
    });
  });

  describe("scoreSuggestion", () => {
    it("prefers closer matches", () => {
      const close = scoreSuggestion("bananna", "banana");
      const far = scoreSuggestion("bananna", "chicken breast");
      expect(close).toBeLessThan(far);
    });

    it("gives a better score to prefix matches when distance ties", () => {
      const prefix = scoreSuggestion("app", "apple");
      const nonPrefix = scoreSuggestion("app", "snap pea");
      expect(prefix).toBeLessThan(nonPrefix);
    });
  });

  describe("findCloseFoodSuggestions", () => {
    it("returns empty for short or blank search", () => {
      expect(findCloseFoodSuggestions("", ["apple"])).toEqual([]);
      expect(findCloseFoodSuggestions("a", ["apple"])).toEqual([]);
    });

    it("returns best typo-friendly suggestions first", () => {
      const suggestions = findCloseFoodSuggestions("bananna", [
        "banana",
        "bandana",
        "apple",
        "peanut butter",
        "bananas",
      ]);

      expect(suggestions[0]).toBe("banana");
      expect(suggestions).toContain("bananas");
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it("returns at most five suggestions", () => {
      const suggestions = findCloseFoodSuggestions("rice", [
        "white rice",
        "brown rice",
        "wild rice",
        "rice cakes",
        "rice noodles",
        "rice milk",
        "chicken",
      ]);

      expect(suggestions).toHaveLength(5);
    });
  });

  describe("sortByRelevanceAndUsage", () => {
    it("prioritizes relevance before usage", () => {
      const sorted = sortByRelevanceAndUsage(
        [
          { name: "bread roll", usageCount: 100 },
          { name: "bread", usageCount: 1 },
          { name: "wholemeal bread", usageCount: 500 },
        ],
        "bread",
      );

      expect(sorted.map((item) => item.name)).toEqual([
        "bread",
        "bread roll",
        "wholemeal bread",
      ]);
    });

    it("uses usage as tie-breaker for equally relevant names", () => {
      const sorted = sortByRelevanceAndUsage(
        [
          { name: "banana bread", usageCount: 4 },
          { name: "bread pudding", usageCount: 12 },
        ],
        "bread",
      );

      expect(sorted.map((item) => item.name)).toEqual([
        "bread pudding",
        "banana bread",
      ]);
    });

    it("sorts by usage when search is empty", () => {
      const sorted = sortByRelevanceAndUsage(
        [
          { name: "apple", usageCount: 2 },
          { name: "banana", usageCount: 8 },
          { name: "carrot", usageCount: 1 },
        ],
        "",
      );

      expect(sorted.map((item) => item.name)).toEqual([
        "banana",
        "apple",
        "carrot",
      ]);
    });
  });
});
