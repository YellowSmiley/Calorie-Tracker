import { test, expect, Page } from "@playwright/test";
import { login } from "./auth";
import {
  addFoodToMeal,
  createTestFood,
  resetFoodItems,
  resetSettings,
} from "./helpers";

const fillInputs = async (page: Page, values: Record<string, string>) => {
  for (const [testId, value] of Object.entries(values)) {
    await page.getByTestId(testId).fill(value);
  }
};

const expectInputValues = async (
  page: Page,
  values: Record<string, string>,
) => {
  for (const [testId, value] of Object.entries(values)) {
    await expect(page.getByTestId(testId)).toHaveValue(value);
  }
};

const expectSelectValues = async (
  page: Page,
  values: Record<string, string>,
) => {
  for (const [testId, value] of Object.entries(values)) {
    await expect(page.getByTestId(testId)).toHaveValue(value);
  }
};

const customGoalInputValues: Record<string, string> = {
  "nutritional-goals-calorie-goal-input": "2092",
  "nutritional-goals-protein-goal-input": "5.3",
  "nutritional-goals-carb-goal-input": "14.5",
  "nutritional-goals-fat-goal-input": "2.9",
  "nutritional-goals-saturates-goal-input": "0.7",
  "nutritional-goals-sugars-goal-input": "3.2",
  "nutritional-goals-fibre-goal-input": "1.1",
  "nutritional-goals-salt-goal-input": "0.2",
};

const setGoals = async (page: Page) => {
  // Set goals
  await expect(page.getByText("Nutritional Goals")).toBeVisible();
  // Needs to be selected thrice to trigger onChange
  await page.getByTestId("measurement-calorie-unit-select").selectOption("kJ");
  await page.getByTestId("measurement-calorie-unit-select").selectOption("kJ");
  await page.getByTestId("measurement-calorie-unit-select").selectOption("kJ");
  //
  await page.getByTestId("measurement-weight-unit-select").selectOption("oz");
  await page.getByTestId("measurement-volume-unit-select").selectOption("cup");
  // Check to see if changing calorie unit converts existing calorie goal value correctly
  await expect(
    page.getByTestId("nutritional-goals-calorie-goal-input"),
  ).toHaveValue("12552"); // 3000 kcal in kJ
  await expect(
    page.getByTestId("nutritional-goals-protein-goal-input"),
  ).toHaveValue("5.2911"); // 150g in oz
  await expect(
    page.getByTestId("nutritional-goals-carb-goal-input"),
  ).toHaveValue("14.46234"); // 410g in oz
  await expect(
    page.getByTestId("nutritional-goals-fat-goal-input"),
  ).toHaveValue("2.927742"); // 83g in oz
  await expect(
    page.getByTestId("nutritional-goals-saturates-goal-input"),
  ).toHaveValue("0.70548"); // 20g in oz
  await expect(
    page.getByTestId("nutritional-goals-sugars-goal-input"),
  ).toHaveValue("3.17466"); // 90g in oz
  await expect(
    page.getByTestId("nutritional-goals-fibre-goal-input"),
  ).toHaveValue("1.05822"); // 30g in oz
  await expect(
    page.getByTestId("nutritional-goals-salt-goal-input"),
  ).toHaveValue("0.211644"); // 6g in oz

  await fillInputs(page, customGoalInputValues);
  // Saving should not change values on response
  await page.getByTestId("settings-save-button").click();
  await expectInputValues(page, customGoalInputValues);
  await expectSelectValues(page, {
    "measurement-calorie-unit-select": "kJ",
    "measurement-weight-unit-select": "oz",
    "measurement-volume-unit-select": "cup",
  });
  // Refresh page to confirm values are saved and loaded correctly
  await page.reload();
  await expectInputValues(page, customGoalInputValues);
  await expectSelectValues(page, {
    "measurement-calorie-unit-select": "kJ",
    "measurement-weight-unit-select": "oz",
    "measurement-volume-unit-select": "cup",
  });
};

test.describe("Settings", () => {
  let foodName: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    await resetSettings(page);
    await resetFoodItems(page);
    // Create food with 100 kcal per 100g, serving 50g
    foodName = await createTestFood(page, {
      calories: 1000,
      measurementAmount: 1000,
      carbs: 1000,
      protein: 1000,
      fat: 100,
      saturates: 100,
      sugars: 100,
      fibre: 100,
      salt: 100,
    });
    await page.getByTestId("nav-diary").click();
    await expect(page.getByRole("heading", { name: "Diary" })).toBeVisible();
    // Add food to breakfast with serving size 50g and quantity 1
    await addFoodToMeal(page, "breakfast", foodName, "50", "1");
    // Assert food row is present in diary
    await expect(
      page.getByTestId(/diary-food-row-/).filter({ hasText: foodName }),
    ).toBeVisible();
    await page.getByTestId("nav-settings").click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("Nutritional Goals, Measurement Units, Data & Privacy and Actions", async ({
    page,
  }) => {
    await setGoals(page);
    // Diary should reflect new goals/units
    await page.getByTestId("nav-diary").click();
    await page.getByTestId("daily-summary-accordion-button").click();
    await expect(page.getByTestId("summary-goal-calories")).toContainText(
      `2092 kJ`,
    );
    await expect(page.getByTestId("summary-goal-protein")).toContainText(
      `5.3oz`,
    );
    await expect(page.getByTestId("summary-goal-carbs")).toContainText(
      `14.5oz`,
    );
    await expect(page.getByTestId("summary-goal-fat")).toContainText(`2.9oz`);
    await expect(page.getByTestId("summary-goal-saturates")).toContainText(
      `0.7oz`,
    );
    await expect(page.getByTestId("summary-goal-sugars")).toContainText(
      `3.2oz`,
    );
    await expect(page.getByTestId("summary-goal-fibre")).toContainText(`1.1oz`);
    await expect(page.getByTestId("summary-goal-salt")).toContainText(`0.2oz`);
    // Add Food and check it uses correct units
    await page.getByTestId("diary-add-food-button-breakfast").click();
    await page.getByTestId("food-search-input").fill(foodName);
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: foodName }),
    ).toContainText("35oz");
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: foodName }),
    ).toContainText("4184 kJ");
    await page
      .getByTestId(/food-item-/)
      .filter({ hasText: foodName })
      .click();
    // Check Add Good shows correct values/units
    await expect(page.getByTestId("add-food-base-nutrition-title")).toHaveText(
      "Base Nutrition (Per 35.27oz)",
    );
    await expect(page.getByTestId("add-food-base-calories")).toHaveText(
      `4184 kJ`,
    );
    await expect(page.getByTestId("add-food-base-protein")).toHaveText(
      "35.27oz",
    );
    await expect(page.getByTestId("add-food-base-carbs")).toHaveText("35.27oz");
    await expect(page.getByTestId("add-food-base-fat")).toHaveText("3.53oz");
    await expect(page.getByTestId("add-food-base-saturates")).toHaveText(
      "3.53oz",
    );
    // Change servings and check Nutrition for this entry (Serving size * quantity)
    await page.getByTestId("add-food-serving-size").fill("8.8"); // Quarter of 35.27oz
    await page.getByTestId("add-food-quantity").fill("2");
    await expect(page.getByTestId("add-food-nutrition-calories")).toHaveText(
      "2088 kJ",
    );
    await expect(page.getByTestId("add-food-nutrition-protein")).toHaveText(
      "17.6oz",
    );
    await expect(page.getByTestId("add-food-nutrition-carbs")).toHaveText(
      "17.6oz",
    );
    await expect(page.getByTestId("add-food-nutrition-fat")).toHaveText(
      "1.76oz",
    );
    await expect(page.getByTestId("add-food-nutrition-saturates")).toHaveText(
      "1.76oz",
    );
    await expect(page.getByTestId("add-food-nutrition-sugars")).toHaveText(
      "1.76oz",
    );
    await expect(page.getByTestId("add-food-nutrition-fibre")).toHaveText(
      "1.76oz",
    );
    await expect(page.getByTestId("add-food-nutrition-salt")).toHaveText(
      "1.76oz",
    );
    await page.getByTestId("add-food-back-button").click();
    await expect(
      page.getByRole("heading", { name: "Select Food" }),
    ).toBeVisible();
    await page.getByTestId("food-list-sidebar-back-button").click();
    await expect(page.getByTestId(/diary-food-serving-/)).toHaveText(
      "1.76oz (1 thing)",
    );
    await expect(page.getByTestId(/diary-food-calorie-info-/)).toHaveText(
      `209 kJ`,
    );
    // Click remove and check delete modal has correct units/values
    await page
      .getByTestId(/diary-food-row-/)
      .filter({ hasText: foodName })
      .getByTestId(/diary-food-remove-/)
      .click();
    await expect(page.getByTestId("delete-food-serving-size")).toHaveText(
      "35.27oz",
    );
    await expect(page.getByTestId("delete-food-calories")).toHaveText(`209 kJ`);
    await expect(page.getByTestId("delete-food-protein")).toHaveText("1.76oz");
    await expect(page.getByTestId("delete-food-carbs")).toHaveText("1.76oz");
    await expect(page.getByTestId("delete-food-fat")).toHaveText("0.18oz");
    await expect(page.getByTestId("delete-food-saturates")).toHaveText(
      "0.18oz",
    );
    await expect(page.getByTestId("delete-food-sugars")).toHaveText("0.18oz");
    await expect(page.getByTestId("delete-food-fibre")).toHaveText("0.18oz");
    await expect(page.getByTestId("delete-food-salt")).toHaveText("0.18oz");
    await page.getByTestId("delete-food-cancel").click();

    // Dashboard should reflect new goals/units
    await page.getByTestId("nav-dashboard").click();
    await expect(page.getByTestId("dashboard-total-calories")).toContainText(
      `209 kJ`,
    );
    await expect(page.getByTestId("dashboard-total-protein")).toContainText(
      "1.76oz",
    );
    await expect(page.getByTestId("dashboard-total-carbs")).toContainText(
      "1.76oz",
    );
    await expect(page.getByTestId("dashboard-total-fat")).toContainText(
      "0.18oz",
    );
    await expect(page.getByTestId("dashboard-total-saturates")).toContainText(
      "0.18oz",
    );
    await expect(page.getByTestId("dashboard-total-sugars")).toContainText(
      "0.18oz",
    );
    await expect(page.getByTestId("dashboard-total-fibre")).toContainText(
      "0.18oz",
    );
    await expect(page.getByTestId("dashboard-total-salt")).toContainText(
      "0.18oz",
    );
    await expect(page.getByTestId("goal-calories")).toContainText(`2092 kJ`);
    await expect(page.getByTestId("goal-protein")).toContainText(`5.3oz`);
    await expect(page.getByTestId("goal-carbs")).toContainText(`14.5oz`);
    await expect(page.getByTestId("goal-fat")).toContainText(`2.9oz`);
    await expect(page.getByTestId("goal-saturates")).toContainText(`0.7oz`);
    await expect(page.getByTestId("goal-sugars")).toContainText(`3.2oz`);
    await expect(page.getByTestId("goal-fibre")).toContainText(`1.1oz`);
    await expect(page.getByTestId("goal-salt")).toContainText(`0.2oz`);
    // Click week and check averages show correct values/units
    await page.getByRole("button", { name: "Week" }).click();
    await expect(page.getByTestId("avg-calories")).toHaveText("Avg: 30 kJ/day");
    await expect(page.getByTestId("avg-protein")).toHaveText("Avg: 0.25oz/day");
    await expect(page.getByTestId("avg-carbs")).toHaveText("Avg: 0.25oz/day");
    await expect(page.getByTestId("avg-fat")).toHaveText("Avg: 0.03oz/day");
    await expect(page.getByTestId("avg-saturates")).toHaveText(
      "Avg: 0.03oz/day",
    );
    await expect(page.getByTestId("avg-sugars")).toHaveText("Avg: 0.03oz/day");
    await expect(page.getByTestId("avg-fibre")).toHaveText("Avg: 0.03oz/day");
    await expect(page.getByTestId("avg-salt")).toHaveText("Avg: 0.03oz/day");

    // Add a volume-based food item and verify volume unit behaviour
    // Note the app is currently in a OZ/CUP configuration
    const volumeFoodName = await createTestFood(page, {
      measurementType: "volume",
      calories: 4184,
      measurementAmount: 4.22675284, // 1000ml in cups
      carbs: 35.273962,
      protein: 35.273962,
      fat: 3.5273962,
      saturates: 3.5273962,
      sugars: 3.5273962,
      fibre: 3.5273962,
      salt: 3.5273962,
    });

    await page.getByTestId("nav-diary").click();
    await page.getByTestId("diary-add-food-button-breakfast").click();
    await page.getByTestId("food-search-input").fill(volumeFoodName);
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: volumeFoodName }),
    ).toContainText("4 cup");
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: volumeFoodName }),
    ).toContainText("4184 kJ");
    await page
      .getByTestId(/food-item-/)
      .filter({ hasText: volumeFoodName })
      .click();
    await expect(page.getByTestId("add-food-base-nutrition-title")).toHaveText(
      "Base Nutrition (Per 4.23 cup)",
    );
    await page.getByTestId("add-food-serving-size").fill("2");
    await page.getByTestId("add-food-quantity").fill("1");
    await page.getByTestId("add-food-submit").click();

    const volumeRow = page
      .getByTestId(/diary-food-row-/)
      .filter({ hasText: volumeFoodName });
    await expect(volumeRow).toBeVisible();
    await expect(volumeRow.getByTestId(/diary-food-serving-/)).toContainText(
      "2 cup",
    );
    await expect(volumeRow.getByTestId(/diary-food-calorie-info-/)).toHaveText(
      "1980 kJ",
    );

    await volumeRow.getByTestId(/diary-food-remove-/).click();
    await expect(page.getByTestId("delete-food-serving-size")).toHaveText(
      "4.23 cup",
    );
    await expect(page.getByTestId("delete-food-calories")).toHaveText(
      "1980 kJ",
    );
    await page.getByTestId("delete-food-cancel").click();

    // Test export-data-button prompts to download file with correct name with today's date (YYYY-MM-DD) prefix with export-
    await page.getByTestId("nav-settings").click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("export-data-button").click(),
    ]);
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const fileName = download.suggestedFilename();
    const today = new Date().toISOString().split("T")[0];
    expect(fileName).toMatch(new RegExp(`^export-${today}.*\\.json$`));

    // Test clicking privacy-policy-link takes user to correct page
    await page.getByTestId("privacy-policy-link").click();
    await expect(
      page.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeVisible();
    await page.getByTestId("nav-settings").click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Test clicking terms-of-service-link takes user to correct page
    await page.getByTestId("terms-of-service-link").click();
    await expect(
      page.getByRole("heading", { name: "Terms of Service" }),
    ).toBeVisible();
    await page.getByTestId("nav-settings").click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // TODO: Check body weight unit changes and converts correctly and shows correctly on diary and dashboard

    // TODO: Add tests for user management and search suggestions

    // TODO: Check field error validations work

    // TODO: Check favourite meals search, list
    // Search create, edit, delete and add to diary and check units/values are correct throughout
  });
});
