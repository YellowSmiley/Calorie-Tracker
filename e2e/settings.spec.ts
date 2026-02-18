import { test, expect } from "@playwright/test";
import { login } from "./tester-login.spec";
import { resetFoodItems, createTestFood, addFoodToMeal } from "./diary.spec";

test.describe("Settings", () => {
  let foodName: string;

  test.beforeEach(async ({ page }) => {
    await login(page);
    await resetFoodItems(page);
    // Create food with 100 kcal per 100g, serving 50g
    foodName = await createTestFood(page, {
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
    await page.getByTestId("nav-settings").click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("Nutritional Goals, Measurement Units, Data & Privacy and Actions", async ({
    page,
  }) => {
    // Set goals
    await expect(page.getByText("Nutritional Goals")).toBeVisible();
    await page.getByTestId("nutritional-goals-calorie-goal-input").fill("2500");
    await page.getByTestId("nutritional-goals-protein-goal-input").fill("100");
    await page.getByTestId("nutritional-goals-carb-goal-input").fill("300");
    await page.getByTestId("nutritional-goals-fat-goal-input").fill("70");
    await page.getByTestId("nutritional-goals-saturates-goal-input").fill("10");
    await page.getByTestId("nutritional-goals-sugars-goal-input").fill("50");
    await page.getByTestId("nutritional-goals-fibre-goal-input").fill("20");
    await page.getByTestId("nutritional-goals-salt-goal-input").fill("5");
    await page
      .getByTestId("measurement-calorie-unit-select")
      .selectOption("kJ");
    await page.getByTestId("measurement-weight-unit-select").selectOption("oz");
    await page
      .getByTestId("measurement-volume-unit-select")
      .selectOption("cups");
    // Saving should not change values on response
    await page.getByTestId("settings-save-button").click();
    await expect(
      page.getByTestId("nutritional-goals-calorie-goal-input"),
    ).toHaveValue("2500");
    await expect(
      page.getByTestId("nutritional-goals-protein-goal-input"),
    ).toHaveValue("100");
    await expect(
      page.getByTestId("nutritional-goals-carb-goal-input"),
    ).toHaveValue("300");
    await expect(
      page.getByTestId("nutritional-goals-fat-goal-input"),
    ).toHaveValue("70");
    await expect(
      page.getByTestId("nutritional-goals-saturates-goal-input"),
    ).toHaveValue("10");
    await expect(
      page.getByTestId("nutritional-goals-sugars-goal-input"),
    ).toHaveValue("50");
    await expect(
      page.getByTestId("nutritional-goals-fibre-goal-input"),
    ).toHaveValue("20");
    await expect(
      page.getByTestId("nutritional-goals-salt-goal-input"),
    ).toHaveValue("5");
    await expect(
      page.getByTestId("measurement-calorie-unit-select"),
    ).toHaveValue("kJ");
    await expect(
      page.getByTestId("measurement-weight-unit-select"),
    ).toHaveValue("oz");
    await expect(
      page.getByTestId("measurement-volume-unit-select"),
    ).toHaveValue("cups");
    // Refresh page to confirm values are saved and loaded correctly
    await page.reload();
    await expect(
      page.getByTestId("nutritional-goals-calorie-goal-input"),
    ).toHaveValue("2500");
    await expect(
      page.getByTestId("nutritional-goals-protein-goal-input"),
    ).toHaveValue("100");
    await expect(
      page.getByTestId("nutritional-goals-carb-goal-input"),
    ).toHaveValue("300");
    await expect(
      page.getByTestId("nutritional-goals-fat-goal-input"),
    ).toHaveValue("70");
    await expect(
      page.getByTestId("nutritional-goals-saturates-goal-input"),
    ).toHaveValue("10");
    await expect(
      page.getByTestId("nutritional-goals-sugars-goal-input"),
    ).toHaveValue("50");
    await expect(
      page.getByTestId("nutritional-goals-fibre-goal-input"),
    ).toHaveValue("20");
    await expect(
      page.getByTestId("nutritional-goals-salt-goal-input"),
    ).toHaveValue("5");
    await expect(
      page.getByTestId("measurement-calorie-unit-select"),
    ).toHaveValue("kJ");
    await expect(
      page.getByTestId("measurement-weight-unit-select"),
    ).toHaveValue("oz");
    await expect(
      page.getByTestId("measurement-volume-unit-select"),
    ).toHaveValue("cups");

    // Diary should reflect new goals/units
    await page.getByTestId("nav-diary").click();
    await page.getByTestId("daily-summary-accordion-button").click();
    await expect(page.getByTestId("summary-goal-calories")).toContainText(
      "2500kJ",
    );
    await expect(page.getByTestId("summary-goal-protein")).toContainText(
      "100oz",
    );
    await expect(page.getByTestId("summary-goal-carbs")).toContainText("300oz");
    await expect(page.getByTestId("summary-goal-fat")).toContainText("70oz");
    await expect(page.getByTestId("summary-goal-saturates")).toContainText(
      "10oz",
    );
    await expect(page.getByTestId("summary-goal-sugars")).toContainText("50oz");
    await expect(page.getByTestId("summary-goal-fibre")).toContainText("20oz");
    await expect(page.getByTestId("summary-goal-salt")).toContainText("5oz");
    // Add Food and check it uses correct units
    await page.getByTestId("diary-add-food-button-breakfast").click();
    await page.getByTestId("food-search-input").fill(foodName);
    // food-item-${food.id}-serving-info has text "50g • 50kcal" but should now be "50oz • 141kcal" (since 50g is 1.76oz and 100kcal/100g is 141kcal/100oz)
    await expect(
      page.getByTestId(/food-item-/).filter({ hasText: foodName }),
    ).toHaveText(`${foodName} 50oz 141kcal`);
    await page
      .getByTestId(/food-item-/)
      .filter({ hasText: foodName })
      .click();
    // Check Add Good shows correct values/units
    await expect(page.getByTestId("add-food-base-nutrition-title")).toHaveText(
      "Base Nutrition (Per 3.53oz)",
    );
    await expect(page.getByTestId("add-food-calorie-info")).toHaveText(
      "418.4kJ",
    );
    await expect(page.getByTestId("add-food-protein-info")).toHaveText(
      "0.35oz",
    );
    await expect(page.getByTestId("add-food-carb-info")).toHaveText("0.35oz");
    await expect(page.getByTestId("add-food-fat-info")).toHaveText("0.18oz");
    await expect(page.getByTestId("add-food-saturates-info")).toHaveText(
      "0.05oz",
    );
    // Change servings and check Nutrition for this entry (Serving size * quantity)
    await page.getByTestId("add-food-serving-size").fill("7.07"); // 7.07oz is 200g
    await page.getByTestId("add-food-quantity").fill("2");
    await expect(page.getByTestId("add-food-nutrition-calories")).toHaveText(
      "836.8kJ",
    );
    await expect(page.getByTestId("add-food-nutrition-protein")).toHaveText(
      "0.7oz",
    );
    await expect(page.getByTestId("add-food-nutrition-carbs")).toHaveText(
      "0.7oz",
    );
    await expect(page.getByTestId("add-food-nutrition-fat")).toHaveText(
      "0.35oz",
    );
    await expect(page.getByTestId("add-food-nutrition-saturates")).toHaveText(
      "0.1oz",
    );
    await expect(page.getByTestId("add-food-nutrition-sugars")).toHaveText(
      "0.7oz",
    );
    await expect(page.getByTestId("add-food-nutrition-fibre")).toHaveText(
      "0oz",
    );
    await expect(page.getByTestId("add-food-nutrition-salt")).toHaveText("0oz");
    await page.getByTestId("add-food-submit").click();
    await expect(page.getByTestId(/diary-food-serving-/)).toHaveText("141oz");
    await expect(page.getByTestId(/diary-food-calorie-info-/)).toHaveText(
      "836.8kJ",
    );
    // Click remove and check delete modal has correct units/values
    await page
      .getByTestId(/diary-food-remove-/)
      .filter({ hasText: foodName })
      .click();
    await expect(page.getByTestId("delete-food-calories")).toHaveText(
      "836.8kJ",
    );
    await expect(page.getByTestId("delete-food-protein")).toHaveText("0.7oz");
    await expect(page.getByTestId("delete-food-carbs")).toHaveText("0.7oz");
    await expect(page.getByTestId("delete-food-fat")).toHaveText("0.35oz");
    await expect(page.getByTestId("delete-food-saturates")).toHaveText("0.1oz");
    await expect(page.getByTestId("delete-food-sugars")).toHaveText("0.7oz");
    await expect(page.getByTestId("delete-food-fibre")).toHaveText("0oz");
    await expect(page.getByTestId("delete-food-salt")).toHaveText("0oz");
    await page.getByTestId("delete-food-cancel").click();

    // Dashboard should reflect new goals/units
    await page.getByTestId("nav-dashboard").click();
    await expect(page.getByTestId("dashboard-total-calories")).toContainText(
      "836.8kJ",
    );
    await expect(page.getByTestId("dashboard-total-protein")).toContainText(
      "0.7oz",
    );
    await expect(page.getByTestId("dashboard-total-carbs")).toContainText(
      "0.7oz",
    );
    await expect(page.getByTestId("dashboard-total-fat")).toContainText(
      "0.35oz",
    );
    await expect(page.getByTestId("dashboard-total-saturates")).toContainText(
      "0.1oz",
    );
    await expect(page.getByTestId("dashboard-total-sugars")).toContainText(
      "0.7oz",
    );
    await expect(page.getByTestId("dashboard-total-fibre")).toContainText(
      "0oz",
    );
    await expect(page.getByTestId("dashboard-total-salt")).toContainText("0oz");
    await expect(page.getByTestId("goal-calories")).toContainText("2500kJ");
    await expect(page.getByTestId("goal-protein")).toContainText("100oz");
    await expect(page.getByTestId("goal-carbs")).toContainText("300oz");
    await expect(page.getByTestId("goal-fat")).toContainText("70oz");
    await expect(page.getByTestId("goal-saturates")).toContainText("10oz");
    await expect(page.getByTestId("goal-sugars")).toContainText("50oz");
    await expect(page.getByTestId("goal-fibre")).toContainText("20oz");
    await expect(page.getByTestId("goal-salt")).toContainText("5oz");
    // Click week and check averages show correct values/units
    await page.getByRole("button", { name: "Week" }).click();
    await expect(page.getByTestId("avg-calories")).toHaveText("836.8kJ");
    await expect(page.getByTestId("avg-protein")).toHaveText("0.7oz");
    await expect(page.getByTestId("avg-carbs")).toHaveText("0.7oz");
    await expect(page.getByTestId("avg-fat")).toHaveText("0.35oz");
    await expect(page.getByTestId("avg-saturates")).toHaveText("0.1oz");
    await expect(page.getByTestId("avg-sugars")).toHaveText("0.7oz");
    await expect(page.getByTestId("avg-fibre")).toHaveText("0oz");
    await expect(page.getByTestId("avg-salt")).toHaveText("0oz");

    // Go back to settings and reset the values back to default
    await page.getByTestId("nav-settings").click();
    await page.getByTestId("nutritional-goals-calorie-goal-input").fill("2000");
    await page.getByTestId("nutritional-goals-protein-goal-input").fill("50");
    await page.getByTestId("nutritional-goals-carb-goal-input").fill("275");
    await page.getByTestId("nutritional-goals-fat-goal-input").fill("70");
    await page.getByTestId("nutritional-goals-saturates-goal-input").fill("20");
    await page.getByTestId("nutritional-goals-sugars-goal-input").fill("90");
    await page.getByTestId("nutritional-goals-fibre-goal-input").fill("30");
    await page.getByTestId("nutritional-goals-salt-goal-input").fill("6");
    await page
      .getByTestId("measurement-calorie-unit-select")
      .selectOption("kcal");
    await page.getByTestId("measurement-weight-unit-select").selectOption("g");
    await page.getByTestId("measurement-volume-unit-select").selectOption("ml");
    await page.getByTestId("settings-save-button").click();
  });
});
