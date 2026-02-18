import { test, expect } from "@playwright/test";
import { addFoodToMeal, createTestFood, resetFoodItems } from "./diary.spec";
import { login } from "./tester-login.spec";

const goals = {
  calories: 3000,
  protein: 150,
  carbs: 410,
  fat: 83,
  saturates: 20,
  sugars: 90,
  fibre: 30,
  salt: 6,
};

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await resetFoodItems(page);
    // Create food with 100 kcal per 100g, serving 50g
    const foodName = await createTestFood(page, {
      calories: "100",
      measurementAmount: "100",
      servingAmount: "50",
    });
    await page.getByTestId("nav-diary").click();
    await expect(page.getByRole("heading", { name: "Diary" })).toBeVisible();
    // Add food to breakfast with serving size 50g and quantity 1
    await addFoodToMeal(page, "breakfast", foodName, "50", "1");
    // Assert food row is present in diary
    await expect(
      page.getByTestId(/diary-food-row-/).filter({ hasText: foodName }),
    ).toBeVisible();
    await page.getByTestId("nav-dashboard").click();
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("Test all the dashboard functionality", async ({ page }) => {
    await expect(page.getByText("Nutrition Summary")).toBeVisible();

    // Helper to get goal text by data-testid
    const getGoal = async (testid: string) =>
      (await page.getByTestId(testid).textContent())?.trim();

    // Helper to get the currently selected date from the date input
    const getSelectedDate = async () => {
      return await page.locator('input[type="date"]').inputValue();
    };

    // Helper to get number of days in the selected month
    const getDaysInMonth = async () => {
      const dateStr = await getSelectedDate();
      const date = new Date(dateStr);
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    // DAY
    await page.getByRole("button", { name: "Day" }).click();
    expect(
      await page.getByTestId("dashboard-total-calories").textContent(),
    ).toContain("50 kcal");
    expect(
      await page.getByTestId("dashboard-total-protein").textContent(),
    ).toContain("5g");
    expect(
      await page.getByTestId("dashboard-total-carbs").textContent(),
    ).toContain("10g");
    expect(
      await page.getByTestId("dashboard-total-fat").textContent(),
    ).toContain("2.5g");
    expect(
      await page.getByTestId("dashboard-total-saturates").textContent(),
    ).toContain("1g");
    expect(
      await page.getByTestId("dashboard-total-sugars").textContent(),
    ).toContain("1.5g");
    expect(
      await page.getByTestId("dashboard-total-fibre").textContent(),
    ).toContain("0.5g");
    expect(
      await page.getByTestId("dashboard-total-salt").textContent(),
    ).toContain("0.25g");

    expect(await getGoal("goal-calories")).toContain(`${goals.calories} kcal`);
    expect(await getGoal("goal-protein")).toContain(`${goals.protein}g`);
    expect(await getGoal("goal-carbs")).toContain(`${goals.carbs}g`);
    expect(await getGoal("goal-fat")).toContain(`${goals.fat}g`);
    expect(await getGoal("goal-saturates")).toContain(`${goals.saturates}g`);
    expect(await getGoal("goal-sugars")).toContain(`${goals.sugars}g`);
    expect(await getGoal("goal-fibre")).toContain(`${goals.fibre}g`);
    expect(await getGoal("goal-salt")).toContain(`${goals.salt}g`);

    await expect(page.getByTestId("avg-calories")).not.toBeVisible();
    await expect(page.getByTestId("avg-protein")).not.toBeVisible();
    await expect(page.getByTestId("avg-carbs")).not.toBeVisible();
    await expect(page.getByTestId("avg-fat")).not.toBeVisible();
    await expect(page.getByTestId("avg-saturates")).not.toBeVisible();
    await expect(page.getByTestId("avg-sugars")).not.toBeVisible();
    await expect(page.getByTestId("avg-fibre")).not.toBeVisible();
    await expect(page.getByTestId("avg-salt")).not.toBeVisible();

    // WEEK
    await page.getByRole("button", { name: "Week" }).click();
    expect(await getGoal("goal-calories")).toContain(
      `${goals.calories * 7} kcal`,
    );
    expect(await getGoal("goal-protein")).toContain(`${goals.protein * 7}g`);
    expect(await getGoal("goal-carbs")).toContain(`${goals.carbs * 7}g`);
    expect(await getGoal("goal-fat")).toContain(`${goals.fat * 7}g`);
    expect(await getGoal("goal-saturates")).toContain(
      `${goals.saturates * 7}g`,
    );
    expect(await getGoal("goal-sugars")).toContain(`${goals.sugars * 7}g`);
    expect(await getGoal("goal-fibre")).toContain(`${goals.fibre * 7}g`);
    expect(await getGoal("goal-salt")).toContain(`${goals.salt * 7}g`);

    const round1dp = (val: number) => Math.round(val * 10) / 10;
    const round2dp = (val: number) => Math.round(val * 100) / 100;
    const weekCalories = `Avg: ${Math.round(50 / 7)} kcal/day`;
    expect(await page.getByTestId("avg-calories").textContent()).toContain(
      weekCalories,
    );
    const avgProtein = `Avg: ${round1dp(5 / 7)}g/day`;
    expect(await page.getByTestId("avg-protein").textContent()).toContain(
      avgProtein,
    );
    expect(await page.getByTestId("avg-carbs").textContent()).toContain(
      `Avg: ${round1dp(10 / 7)}g/day`,
    );
    expect(await page.getByTestId("avg-fat").textContent()).toContain(
      `Avg: ${round1dp(2.5 / 7)}g/day`,
    );
    expect(await page.getByTestId("avg-saturates").textContent()).toContain(
      `Avg: ${round1dp(1 / 7)}g/day`,
    );
    expect(await page.getByTestId("avg-sugars").textContent()).toContain(
      `Avg: ${round1dp(1.5 / 7)}g/day`,
    );
    expect(await page.getByTestId("avg-fibre").textContent()).toContain(
      `Avg: ${round1dp(0.5 / 7)}g/day`,
    );
    expect(await page.getByTestId("avg-salt").textContent()).toContain(
      `Avg: ${round2dp(0.25 / 7)}g/day`,
    );

    // MONTH (dynamically get days in month)
    await page.getByRole("button", { name: "Month" }).click();
    const daysInMonth = await getDaysInMonth();

    expect(await getGoal("goal-calories")).toContain(
      `${goals.calories * daysInMonth} kcal`,
    );
    expect(await getGoal("goal-protein")).toContain(
      `${goals.protein * daysInMonth}g`,
    );
    expect(await getGoal("goal-carbs")).toContain(
      `${goals.carbs * daysInMonth}g`,
    );
    expect(await getGoal("goal-fat")).toContain(`${goals.fat * daysInMonth}g`);
    expect(await getGoal("goal-saturates")).toContain(
      `${goals.saturates * daysInMonth}g`,
    );
    expect(await getGoal("goal-sugars")).toContain(
      `${goals.sugars * daysInMonth}g`,
    );
    expect(await getGoal("goal-fibre")).toContain(
      `${goals.fibre * daysInMonth}g`,
    );
    expect(await getGoal("goal-salt")).toContain(
      `${goals.salt * daysInMonth}g`,
    );
    const monthCalories = `Avg: ${Math.round(50 / (await getDaysInMonth()))} kcal/day`;
    expect(await page.getByTestId("avg-calories").textContent()).toContain(
      monthCalories,
    );
    expect(await page.getByTestId("avg-protein").textContent()).toContain(
      `Avg: ${round1dp(5 / (await getDaysInMonth()))}g/day`,
    );
    expect(await page.getByTestId("avg-carbs").textContent()).toContain(
      `Avg: ${round1dp(10 / (await getDaysInMonth()))}g/day`,
    );
    expect(await page.getByTestId("avg-fat").textContent()).toContain(
      `Avg: ${round1dp(2.5 / (await getDaysInMonth()))}g/day`,
    );
    expect(await page.getByTestId("avg-saturates").textContent()).toContain(
      `Avg: ${round1dp(1 / (await getDaysInMonth()))}g/day`,
    );
    expect(await page.getByTestId("avg-sugars").textContent()).toContain(
      `Avg: ${round1dp(1.5 / (await getDaysInMonth()))}g/day`,
    );
    expect(await page.getByTestId("avg-fibre").textContent()).toContain(
      `Avg: ${round1dp(0.5 / (await getDaysInMonth()))}g/day`,
    );
    expect(await page.getByTestId("avg-salt").textContent()).toContain(
      `Avg: ${round2dp(0.25 / (await getDaysInMonth()))}g/day`,
    );

    await resetFoodItems(page);
  });
});
