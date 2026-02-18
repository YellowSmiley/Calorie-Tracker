import {
  convertCaloriesForDisplay,
  convertCaloriesFromInput,
  convertInputToStorageValue,
  convertMacroForDisplay,
  convertMacroFromInput,
  convertStorageToDisplayValue,
  formatCalories,
  formatMacro,
  formatSalt,
  getMeasurementInputLabel,
} from "./unitConversions";

describe("convertCaloriesForDisplay", () => {
  it("returns 0 for null value", () => {
    expect(convertCaloriesForDisplay(null, "kcal")).toBe(0);
  });

  it("returns 0 for undefined value", () => {
    expect(convertCaloriesForDisplay(undefined, "kcal")).toBe(0);
  });

  it("returns 0 when targetUnit is null", () => {
    expect(convertCaloriesForDisplay(100, null)).toBe(0);
  });

  it("returns 0 when targetUnit is undefined", () => {
    expect(convertCaloriesForDisplay(100, undefined)).toBe(0);
  });

  it("returns same value for kcal", () => {
    expect(convertCaloriesForDisplay(250, "kcal")).toBe(250);
  });

  it("converts kcal to kJ (x4.184)", () => {
    expect(convertCaloriesForDisplay(100, "kJ")).toBeCloseTo(418.4, 1);
  });

  it("returns same value for unknown unit (default case)", () => {
    expect(convertCaloriesForDisplay(100, "unknown")).toBe(100);
  });
});

describe("convertCaloriesFromInput", () => {
  it("returns 0 for null value", () => {
    expect(convertCaloriesFromInput(null, "kcal")).toBe(0);
  });

  it("returns 0 for undefined value", () => {
    expect(convertCaloriesFromInput(undefined, "kcal")).toBe(0);
  });

  it("returns 0 when inputUnit is null", () => {
    expect(convertCaloriesFromInput(100, null)).toBe(0);
  });

  it("returns same value for kcal", () => {
    expect(convertCaloriesFromInput(250, "kcal")).toBe(250);
  });

  it("converts kJ to kcal (/4.184)", () => {
    expect(convertCaloriesFromInput(418.4, "kJ")).toBeCloseTo(100, 1);
  });

  it("round-trips correctly: display then input returns original", () => {
    const original = 350;
    const displayed = convertCaloriesForDisplay(original, "kJ");
    const backToKcal = convertCaloriesFromInput(displayed, "kJ");
    expect(backToKcal).toBeCloseTo(original, 5);
  });
});

describe("convertMacroForDisplay", () => {
  it("returns 0 for null value", () => {
    expect(convertMacroForDisplay(null, "g")).toBe(0);
  });

  it("returns 0 for undefined value", () => {
    expect(convertMacroForDisplay(undefined, "g")).toBe(0);
  });

  it("returns same value for grams", () => {
    expect(convertMacroForDisplay(50, "g")).toBe(50);
  });

  it("returns same value when targetUnit is null (default)", () => {
    expect(convertMacroForDisplay(50, null)).toBe(50);
  });

  it("converts grams to oz", () => {
    expect(convertMacroForDisplay(100, "oz")).toBeCloseTo(3.5274, 4);
  });

  it("converts grams to mg (x1000)", () => {
    expect(convertMacroForDisplay(5, "mg")).toBe(5000);
  });
});

describe("convertMacroFromInput", () => {
  it("returns 0 for null value", () => {
    expect(convertMacroFromInput(null, "g")).toBe(0);
  });

  it("returns 0 for undefined value", () => {
    expect(convertMacroFromInput(undefined, "g")).toBe(0);
  });

  it("returns same value for grams", () => {
    expect(convertMacroFromInput(50, "g")).toBe(50);
  });

  it("converts oz to grams", () => {
    expect(convertMacroFromInput(3.5274, "oz")).toBeCloseTo(100, 0);
  });

  it("converts mg to grams (/1000)", () => {
    expect(convertMacroFromInput(5000, "mg")).toBe(5);
  });

  it("round-trips correctly: display then input returns original", () => {
    const original = 150;
    const displayed = convertMacroForDisplay(original, "oz");
    const backToGrams = convertMacroFromInput(displayed, "oz");
    expect(backToGrams).toBeCloseTo(original, 5);
  });
});

describe("formatCalories", () => {
  it("formats kcal values", () => {
    expect(formatCalories(250.7, { calorieUnit: "kcal" })).toBe("251 kcal");
  });

  it("formats kJ values (multiplied by 4.184)", () => {
    expect(formatCalories(100, { calorieUnit: "kJ" })).toBe("418 kJ");
  });

  it("rounds to nearest integer", () => {
    expect(formatCalories(100.4, { calorieUnit: "kcal" })).toBe("100 kcal");
  });

  it("handles null value", () => {
    expect(formatCalories(null, { calorieUnit: "kcal" })).toBe("0 kcal");
  });
});

describe("formatMacro", () => {
  it("formats gram values with one decimal", () => {
    expect(formatMacro(25.67, { weightUnit: "g" })).toBe("25.7g");
  });

  it("formats mg values as integers", () => {
    expect(formatMacro(0.5, { weightUnit: "mg" })).toBe("500mg");
  });

  it("formats oz values with one decimal", () => {
    expect(formatMacro(100, { weightUnit: "oz" })).toBe("3.5oz");
  });

  it("handles null value", () => {
    expect(formatMacro(null, { weightUnit: "g" })).toBe("0g");
  });
});

describe("formatSalt", () => {
  it("formats salt values with one decimal and 'g' unit", () => {
    expect(formatSalt(0.567, { weightUnit: "g" })).toBe("0.57g");
  });
  it("handles null value", () => {
    expect(formatSalt(null, { weightUnit: "g" })).toBe("0g");
  });
});

describe("getMeasurementInputLabel", () => {
  it("returns 'Amount (g)' for weight measurement type with g unit", () => {
    expect(
      getMeasurementInputLabel("weight", { weightUnit: "g", volumeUnit: "ml" }),
    ).toEqual({ label: "Weight (g)", inputUnit: "g" });
  });

  it("returns 'Amount (oz)' for weight measurement type with oz unit", () => {
    expect(
      getMeasurementInputLabel("weight", {
        weightUnit: "oz",
        volumeUnit: "ml",
      }),
    ).toEqual({ label: "Weight (oz)", inputUnit: "oz" });
  });

  it("returns 'Amount (ml)' for volume measurement type with ml unit", () => {
    expect(
      getMeasurementInputLabel("volume", { weightUnit: "g", volumeUnit: "ml" }),
    ).toEqual({ label: "Volume (ml)", inputUnit: "ml" });
  });
});

test("convertInputToStorageValue", () => {
  expect(convertInputToStorageValue(null, "g", "weight")).toBe(0);
  expect(convertInputToStorageValue(undefined, "g", "weight")).toBe(0);
  expect(convertInputToStorageValue(100, null, "weight")).toBe(0);
  expect(convertInputToStorageValue(100, "g", "weight")).toBe(100);
  expect(convertInputToStorageValue(100, "oz", "weight")).toBeCloseTo(
    2834.95,
    1,
  );
  expect(convertInputToStorageValue(100, "mg", "weight")).toBe(0.1);
  expect(convertInputToStorageValue(250, "kcal", "calorie")).toBe(250);
  expect(convertInputToStorageValue(418.4, "kJ", "calorie")).toBeCloseTo(
    100,
    1,
  );
});

test("convertStorageToDisplayValue", () => {
  expect(convertStorageToDisplayValue(0, "g", "weight")).toBe(0);
  expect(convertStorageToDisplayValue(100, "g", "weight")).toBe(100);
  expect(convertStorageToDisplayValue(2834.95, "oz", "weight")).toBeCloseTo(
    100,
    1,
  );
  expect(convertStorageToDisplayValue(0.1, "mg", "weight")).toBe(100);
  expect(convertStorageToDisplayValue(250, "kcal", "calorie")).toBe(250);
  expect(convertStorageToDisplayValue(100, "kJ", "calorie")).toBeCloseTo(
    418.4,
    1,
  );
});
