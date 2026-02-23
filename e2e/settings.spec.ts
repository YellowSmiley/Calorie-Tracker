import { test, expect, Page } from "@playwright/test";
import { login } from "./tester-login.spec";
import { resetFoodItems, createTestFood, addFoodToMeal } from "./diary.spec";
import {
  DEFAULT_CALORIE_GOAL,
  DEFAULT_CALORIE_UNIT,
  DEFAULT_CARB_GOAL,
  DEFAULT_FAT_GOAL,
  DEFAULT_FIBRE_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_SALT_GOAL,
  DEFAULT_SATURATES_GOAL,
  DEFAULT_SUGARS_GOAL,
  DEFAULT_VOLUME_UNIT,
  DEFAULT_WEIGHT_UNIT,
} from "@/lib/consts";

const resetSettings = async (page: Page) => {
  // Go back to settings and reset the values back to default
  await page.getByTestId("nav-settings").click();
  await page
    .getByTestId("measurement-calorie-unit-select")
    .selectOption(DEFAULT_CALORIE_UNIT);
  await page
    .getByTestId("measurement-weight-unit-select")
    .selectOption(DEFAULT_WEIGHT_UNIT);
  // TODO: Test Volume Unit too
  await page
    .getByTestId("measurement-volume-unit-select")
    .selectOption(DEFAULT_VOLUME_UNIT);
  await page
    .getByTestId("nutritional-goals-calorie-goal-input")
    .fill(DEFAULT_CALORIE_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-protein-goal-input")
    .fill(DEFAULT_PROTEIN_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-carb-goal-input")
    .fill(DEFAULT_CARB_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-fat-goal-input")
    .fill(DEFAULT_FAT_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-saturates-goal-input")
    .fill(DEFAULT_SATURATES_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-sugars-goal-input")
    .fill(DEFAULT_SUGARS_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-fibre-goal-input")
    .fill(DEFAULT_FIBRE_GOAL.toString());
  await page
    .getByTestId("nutritional-goals-salt-goal-input")
    .fill(DEFAULT_SALT_GOAL.toString());
  await page.getByTestId("settings-save-button").click();
};

test.describe("Settings", () => {
  let foodName: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    await resetSettings(page);
    await resetFoodItems(page);
    // Create food with 100 kcal per 100g, serving 50g
    foodName = await createTestFood(page, {
      calories: "1000",
      measurementAmount: "1000",
      servingAmount: "500",
      carbs: "1000",
      protein: "1000",
      fat: "100",
      saturates: "100",
      sugars: "100",
      fibre: "100",
      salt: "100",
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
    // Set goals
    await expect(page.getByText("Nutritional Goals")).toBeVisible();
    // Needs to be selected thrice to trigger onChange
    await page
      .getByTestId("measurement-calorie-unit-select")
      .selectOption("kJ");
    await page
      .getByTestId("measurement-calorie-unit-select")
      .selectOption("kJ");
    await page
      .getByTestId("measurement-calorie-unit-select")
      .selectOption("kJ");
    //
    await page.getByTestId("measurement-weight-unit-select").selectOption("oz");
    await page
      .getByTestId("measurement-volume-unit-select")
      .selectOption("cup");
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
    // Change values
    const kjValue = "10460"; // 2500 kcal in kJ
    const proteinValue = "5.3"; // 150g in oz
    const carbValue = "14.5"; // 410g in oz
    const fatValue = "2.9"; // 83g in oz
    const saturatesValue = "0.7"; // 20g in oz
    const sugarsValue = "3.2"; // 90g in oz
    const fibreValue = "1.1"; // 30g in oz
    const saltValue = "0.2"; // 5g in oz

    await page
      .getByTestId("nutritional-goals-calorie-goal-input")
      .fill(kjValue);
    await page
      .getByTestId("nutritional-goals-protein-goal-input")
      .fill(proteinValue);
    await page.getByTestId("nutritional-goals-carb-goal-input").fill(carbValue);
    await page.getByTestId("nutritional-goals-fat-goal-input").fill(fatValue);
    await page
      .getByTestId("nutritional-goals-saturates-goal-input")
      .fill(saturatesValue);
    await page
      .getByTestId("nutritional-goals-sugars-goal-input")
      .fill(sugarsValue);
    await page
      .getByTestId("nutritional-goals-fibre-goal-input")
      .fill(fibreValue);
    await page.getByTestId("nutritional-goals-salt-goal-input").fill(saltValue);
    // Saving should not change values on response
    await page.getByTestId("settings-save-button").click();
    await expect(
      page.getByTestId("nutritional-goals-calorie-goal-input"),
    ).toHaveValue(kjValue);
    await expect(
      page.getByTestId("nutritional-goals-protein-goal-input"),
    ).toHaveValue(proteinValue);
    await expect(
      page.getByTestId("nutritional-goals-carb-goal-input"),
    ).toHaveValue(carbValue);
    await expect(
      page.getByTestId("nutritional-goals-fat-goal-input"),
    ).toHaveValue(fatValue);
    await expect(
      page.getByTestId("nutritional-goals-saturates-goal-input"),
    ).toHaveValue(saturatesValue);
    await expect(
      page.getByTestId("nutritional-goals-sugars-goal-input"),
    ).toHaveValue(sugarsValue);
    await expect(
      page.getByTestId("nutritional-goals-fibre-goal-input"),
    ).toHaveValue(fibreValue);
    await expect(
      page.getByTestId("nutritional-goals-salt-goal-input"),
    ).toHaveValue(saltValue);
    await expect(
      page.getByTestId("measurement-calorie-unit-select"),
    ).toHaveValue("kJ");
    await expect(
      page.getByTestId("measurement-weight-unit-select"),
    ).toHaveValue("oz");
    await expect(
      page.getByTestId("measurement-volume-unit-select"),
    ).toHaveValue("cup");
    // Refresh page to confirm values are saved and loaded correctly
    await page.reload();
    await expect(
      page.getByTestId("nutritional-goals-calorie-goal-input"),
    ).toHaveValue(kjValue);
    await expect(
      page.getByTestId("nutritional-goals-protein-goal-input"),
    ).toHaveValue(proteinValue);
    await expect(
      page.getByTestId("nutritional-goals-carb-goal-input"),
    ).toHaveValue(carbValue);
    await expect(
      page.getByTestId("nutritional-goals-fat-goal-input"),
    ).toHaveValue(fatValue);
    await expect(
      page.getByTestId("nutritional-goals-saturates-goal-input"),
    ).toHaveValue(saturatesValue);
    await expect(
      page.getByTestId("nutritional-goals-sugars-goal-input"),
    ).toHaveValue(sugarsValue);
    await expect(
      page.getByTestId("nutritional-goals-fibre-goal-input"),
    ).toHaveValue(fibreValue);
    await expect(
      page.getByTestId("nutritional-goals-salt-goal-input"),
    ).toHaveValue(saltValue);
    await expect(
      page.getByTestId("measurement-calorie-unit-select"),
    ).toHaveValue("kJ");
    await expect(
      page.getByTestId("measurement-weight-unit-select"),
    ).toHaveValue("oz");
    await expect(
      page.getByTestId("measurement-volume-unit-select"),
    ).toHaveValue("cup");

    // Diary should reflect new goals/units
    await page.getByTestId("nav-diary").click();
    await page.getByTestId("daily-summary-accordion-button").click();
    await expect(page.getByTestId("summary-goal-calories")).toContainText(
      `${kjValue} kJ`,
    );
    await expect(page.getByTestId("summary-goal-protein")).toContainText(
      `${proteinValue}oz`,
    );
    await expect(page.getByTestId("summary-goal-carbs")).toContainText(
      `${carbValue}oz`,
    );
    await expect(page.getByTestId("summary-goal-fat")).toContainText(
      `${fatValue}oz`,
    );
    await expect(page.getByTestId("summary-goal-saturates")).toContainText(
      `${saturatesValue}oz`,
    );
    await expect(page.getByTestId("summary-goal-sugars")).toContainText(
      `${sugarsValue}oz`,
    );
    await expect(page.getByTestId("summary-goal-fibre")).toContainText(
      `${fibreValue}oz`,
    );
    await expect(page.getByTestId("summary-goal-salt")).toContainText(
      `${saltValue}oz`,
    );
    // Add Food and check it uses correct units
    await page.getByTestId("diary-add-food-button-breakfast").click();
    await page.getByTestId("food-search-input").fill(foodName);
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: foodName }),
    ).toContainText(`500oz`);
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: foodName }),
    ).toContainText(`2092 kJ`);
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
      "35.3oz",
    );
    await expect(page.getByTestId("add-food-base-carbs")).toHaveText("35.3oz");
    await expect(page.getByTestId("add-food-base-fat")).toHaveText("3.5oz");
    await expect(page.getByTestId("add-food-base-saturates")).toHaveText(
      "3.5oz",
    );
    // Change servings and check Nutrition for this entry (Serving size * quantity)
    await page.getByTestId("add-food-serving-size").fill("8.8"); // Quarter of 35.27oz
    await page.getByTestId("add-food-quantity").fill("2");
    await expect(page.getByTestId("add-food-nutrition-calories")).toHaveText(
      "2092 kJ",
    );
    await expect(page.getByTestId("add-food-nutrition-protein")).toHaveText(
      "17.65oz",
    );
    await expect(page.getByTestId("add-food-nutrition-carbs")).toHaveText(
      "17.65oz",
    );
    await expect(page.getByTestId("add-food-nutrition-fat")).toHaveText(
      "1.75oz",
    );
    await expect(page.getByTestId("add-food-nutrition-saturates")).toHaveText(
      "1.75oz",
    );
    await expect(page.getByTestId("add-food-nutrition-sugars")).toHaveText(
      "1.75oz",
    );
    await expect(page.getByTestId("add-food-nutrition-fibre")).toHaveText(
      "1.75oz",
    );
    await expect(page.getByTestId("add-food-nutrition-salt")).toHaveText(
      "1.75oz",
    );
    await page.getByTestId("add-food-submit").click();
    await expect(page.getByTestId(/diary-food-serving-/)).toHaveText(`3.53oz`);
    await expect(page.getByTestId(/diary-food-calorie-info-/)).toHaveText(
      `${kjValue} kJ`,
    );
    // Click remove and check delete modal has correct units/values
    await page
      .getByTestId(/diary-food-remove-/)
      .filter({ hasText: foodName })
      .click();
    await expect(page.getByTestId("delete-food-calories")).toHaveText(
      `${kjValue} kJ`,
    );
    await expect(page.getByTestId("delete-food-protein")).toHaveText(
      `${proteinValue}oz`,
    );
    await expect(page.getByTestId("delete-food-carbs")).toHaveText(
      `${carbValue}oz`,
    );
    await expect(page.getByTestId("delete-food-fat")).toHaveText(
      `${fatValue}oz`,
    );
    await expect(page.getByTestId("delete-food-saturates")).toHaveText(
      `${saturatesValue}oz`,
    );
    await expect(page.getByTestId("delete-food-sugars")).toHaveText(
      `${sugarsValue}oz`,
    );
    await expect(page.getByTestId("delete-food-fibre")).toHaveText(
      `${fibreValue}oz`,
    );
    await expect(page.getByTestId("delete-food-salt")).toHaveText(
      `${saltValue}oz`,
    );
    await page.getByTestId("delete-food-cancel").click();

    // Dashboard should reflect new goals/units
    await page.getByTestId("nav-dashboard").click();
    await expect(page.getByTestId("dashboard-total-calories")).toContainText(
      `${kjValue} kJ`,
    );
    await expect(page.getByTestId("dashboard-total-protein")).toContainText(
      `${proteinValue}oz`,
    );
    await expect(page.getByTestId("dashboard-total-carbs")).toContainText(
      `${carbValue}oz`,
    );
    await expect(page.getByTestId("dashboard-total-fat")).toContainText(
      `${fatValue}oz`,
    );
    await expect(page.getByTestId("dashboard-total-saturates")).toContainText(
      `${saturatesValue}oz`,
    );
    await expect(page.getByTestId("dashboard-total-sugars")).toContainText(
      `${sugarsValue}oz`,
    );
    await expect(page.getByTestId("dashboard-total-fibre")).toContainText(
      `${fibreValue}oz`,
    );
    await expect(page.getByTestId("dashboard-total-salt")).toContainText(
      `${saltValue}oz`,
    );
    await expect(page.getByTestId("goal-calories")).toContainText(
      `${kjValue} kJ`,
    );
    await expect(page.getByTestId("goal-protein")).toContainText(
      `${proteinValue}oz`,
    );
    await expect(page.getByTestId("goal-carbs")).toContainText(
      `${carbValue}oz`,
    );
    await expect(page.getByTestId("goal-fat")).toContainText(`${fatValue}oz`);
    await expect(page.getByTestId("goal-saturates")).toContainText(
      `${saturatesValue}oz`,
    );
    await expect(page.getByTestId("goal-sugars")).toContainText(
      `${sugarsValue}oz`,
    );
    await expect(page.getByTestId("goal-fibre")).toContainText(
      `${fibreValue}oz`,
    );
    await expect(page.getByTestId("goal-salt")).toContainText(`${saltValue}oz`);
    // Click week and check averages show correct values/units
    await page.getByRole("button", { name: "Week" }).click();
    await expect(page.getByTestId("avg-calories")).toHaveText(`${kjValue}kJ`);
    await expect(page.getByTestId("avg-protein")).toHaveText(
      `${proteinValue}oz`,
    );
    await expect(page.getByTestId("avg-carbs")).toHaveText(`${carbValue}oz`);
    await expect(page.getByTestId("avg-fat")).toHaveText(`${fatValue}oz`);
    await expect(page.getByTestId("avg-saturates")).toHaveText(
      `${saturatesValue}oz`,
    );
    await expect(page.getByTestId("avg-sugars")).toHaveText(`${sugarsValue}oz`);
    await expect(page.getByTestId("avg-fibre")).toHaveText(`${fibreValue}oz`);
    await expect(page.getByTestId("avg-salt")).toHaveText(`${saltValue}oz`);
  });
});
