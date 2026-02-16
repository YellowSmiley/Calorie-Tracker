import { test, expect } from "@playwright/test";

const testerEmail = process.env.E2E_TEST_EMAIL ?? "";
const testerPassword = process.env.E2E_TEST_PASSWORD ?? "";

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

test.describe("Dashboard View Period", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email").fill(testerEmail);
    await page.getByTestId("password").fill(testerPassword);
    await Promise.all([
      page.waitForURL("/"),
      page.getByTestId("sign-in-button").click(),
    ]);
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
  });

  test("View Period buttons change summary and reset state, and goals update", async ({
    page,
  }) => {
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

    // Helper to check avg visibility
    const expectAvgVisible = async (testid: string, visible: boolean) => {
      const el = page.getByTestId(testid);
      if (visible) {
        await expect(el).toBeVisible();
      } else {
        await expect(el).toHaveCSS("opacity", "0");
      }
    };

    // DAY
    await page.getByRole("button", { name: "Day" }).click();
    await page.waitForTimeout(500);
    expect(await getGoal("goal-calories")).toContain(`${goals.calories} kcal`);
    expect(await getGoal("goal-protein")).toContain(`${goals.protein}g`);
    expect(await getGoal("goal-carbs")).toContain(`${goals.carbs}g`);
    expect(await getGoal("goal-fat")).toContain(`${goals.fat}g`);
    expect(await getGoal("goal-saturates")).toContain(`${goals.saturates}g`);
    expect(await getGoal("goal-sugars")).toContain(`${goals.sugars}g`);
    expect(await getGoal("goal-fibre")).toContain(`${goals.fibre}g`);
    expect(await getGoal("goal-salt")).toContain(`${goals.salt}g`);
    await expectAvgVisible("avg-saturates", false);
    await expectAvgVisible("avg-sugars", false);
    await expectAvgVisible("avg-fibre", false);
    await expectAvgVisible("avg-salt", false);

    // WEEK
    await page.getByRole("button", { name: "Week" }).click();
    await page.waitForTimeout(500);
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
    await expectAvgVisible("avg-saturates", true);
    await expectAvgVisible("avg-sugars", true);
    await expectAvgVisible("avg-fibre", true);
    await expectAvgVisible("avg-salt", true);

    // MONTH (dynamically get days in month)
    await page.getByRole("button", { name: "Month" }).click();
    await page.waitForTimeout(500);
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
    await expectAvgVisible("avg-saturates", true);
    await expectAvgVisible("avg-sugars", true);
    await expectAvgVisible("avg-fibre", true);
    await expectAvgVisible("avg-salt", true);
  });
});
