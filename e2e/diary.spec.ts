import { test, expect } from "@playwright/test";

function randomFoodName() {
  return "TestFood-" + Math.random().toString(36).substring(2, 10);
}

const testerEmail = process.env.E2E_TEST_EMAIL ?? "";
const testerPassword = process.env.E2E_TEST_PASSWORD ?? "";

test.describe("Diary Feature", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("email").fill(testerEmail);
    await page.getByTestId("password").fill(testerPassword);
    await Promise.all([
      page.waitForURL("/"),
      page.getByTestId("sign-in-button").click(),
    ]);
    await page.getByTestId("cookie-banner-button").click();
    await page.getByTestId("nav-diary").click();
    await expect(page.getByRole("heading", { name: "Diary" })).toBeVisible();
  });

  test("Add, edit, and remove food in Diary with error handling", async ({
    page,
  }) => {
    // Go to Diary page
    await page.goto("/diary");
    await expect(page.getByRole("heading", { name: /diary/i })).toBeVisible();

    // Add food to breakfast
    await page.getByTestId("diary-add-food-breakfast").click();
    await page.getByTestId("create-food-button").click();

    // Consts
    const measurementAmount = "100";
    const calories = "100";
    const protein = "10";
    const carbs = "20";
    const fat = "5";
    const saturates = "2";
    const sugars = "3";
    const fibre = "1";
    const salt = "0.5";
    const servingDescription = "1 thing";
    const servingAmount = "50";

    // Fill out food form
    const foodName = randomFoodName();
    await page.getByTestId("create-food-name").fill(foodName);
    await page
      .getByTestId("create-food-measurement-amount")
      .fill(measurementAmount);
    await page.getByTestId("create-food-calories").fill(calories);
    await page.getByTestId("create-food-protein").fill(protein);
    await page.getByTestId("create-food-carbs").fill(carbs);
    await page.getByTestId("create-food-fat").fill(fat);
    await page.getByTestId("create-food-saturates").fill(saturates);
    await page.getByTestId("create-food-sugars").fill(sugars);
    await page.getByTestId("create-food-fibre").fill(fibre);
    await page.getByTestId("create-food-salt").fill(salt);
    await page
      .getByTestId("create-food-serving-description")
      .fill(servingDescription);
    await page.getByTestId("create-food-serving-amount").fill(servingAmount);
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
      calories,
    );
    await expect(modal.getByTestId("delete-food-protein")).toContainText(
      protein,
    );
    await expect(modal.getByTestId("delete-food-carbs")).toContainText(carbs);
    await expect(modal.getByTestId("delete-food-fat")).toContainText(fat);
    await expect(modal.getByTestId("delete-food-saturates")).toContainText(
      saturates,
    );
    await expect(modal.getByTestId("delete-food-sugars")).toContainText(sugars);
    await expect(modal.getByTestId("delete-food-fibre")).toContainText(fibre);
    await expect(modal.getByTestId("delete-food-salt")).toContainText(salt);
    // Cancel first
    await modal.getByTestId("delete-food-cancel").click();
    await expect(modal).not.toBeVisible();
    // Remove for real
    await foodRow.getByTestId(/diary-food-remove-/).click();
    await modal.getByTestId("delete-food-confirm").click();
    await expect(foodRow).not.toBeVisible();
  });
});
