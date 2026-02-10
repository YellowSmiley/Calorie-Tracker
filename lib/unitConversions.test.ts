import {
    convertCaloriesForDisplay,
    convertCaloriesFromInput,
    convertMacroForDisplay,
    convertMacroFromInput,
    formatCalories,
    formatMacro,
    parseMeasurement,
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

    it("returns same value for Cal (same as kcal)", () => {
        expect(convertCaloriesForDisplay(250, "Cal")).toBe(250);
    });

    it("converts kcal to cal (x1000)", () => {
        expect(convertCaloriesForDisplay(2, "cal")).toBe(2000);
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

    it("returns same value for Cal", () => {
        expect(convertCaloriesFromInput(250, "Cal")).toBe(250);
    });

    it("converts cal to kcal (/1000)", () => {
        expect(convertCaloriesFromInput(2000, "cal")).toBe(2);
    });

    it("round-trips correctly: display then input returns original", () => {
        const original = 350;
        const displayed = convertCaloriesForDisplay(original, "cal");
        const backToKcal = convertCaloriesFromInput(displayed, "cal");
        expect(backToKcal).toBe(original);
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
        expect(
            formatCalories(250.7, { calorieUnit: "kcal", macroUnit: "g" }),
        ).toBe("251 kcal");
    });

    it("formats cal values (multiplied by 1000)", () => {
        expect(
            formatCalories(2.5, { calorieUnit: "cal", macroUnit: "g" }),
        ).toBe("2500 cal");
    });

    it("rounds to nearest integer", () => {
        expect(
            formatCalories(100.4, { calorieUnit: "kcal", macroUnit: "g" }),
        ).toBe("100 kcal");
    });

    it("handles null value", () => {
        expect(
            formatCalories(null, { calorieUnit: "kcal", macroUnit: "g" }),
        ).toBe("0 kcal");
    });
});

describe("formatMacro", () => {
    it("formats gram values with one decimal", () => {
        expect(
            formatMacro(25.67, { calorieUnit: "kcal", macroUnit: "g" }),
        ).toBe("25.7g");
    });

    it("formats mg values as integers", () => {
        expect(
            formatMacro(0.5, { calorieUnit: "kcal", macroUnit: "mg" }),
        ).toBe("500mg");
    });

    it("formats oz values with one decimal", () => {
        expect(
            formatMacro(100, { calorieUnit: "kcal", macroUnit: "oz" }),
        ).toBe("3.5oz");
    });

    it("handles null value", () => {
        expect(
            formatMacro(null, { calorieUnit: "kcal", macroUnit: "g" }),
        ).toBe("0g");
    });
});

describe("parseMeasurement", () => {
    it("parses weight in grams (100g)", () => {
        const result = parseMeasurement("100g");
        expect(result.amount).toBe(100);
        expect(result.unit).toBe("g");
        expect(result.isWeight).toBe(true);
        expect(result.isVolume).toBe(false);
        expect(result.inputLabel).toBe("Weight (g)");
        expect(result.inputUnit).toBe("g");
    });

    it("parses weight with space (100 g)", () => {
        const result = parseMeasurement("100 g");
        expect(result.amount).toBe(100);
        expect(result.unit).toBe("g");
        expect(result.isWeight).toBe(true);
    });

    it("parses volume in ml (250ml)", () => {
        const result = parseMeasurement("250ml");
        expect(result.amount).toBe(250);
        expect(result.unit).toBe("ml");
        expect(result.isVolume).toBe(true);
        expect(result.isWeight).toBe(false);
        expect(result.inputLabel).toBe("Volume (ml)");
    });

    it("parses cup with description (1 cup cooked)", () => {
        const result = parseMeasurement("1 cup cooked");
        expect(result.amount).toBe(1);
        expect(result.unit).toBe("cup");
        expect(result.description).toBe("cooked");
        expect(result.isVolume).toBe(true);
        expect(result.inputLabel).toBe("Volume (cup)");
    });

    it("parses non-standard units (1 large)", () => {
        const result = parseMeasurement("1 large");
        expect(result.amount).toBe(1);
        expect(result.unit).toBe("large");
        expect(result.isWeight).toBe(false);
        expect(result.isVolume).toBe(false);
        expect(result.inputLabel).toBe("Amount (large)");
    });

    it("parses decimal amounts (1.5 tbsp)", () => {
        const result = parseMeasurement("1.5 tbsp");
        expect(result.amount).toBe(1.5);
        expect(result.unit).toBe("tbsp");
        expect(result.isVolume).toBe(true);
    });

    it("parses oz weight (4 oz)", () => {
        const result = parseMeasurement("4 oz");
        expect(result.amount).toBe(4);
        expect(result.unit).toBe("oz");
        expect(result.isWeight).toBe(true);
    });

    it("falls back to serving for unparseable input", () => {
        const result = parseMeasurement("per serving");
        expect(result.amount).toBe(1);
        expect(result.unit).toBe("serving");
        expect(result.inputLabel).toBe("Servings");
    });

    it("handles kg weight (1 kg)", () => {
        const result = parseMeasurement("1 kg");
        expect(result.amount).toBe(1);
        expect(result.unit).toBe("kg");
        expect(result.isWeight).toBe(true);
    });
});
