import {
  buildMealNutritionData,
  buildMealsResponse,
  getDateRangeForDay,
  getMealDateForCreate,
  MealEntryWithFood,
} from "./mealService";

describe("mealService", () => {
  test("getDateRangeForDay returns full-day bounds", () => {
    const { start, end } = getDateRangeForDay("2026-04-22");

    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(3);
    expect(start.getDate()).toBe(22);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);

    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(3);
    expect(end.getDate()).toBe(22);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  test("getMealDateForCreate throws on invalid date", () => {
    expect(() => getMealDateForCreate("not-a-date")).toThrow("Invalid date");
  });

  test("buildMealNutritionData calculates rounded nutrition", () => {
    const nutrition = buildMealNutritionData(
      {
        name: "Food",
        measurementType: "weight",
        measurementAmount: 100,
        calories: 100,
        protein: 20,
        carbs: 30,
        fat: 10,
        saturates: 2,
        sugars: 4,
        fibre: 3,
        salt: 0.6,
        defaultServingAmount: null,
        defaultServingDescription: null,
      },
      1.5,
    );

    expect(nutrition).toEqual({
      calories: 150,
      protein: 30,
      carbs: 45,
      fat: 15,
      saturates: 3,
      sugars: 6,
      fibre: 4.5,
      salt: 0.9,
    });
  });

  test("buildMealsResponse groups entries by meal type", () => {
    const entries: MealEntryWithFood[] = [
      {
        id: "entry-1",
        mealType: "BREAKFAST",
        calories: 120,
        protein: 10,
        carbs: 12,
        fat: 4,
        saturates: 1,
        sugars: 2,
        fibre: 3,
        salt: 0.2,
        serving: 1,
        food: {
          name: "Oats",
          measurementType: "weight",
          measurementAmount: 100,
          calories: 120,
          protein: 10,
          carbs: 12,
          fat: 4,
          saturates: 1,
          sugars: 2,
          fibre: 3,
          salt: 0.2,
          defaultServingAmount: null,
          defaultServingDescription: null,
        },
      },
    ];

    const meals = buildMealsResponse(entries);
    const breakfast = meals.find((meal) => meal.name === "Breakfast");

    expect(breakfast?.items).toHaveLength(1);
    expect(breakfast?.items[0].name).toBe("Oats");
  });
});
