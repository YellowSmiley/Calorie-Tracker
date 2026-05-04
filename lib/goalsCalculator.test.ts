import {
  calculateMicronutrientLimitsFromCalories,
  calculateGoalRecommendations,
  calculateGoalRecommendationsFromCalories,
  CustomCalorieGoalCalculatorInput,
  getGoalCalculatorValidationError,
  getCustomCalorieGoalValidationError,
  GoalCalculatorInput,
} from "./goalsCalculator";

const validInput: GoalCalculatorInput = {
  age: 30,
  heightCm: 175,
  weightKg: 80,
  sex: "male",
  goal: "maintain",
  activity: "moderate",
  weightChangePace: "normal",
};

describe("getGoalCalculatorValidationError", () => {
  it("returns null for valid input", () => {
    expect(getGoalCalculatorValidationError(validInput)).toBeNull();
  });

  it("rejects out-of-range age", () => {
    expect(getGoalCalculatorValidationError({ ...validInput, age: 10 })).toBe(
      "Enter an age between 13 and 100.",
    );
  });

  it("rejects out-of-range height", () => {
    expect(
      getGoalCalculatorValidationError({ ...validInput, heightCm: 100 }),
    ).toBe("Enter a height between 120 and 240 cm.");
  });

  it("rejects out-of-range weight", () => {
    expect(
      getGoalCalculatorValidationError({ ...validInput, weightKg: 20 }),
    ).toBe("Enter a weight between 30 and 300 kg.");
  });
});

describe("calculateGoalRecommendations", () => {
  it("returns null for invalid input", () => {
    expect(calculateGoalRecommendations({ ...validInput, age: 9 })).toBeNull();
  });

  it("calculates recommendations for valid input", () => {
    const result = calculateGoalRecommendations(validInput);

    expect(result).not.toBeNull();
    expect(result?.calorieTargetKcal).toBeGreaterThan(1200);
    expect(result?.proteinGrams).toBeGreaterThan(0);
    expect(result?.carbGrams).toBeGreaterThan(0);
    expect(result?.fatGrams).toBeGreaterThan(0);
  });

  it("sets lower calories for lose vs gain for same person", () => {
    const lose = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "normal",
    });
    const gain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "normal",
    });

    expect(lose).not.toBeNull();
    expect(gain).not.toBeNull();
    expect(
      (lose?.calorieTargetKcal ?? 0) < (gain?.calorieTargetKcal ?? 0),
    ).toBe(true);
  });

  it("sets higher protein for muscle goal than maintain", () => {
    const maintain = calculateGoalRecommendations({
      ...validInput,
      goal: "maintain",
    });
    const muscle = calculateGoalRecommendations({
      ...validInput,
      goal: "muscle",
    });

    expect(maintain).not.toBeNull();
    expect(muscle).not.toBeNull();
    expect((muscle?.proteinGrams ?? 0) > (maintain?.proteinGrams ?? 0)).toBe(
      true,
    );
  });

  it("uses different calorie adjustments for mild and normal weight loss", () => {
    const mildLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "mild",
    });
    const normalLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "normal",
    });

    expect(mildLoss).not.toBeNull();
    expect(normalLoss).not.toBeNull();
    expect(
      (normalLoss?.calorieTargetKcal ?? 0) < (mildLoss?.calorieTargetKcal ?? 0),
    ).toBe(true);
  });

  it("uses a larger calorie adjustment for extreme vs normal weight loss", () => {
    const extremeLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "extreme",
    });
    const normalLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "normal",
    });

    expect(extremeLoss).not.toBeNull();
    expect(normalLoss).not.toBeNull();
    expect(
      (extremeLoss?.calorieTargetKcal ?? 0) <
        (normalLoss?.calorieTargetKcal ?? 0),
    ).toBe(true);
  });

  it("places high weight loss pace between normal and extreme", () => {
    const normalLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "normal",
    });
    const highLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "high",
    });
    const extremeLoss = calculateGoalRecommendations({
      ...validInput,
      goal: "lose",
      weightChangePace: "extreme",
    });

    expect(normalLoss).not.toBeNull();
    expect(highLoss).not.toBeNull();
    expect(extremeLoss).not.toBeNull();

    expect((highLoss?.calorieTargetKcal ?? 0)).toBeLessThan(
      normalLoss?.calorieTargetKcal ?? 0,
    );
    expect((highLoss?.calorieTargetKcal ?? 0)).toBeGreaterThan(
      extremeLoss?.calorieTargetKcal ?? 0,
    );
  });

  it("uses different calorie adjustments for mild and normal weight gain", () => {
    const mildGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "mild",
    });
    const normalGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "normal",
    });

    expect(mildGain).not.toBeNull();
    expect(normalGain).not.toBeNull();
    expect(
      (normalGain?.calorieTargetKcal ?? 0) > (mildGain?.calorieTargetKcal ?? 0),
    ).toBe(true);
  });

  it("uses a larger calorie adjustment for extreme vs normal weight gain", () => {
    const extremeGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "extreme",
    });
    const normalGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "normal",
    });

    expect(extremeGain).not.toBeNull();
    expect(normalGain).not.toBeNull();
    expect(
      (extremeGain?.calorieTargetKcal ?? 0) >
        (normalGain?.calorieTargetKcal ?? 0),
    ).toBe(true);
  });

  it("places high weight gain pace between normal and extreme", () => {
    const normalGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "normal",
    });
    const highGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "high",
    });
    const extremeGain = calculateGoalRecommendations({
      ...validInput,
      goal: "gain",
      weightChangePace: "extreme",
    });

    expect(normalGain).not.toBeNull();
    expect(highGain).not.toBeNull();
    expect(extremeGain).not.toBeNull();

    expect((highGain?.calorieTargetKcal ?? 0)).toBeGreaterThan(
      normalGain?.calorieTargetKcal ?? 0,
    );
    expect((highGain?.calorieTargetKcal ?? 0)).toBeLessThan(
      extremeGain?.calorieTargetKcal ?? 0,
    );
  });

  it("returns different results for realistic user profiles", () => {
    const heavyYoungManLoseWeight: GoalCalculatorInput = {
      age: 24,
      heightCm: 188,
      weightKg: 120,
      sex: "male",
      goal: "lose",
      activity: "moderate",
      weightChangePace: "normal",
    };

    const olderWomanGainMuscle: GoalCalculatorInput = {
      age: 64,
      heightCm: 162,
      weightKg: 68,
      sex: "female",
      goal: "muscle",
      activity: "light",
      weightChangePace: "normal",
    };

    const middleAgedManGainMuscle: GoalCalculatorInput = {
      age: 46,
      heightCm: 179,
      weightKg: 86,
      sex: "male",
      goal: "muscle",
      activity: "moderate",
      weightChangePace: "normal",
    };

    const heavyYoungResult = calculateGoalRecommendations(
      heavyYoungManLoseWeight,
    );
    const olderWomanResult = calculateGoalRecommendations(olderWomanGainMuscle);
    const middleAgedManResult = calculateGoalRecommendations(
      middleAgedManGainMuscle,
    );

    expect(heavyYoungResult).not.toBeNull();
    expect(olderWomanResult).not.toBeNull();
    expect(middleAgedManResult).not.toBeNull();

    const results = [
      heavyYoungResult!,
      olderWomanResult!,
      middleAgedManResult!,
    ];

    expect(new Set(results.map((r) => r.calorieTargetKcal)).size).toBe(3);
    expect(new Set(results.map((r) => r.proteinGrams)).size).toBe(3);
    expect(new Set(results.map((r) => r.carbGrams)).size).toBe(3);
    expect(new Set(results.map((r) => r.fatGrams)).size).toBe(3);
  });
});

describe("calculateMicronutrientLimitsFromCalories", () => {
  it("returns guideline-based limits for a typical calorie target", () => {
    const limits = calculateMicronutrientLimitsFromCalories(2000);

    expect(limits.saturatesGrams).toBeCloseTo(22.2, 1);
    expect(limits.sugarsGrams).toBe(50);
    expect(limits.fibreGrams).toBe(28);
    expect(limits.saltGrams).toBe(6);
  });

  it("scales saturates, sugars, and fibre with calories", () => {
    const low = calculateMicronutrientLimitsFromCalories(1600);
    const high = calculateMicronutrientLimitsFromCalories(2800);

    expect(high.saturatesGrams).toBeGreaterThan(low.saturatesGrams);
    expect(high.sugarsGrams).toBeGreaterThan(low.sugarsGrams);
    expect(high.fibreGrams).toBeGreaterThan(low.fibreGrams);
    expect(high.saltGrams).toBe(low.saltGrams);
  });

  it("handles non-positive calories safely", () => {
    const limits = calculateMicronutrientLimitsFromCalories(-100);

    expect(limits.saturatesGrams).toBe(0);
    expect(limits.sugarsGrams).toBe(0);
    expect(limits.fibreGrams).toBe(0);
    expect(limits.saltGrams).toBe(6);
  });
});

describe("custom calorie goal calculation", () => {
  const validCustomInput: CustomCalorieGoalCalculatorInput = {
    calorieTargetKcal: 2200,
    weightKg: 80,
    goal: "maintain",
  };

  it("validates custom calorie input", () => {
    expect(getCustomCalorieGoalValidationError(validCustomInput)).toBeNull();
    expect(
      getCustomCalorieGoalValidationError({
        ...validCustomInput,
        calorieTargetKcal: 900,
      }),
    ).toBe("Enter calories between 1200 and 10000 kcal.");
  });

  it("returns null for invalid custom calorie input", () => {
    const result = calculateGoalRecommendationsFromCalories({
      ...validCustomInput,
      weightKg: 20,
    });

    expect(result).toBeNull();
  });

  it("calculates recommendations from a custom calorie target", () => {
    const result = calculateGoalRecommendationsFromCalories(validCustomInput);

    expect(result).not.toBeNull();
    expect(result?.calorieTargetKcal).toBe(2200);
    expect(result?.proteinGrams).toBeGreaterThan(0);
    expect(result?.carbGrams).toBeGreaterThan(0);
    expect(result?.fatGrams).toBeGreaterThan(0);
  });
});
