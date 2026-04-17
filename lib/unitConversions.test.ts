import {
  convertHeightCmToFeetInches,
  convertHeightFeetInchesToCm,
  convertCaloriesForDisplay,
  convertCaloriesFromInput,
  convertVolumeForDisplay,
  convertVolumeFromInput,
  getCalorieForDisplay,
  getWeightForDisplay,
  getMeasurementType,
  getVolumeForDisplay,
  convertBodyWeightForDisplay,
  getBodyWeightForDisplay,
  convertBodyWeightFromInput,
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

test("convertVolumeFromInput", () => {
  // Test null and undefined inputs
  expect(convertVolumeFromInput(null, "ml")).toBe(0);
  expect(convertVolumeFromInput(undefined, "ml")).toBe(0);
  expect(convertVolumeFromInput(4.22675284, "cup")).toBeCloseTo(1000, 4);
  expect(convertVolumeFromInput(6.76280455, "tbsp")).toBeCloseTo(100, 4);
  expect(convertVolumeFromInput(2.02884136, "tsp")).toBeCloseTo(10, 4);
  expect(convertVolumeFromInput(1, "L")).toBe(1000);
  expect(convertVolumeFromInput(500, "ml")).toBe(500);
});

test("convertVolumeForDisplay", () => {
  // Test null and undefined inputs
  expect(convertVolumeForDisplay(null, "ml")).toBe(0);
  expect(convertVolumeForDisplay(undefined, "ml")).toBe(0);
  expect(convertVolumeForDisplay(1000, "cup")).toBeCloseTo(4.22675284, 4);
  expect(convertVolumeForDisplay(100, "tbsp")).toBeCloseTo(6.76280455, 4);
  expect(convertVolumeForDisplay(10, "tsp")).toBeCloseTo(2.02884136, 4);
  expect(convertVolumeForDisplay(1000, "L")).toBe(1);
  expect(convertVolumeForDisplay(500, "ml")).toBe(500);
});

test("getMeasurementType", () => {
  expect(getMeasurementType("g")).toBe("weight");
  expect(getMeasurementType("oz")).toBe("weight");
  expect(getMeasurementType("kg")).toBe("weight");
  expect(getMeasurementType("lbs")).toBe("weight");
  expect(getMeasurementType("mg")).toBe("weight");
  expect(getMeasurementType("ml")).toBe("volume");
  expect(getMeasurementType("cup")).toBe("volume");
  expect(getMeasurementType("tbsp")).toBe("volume");
  expect(getMeasurementType("tsp")).toBe("volume");
  expect(getMeasurementType("L")).toBe("volume");
  expect(() => getMeasurementType(undefined)).toThrow(
    "Unknown unit: undefined",
  );
  expect(() => getMeasurementType(null)).toThrow("Unknown unit: null");
});

test("getWeightForDisplay", () => {
  expect(getWeightForDisplay(100, "g")).toBe("100g");
  expect(getWeightForDisplay(100, "oz", 1)).toBe("3.5oz");
  expect(getWeightForDisplay(100, "kg", 1)).toBe("0.1kg");
  expect(getWeightForDisplay(100, "lbs", 1)).toBe("0.2lbs");
  expect(getWeightForDisplay(100, "mg", 1)).toBe("100000mg");
  expect(getWeightForDisplay(null, "g", 1)).toBe("0g");
  expect(getWeightForDisplay(undefined, "g", 1)).toBe("0g");
});

test("getVolumeForDisplay", () => {
  expect(getVolumeForDisplay(100, "ml")).toBe("100 ml");
  expect(getVolumeForDisplay(1000, "cup", 1)).toBe("4.2 cup");
  expect(getVolumeForDisplay(100, "tbsp", 1)).toBe("6.8 tbsp");
  expect(getVolumeForDisplay(100, "tsp", 1)).toBe("20.3 tsp");
  expect(getVolumeForDisplay(100, "L", 1)).toBe("0.1 L");
  expect(getVolumeForDisplay(null, "ml", 1)).toBe("0 ml");
  expect(getVolumeForDisplay(undefined, "ml", 1)).toBe("0 ml");
});

test("getCalorieForDisplay", () => {
  expect(getCalorieForDisplay(250, "kcal")).toBe("250 kcal");
  expect(getCalorieForDisplay(250, "kJ")).toBe("1046 kJ");
  expect(getCalorieForDisplay(null, "kcal")).toBe("0 kcal");
  expect(getCalorieForDisplay(undefined, "kcal")).toBe("0 kcal");
});

test("convertBodyWeightForDisplay", () => {
  expect(convertBodyWeightForDisplay(70, "kg")).toBe(70);
  expect(convertBodyWeightForDisplay(70, "lbs")).toBeCloseTo(154.3234, 3);
  expect(convertBodyWeightForDisplay(null, "kg")).toBe(0);
  expect(convertBodyWeightForDisplay(undefined, "kg")).toBe(0);
  expect(convertBodyWeightForDisplay(70, null)).toBe(70);
  expect(convertBodyWeightForDisplay(70, undefined)).toBe(70);
});

test("convertBodyWeightFromInput", () => {
  expect(convertBodyWeightFromInput(70, "kg")).toBe(70);
  expect(convertBodyWeightFromInput(154.3234, "lbs")).toBeCloseTo(70, 3);
  expect(convertBodyWeightFromInput(null, "kg")).toBe(0);
  expect(convertBodyWeightFromInput(undefined, "kg")).toBe(0);
  expect(convertBodyWeightFromInput(70, null)).toBe(70);
  expect(convertBodyWeightFromInput(70, undefined)).toBe(70);
});

test("getBodyWeightForDisplay", () => {
  expect(getBodyWeightForDisplay(70, "kg")).toBe("70 kg");
  expect(getBodyWeightForDisplay(70, "lbs")).toBe("154.3 lbs");
  expect(getBodyWeightForDisplay(null, "kg")).toBe("0 kg");
  expect(getBodyWeightForDisplay(undefined, "kg")).toBe("0 kg");
  expect(getBodyWeightForDisplay(70, null)).toBe("70");
  expect(getBodyWeightForDisplay(70, undefined)).toBe("70");
});

test("convertHeightCmToFeetInches", () => {
  expect(convertHeightCmToFeetInches(170)).toEqual({ feet: 5, inches: 6.9 });
  expect(convertHeightCmToFeetInches(null)).toEqual({ feet: 0, inches: 0 });
  expect(convertHeightCmToFeetInches(undefined)).toEqual({
    feet: 0,
    inches: 0,
  });
  expect(convertHeightCmToFeetInches(0)).toEqual({ feet: 0, inches: 0 });
});

test("convertHeightFeetInchesToCm", () => {
  expect(convertHeightFeetInchesToCm(5, 7)).toBeCloseTo(170.18, 2);
  expect(convertHeightFeetInchesToCm(0, 0)).toBe(0);
  expect(convertHeightFeetInchesToCm(null, 10)).toBeCloseTo(25.4, 1);
  expect(convertHeightFeetInchesToCm(5, undefined)).toBeCloseTo(152.4, 1);
});
