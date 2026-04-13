import { test, expect, Page } from "@playwright/test";
// Automatically save a screenshot if an expect fails
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Save screenshot to test output directory
    await page.screenshot({
      path: `test-results/${testInfo.title.replace(/[^a-zA-Z0-9-_]/g, "_")}.png`,
      fullPage: true,
    });
  }
});
import { login } from "./auth";
import { resetSettings } from "./helpers";
import { FoodItem } from "@/app/diary/types";

function randomFoodName() {
  return "TestFood-" + Math.random().toString(36).substring(2, 10);
}

// Check for current food items in breakfast (if any) and remove them to start with a clean slate
export const resetFoodItems = async (page: Page) => {
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("my-foods-button").click();
  // wait for data-testid="food-search-input"
  await expect(page.getByTestId("food-table-search-input")).toBeVisible();
  // Loop while there are foods to delete
  while (!(await page.getByTestId("no-foods-found").isVisible())) {
    // Get all delete-food-button- and click them
    const deleteButtons = page.getByTestId(/delete-food-button-/);
    const count = await deleteButtons.count();
    for (let i = 0; i < count; i++) {
      await page
        .getByTestId(/delete-food-button-/)
        .first()
        .click();
      if (await page.getByTestId("food-table-error").isVisible()) {
        // delete-food-cancel if error and continue loop to try again (sometimes fails due to db constraints)
        await page.getByTestId("delete-food-cancel").click();
        continue;
      }
      // wait for delete-food-confirm to be visible and click it
      await page.getByTestId("delete-food-confirm").click();
      if (await page.getByTestId("food-table-error").isVisible()) {
        // delete-food-cancel if error and continue loop to try again (sometimes fails due to db constraints)
        await page.getByTestId("delete-food-cancel").click();
      }
      await expect(page.getByTestId("loading-foods")).not.toBeVisible();
      // wait for delete-food-confirm to not be visible
      await expect(page.getByTestId("delete-food-confirm")).not.toBeVisible();
      // wait 1 second before next delete to avoid overwhelming the server
    }
  }
  await page.getByTestId("my-foods-back-button").click();
};

const fillFoodForm = async (page: Page, overrides?: Partial<FoodItem>) => {
  const foodName = randomFoodName();
  await page.getByTestId("create-food-name").fill(overrides?.name || foodName);
  await expect(page.getByTestId("create-food-name")).toHaveValue(
    overrides?.name || foodName,
  );
  await page
    .getByTestId("create-food-measurement-type")
    .selectOption(overrides?.measurementType || "weight");
  await page
    .getByTestId("create-food-measurement-amount")
    .fill(`${overrides?.measurementAmount || "100"}`);
  await expect(page.getByTestId("create-food-measurement-amount")).toHaveValue(
    `${overrides?.measurementAmount || "100"}`,
  );
  await page
    .getByTestId("create-food-calories")
    .fill(`${overrides?.calories || "100"}`);
  await expect(page.getByTestId("create-food-calories")).toHaveValue(
    `${overrides?.calories || "100"}`,
  );
  await page
    .getByTestId("create-food-protein")
    .fill(`${overrides?.protein || "10"}`);
  await expect(page.getByTestId("create-food-protein")).toHaveValue(
    `${overrides?.protein || "10"}`,
  );
  await page
    .getByTestId("create-food-carbs")
    .fill(`${overrides?.carbs || "20"}`);
  await expect(page.getByTestId("create-food-carbs")).toHaveValue(
    `${overrides?.carbs || "20"}`,
  );
  await page.getByTestId("create-food-fat").fill(`${overrides?.fat || "5"}`);
  await expect(page.getByTestId("create-food-fat")).toHaveValue(
    `${overrides?.fat || "5"}`,
  );
  await page
    .getByTestId("create-food-saturates")
    .fill(`${overrides?.saturates || "2"}`);
  await expect(page.getByTestId("create-food-saturates")).toHaveValue(
    `${overrides?.saturates || "2"}`,
  );
  await page
    .getByTestId("create-food-sugars")
    .fill(`${overrides?.sugars || "3"}`);
  await expect(page.getByTestId("create-food-sugars")).toHaveValue(
    `${overrides?.sugars || "3"}`,
  );
  await page
    .getByTestId("create-food-fibre")
    .fill(`${overrides?.fibre || "1"}`);
  await expect(page.getByTestId("create-food-fibre")).toHaveValue(
    `${overrides?.fibre || "1"}`,
  );
  await page
    .getByTestId("create-food-salt")
    .fill(`${overrides?.salt || "0.5"}`);
  await expect(page.getByTestId("create-food-salt")).toHaveValue(
    `${overrides?.salt || "0.5"}`,
  );
  await page
    .getByTestId("create-food-serving-description")
    .fill(`${overrides?.defaultServingDescription || "1 thing"}`);
  await expect(page.getByTestId("create-food-serving-description")).toHaveValue(
    `${overrides?.defaultServingDescription || "1 thing"}`,
  );
  await page
    .getByTestId("create-food-serving-amount")
    .fill(`${overrides?.defaultServingAmount || "50"}`);
  await expect(page.getByTestId("create-food-serving-amount")).toHaveValue(
    `${overrides?.defaultServingAmount || "50"}`,
  );
  return foodName;
};

export async function createTestFood(
  page: Page,
  overrides?: Partial<FoodItem>,
) {
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("my-foods-button").click();
  await page.getByTestId("create-food-button").click();
  const foodName = await fillFoodForm(page, overrides);
  await page.getByTestId("create-food-submit").click();
  await page.getByTestId("my-foods-back-button").click();
  return foodName;
}

export async function addFoodToMeal(
  page: Page,
  mealTestId: "breakfast" | "lunch" | "dinner" | "snacks",
  foodName: string,
  servingSize?: string,
  quantity?: string,
) {
  await page.getByTestId(`diary-add-food-button-${mealTestId}`).click();
  await page.getByTestId("food-search-input").fill(foodName);
  await expect(page.getByTestId("food-search-input")).toHaveValue(foodName);
  await page
    .getByTestId(/food-item-/)
    .filter({ hasText: foodName })
    .click();
  if (servingSize) {
    await page.getByTestId("edit-food-serving-size").fill(servingSize);
    await expect(page.getByTestId("edit-food-serving-size")).toHaveValue(
      servingSize,
    );
  }
  if (quantity) {
    await page.getByTestId("edit-food-quantity").fill(quantity);
    await expect(page.getByTestId("edit-food-quantity")).toHaveValue(quantity);
  }
  await page.getByTestId("add-food-submit").click();
}

test.describe("Diary Feature", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await resetSettings(page);
    await resetFoodItems(page);
    // Continue with tests
    await page.getByTestId("nav-diary").click();
    await expect(page.getByRole("heading", { name: "Diary" })).toBeVisible();
  });

  test("Add, edit, and remove food in Diary with error handling", async ({
    page,
  }) => {
    // Add food to breakfast
    await page.getByTestId("diary-add-food-button-breakfast").click();
    await page.getByTestId("create-food-button").click();

    // Consts
    const measurementAmount = 100;
    const calories = 100;
    const protein = 10;
    const carbs = 20;
    const fat = 5;
    const saturates = 2;
    const sugars = 3;
    const fibre = 1;
    const salt = 0.5;
    const servingDescription = "1 thing";
    const servingAmount = "50";

    const foodName = await fillFoodForm(page, {
      measurementAmount,
      calories,
      protein,
      carbs,
      fat,
      saturates,
      sugars,
      fibre,
      salt,
    });
    await page.getByTestId("create-food-submit").click();

    // Food should be added to table
    const foodRow = page
      .getByTestId(/diary-food-row-/)
      .filter({ hasText: foodName });
    await expect(foodRow).toBeVisible();
    await expect(foodRow.getByTestId(/diary-food-name-/)).toContainText(
      `${servingAmount}g (${servingDescription})`,
    );
    await expect(foodRow.getByTestId(/diary-food-calories-/)).toContainText(
      servingAmount,
    );

    // Edit the food row
    await foodRow.click();
    await page.getByTestId("edit-food-serving-size").fill("100");
    await page.getByTestId("edit-food-quantity").fill("0.5");
    // Check Base Nutrition and Nutrition for this entry
    await expect(page.getByTestId("edit-food-base-calories")).toContainText(
      `${calories}`,
    );
    await expect(page.getByTestId("edit-food-base-protein")).toContainText(
      `${protein}`,
    );
    await expect(page.getByTestId("edit-food-base-carbs")).toContainText(
      `${carbs}`,
    );
    await expect(page.getByTestId("edit-food-base-fat")).toContainText(
      `${fat}`,
    );
    await expect(page.getByTestId("edit-food-base-saturates")).toContainText(
      `${saturates}`,
    );
    await expect(page.getByTestId("edit-food-base-sugars")).toContainText(
      `${sugars}`,
    );
    await expect(page.getByTestId("edit-food-base-fibre")).toContainText(
      `${fibre}`,
    );
    await expect(page.getByTestId("edit-food-base-salt")).toContainText(
      `${salt}`,
    );
    await expect(
      page.getByTestId("edit-food-nutrition-calories"),
    ).toContainText("50");
    await expect(page.getByTestId("edit-food-nutrition-protein")).toContainText(
      "5",
    );
    await expect(page.getByTestId("edit-food-nutrition-carbs")).toContainText(
      "10",
    );
    await expect(page.getByTestId("edit-food-nutrition-fat")).toContainText(
      "2.5",
    );
    await expect(
      page.getByTestId("edit-food-nutrition-saturates"),
    ).toContainText("1");
    await expect(page.getByTestId("edit-food-nutrition-sugars")).toContainText(
      "1.5",
    );
    await expect(page.getByTestId("edit-food-nutrition-fibre")).toContainText(
      "0.5",
    );
    await expect(page.getByTestId("edit-food-nutrition-salt")).toContainText(
      "0.25",
    );

    // Check coming down in serving from above base
    await page.getByTestId("edit-food-serving-size").fill("200");
    await page.getByTestId("edit-food-quantity").fill("0.5");
    await page.getByTestId("edit-food-submit").click();
    await expect(foodRow.getByTestId(/diary-food-name-/)).toContainText(
      "100g (2 × 1 thing)",
    );
    await expect(foodRow.getByTestId(/diary-food-calories-/)).toContainText(
      "100",
    );

    // Remove the food row
    await foodRow.getByTestId(/diary-food-remove-/).click();
    const modal = page.getByTestId("delete-food-modal");
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/remove food item/i)).toBeVisible();
    await expect(
      modal.getByText(
        /are you sure you want to remove this item from BREAKFAST/i,
      ),
    ).toBeVisible();
    await expect(modal.getByTestId("delete-food-calories")).toContainText(
      `${calories}`,
    );
    await expect(modal.getByTestId("delete-food-protein")).toContainText(
      `${protein}`,
    );
    await expect(modal.getByTestId("delete-food-carbs")).toContainText(
      `${carbs}`,
    );
    await expect(modal.getByTestId("delete-food-fat")).toContainText(`${fat}`);
    await expect(modal.getByTestId("delete-food-saturates")).toContainText(
      `${saturates}`,
    );
    await expect(modal.getByTestId("delete-food-sugars")).toContainText(
      `${sugars}`,
    );
    await expect(modal.getByTestId("delete-food-fibre")).toContainText(
      `${fibre}`,
    );
    await expect(modal.getByTestId("delete-food-salt")).toContainText(
      `${salt}`,
    );
    // Cancel first
    await modal.getByTestId("delete-food-cancel").click();
    await expect(modal).not.toBeVisible();

    // Test daily summary updates after adding food item
    await page.getByTestId("daily-summary-accordion-button").click();

    await expect(page.getByTestId("summary-total-calories")).toContainText(
      `${calories}`,
    );
    await expect(page.getByTestId("summary-total-protein")).toContainText(
      `${protein}`,
    );
    await expect(page.getByTestId("summary-total-carbs")).toContainText(
      `${carbs}`,
    );
    await expect(page.getByTestId("summary-total-fat")).toContainText(`${fat}`);
    await expect(page.getByTestId("summary-total-saturates")).toContainText(
      `${saturates}`,
    );
    await expect(page.getByTestId("summary-total-sugars")).toContainText(
      `${sugars}`,
    );
    await expect(page.getByTestId("summary-total-fibre")).toContainText(
      `${fibre}`,
    );
    await expect(page.getByTestId("summary-total-salt")).toContainText(
      `${salt}`,
    );

    await expect(page.getByTestId("summary-goal-calories")).toContainText(
      "3000 kcal",
    );
    await expect(page.getByTestId("summary-goal-protein")).toContainText(
      "150g",
    );
    await expect(page.getByTestId("summary-goal-carbs")).toContainText("410g");
    await expect(page.getByTestId("summary-goal-fat")).toContainText("83g");
    await expect(page.getByTestId("summary-goal-saturates")).toContainText(
      "20g",
    );
    await expect(page.getByTestId("summary-goal-sugars")).toContainText("90g");
    await expect(page.getByTestId("summary-goal-fibre")).toContainText("30g");
    await expect(page.getByTestId("summary-goal-salt")).toContainText("6g");

    await expect(page.getByTestId("summary-left-calories")).toContainText(
      "2900 kcal",
    );
    await expect(page.getByTestId("summary-left-protein")).toContainText(
      "140g",
    );
    await expect(page.getByTestId("summary-left-carbs")).toContainText("390g");
    await expect(page.getByTestId("summary-left-fat")).toContainText("78g");
    await expect(page.getByTestId("summary-left-saturates")).toContainText(
      "18g",
    );
    await expect(page.getByTestId("summary-left-sugars")).toContainText("87g");
    await expect(page.getByTestId("summary-left-fibre")).toContainText("29g");
    await expect(page.getByTestId("summary-left-salt")).toContainText("5.5g");

    await expect(
      page.getByTestId("meal-summary-breakfast-accordion-button"),
    ).toContainText("Breakfast Summary");
    await page.getByTestId("meal-summary-breakfast-accordion-button").click();
    await expect(
      page.getByTestId("meal-summary-breakfast-total-calories"),
    ).toContainText(`${calories}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-protein"),
    ).toContainText(`${protein}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-carbs"),
    ).toContainText(`${carbs}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-fat"),
    ).toContainText(`${fat}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-saturates"),
    ).toContainText(`${saturates}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-sugars"),
    ).toContainText(`${sugars}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-fibre"),
    ).toContainText(`${fibre}`);
    await expect(
      page.getByTestId("meal-summary-breakfast-total-salt"),
    ).toContainText(`${salt}`);
    await page.getByTestId("meal-summary-breakfast-accordion-button").click();

    await page.getByTestId("daily-summary-accordion-button").click();

    // Change date and check summary updates
    await page.getByTestId("previous-day-button").click();
    await page.getByTestId("daily-summary-accordion-button").click();
    await expect(page.getByTestId("summary-total-calories")).toContainText("0");
    await expect(page.getByTestId("summary-total-protein")).toContainText("0");
    await expect(page.getByTestId("summary-total-carbs")).toContainText("0");
    await expect(page.getByTestId("summary-total-fat")).toContainText("0");
    await expect(page.getByTestId("summary-total-saturates")).toContainText(
      "0",
    );
    await expect(page.getByTestId("summary-total-sugars")).toContainText("0");
    await expect(page.getByTestId("summary-total-fibre")).toContainText("0");
    await expect(page.getByTestId("summary-total-salt")).toContainText("0");
    await expect(page.getByTestId("summary-left-calories")).toContainText(
      "3000 kcal",
    );
    await expect(page.getByTestId("summary-left-protein")).toContainText(
      "150g",
    );
    await expect(page.getByTestId("summary-left-carbs")).toContainText("410g");
    await expect(page.getByTestId("summary-left-fat")).toContainText("83g");
    await expect(page.getByTestId("summary-left-saturates")).toContainText(
      "20g",
    );
    await expect(page.getByTestId("summary-left-sugars")).toContainText("90g");
    await expect(page.getByTestId("summary-left-fibre")).toContainText("30g");
    await expect(page.getByTestId("summary-left-salt")).toContainText("6g");

    await page.getByTestId("next-day-button").click();

    // Test add food search
    await page.getByTestId("diary-add-food-button-breakfast").click();
    await page.getByTestId("food-list-search-input").fill(foodName);
    await expect(page.getByTestId(/food-item-/)).toContainText(foodName);
    await page.getByTestId("food-list-search-input").fill("nonexistentfood");
    await expect(page.getByTestId("no-foods-found")).toBeVisible();
    await page.getByTestId("food-list-sidebar-back-button").click();

    // Remove for real
    await foodRow.getByTestId(/diary-food-remove-/).click();
    await modal.getByTestId("delete-food-confirm").click();
    await expect(foodRow).not.toBeVisible();

    // TODO: Test body weight across multiple days

    // TODO: Add test for search suggestions on select food and my food
    // Should order by most used

    // TODO: Check field error validations work

    // TODO: Try create a dupe food item and see if it shows the duplicate warning

    // TODO: Add test for save favorite meal, apply favorite and clear meal
    // Save meal modal should show correct totals and convert correctly with different settings
    // Apply meal should search correctly, apply correctly and show correct totals
  });
});
