import { expect, Page } from "@playwright/test";
import { FoodItem } from "@/app/diary/types";
import {
  DEFAULT_BODY_WEIGHT_UNIT,
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

function randomFoodName() {
  return "TestFood-" + Math.random().toString(36).substring(2, 10);
}

export const resetFoodItems = async (page: Page) => {
  await page.getByTestId("nav-settings").click();
  await page.getByTestId("my-foods-button").click();
  await expect(page.getByTestId("food-search-input")).toBeVisible();

  while (!(await page.getByTestId("no-foods-found").isVisible())) {
    const deleteButtons = page.getByTestId(/delete-food-button-/);
    const count = await deleteButtons.count();

    for (let i = 0; i < count; i += 1) {
      await page
        .getByTestId(/delete-food-button-/)
        .first()
        .click();

      if (await page.getByTestId("food-table-error").isVisible()) {
        await page.getByTestId("delete-food-cancel").click();
        continue;
      }

      await page.getByTestId("delete-food-confirm").click();

      if (await page.getByTestId("food-table-error").isVisible()) {
        await page.getByTestId("delete-food-cancel").click();
      }

      await expect(page.getByTestId("loading-foods")).not.toBeVisible();
      await expect(page.getByTestId("delete-food-confirm")).not.toBeVisible();
    }
  }

  await page.getByTestId("my-foods-back-button").click();
};

const fillFoodForm = async (page: Page, overrides?: Partial<FoodItem>) => {
  const foodName = randomFoodName();
  await page.getByTestId("create-food-name").fill(overrides?.name || foodName);
  await page
    .getByTestId("create-food-measurement-type")
    .selectOption(overrides?.measurementType || "weight");
  await page
    .getByTestId("create-food-measurement-amount")
    .fill(`${overrides?.measurementAmount || "100"}`);
  await page
    .getByTestId("create-food-calories")
    .fill(`${overrides?.calories || "100"}`);
  await page
    .getByTestId("create-food-protein")
    .fill(`${overrides?.protein || "10"}`);
  await page
    .getByTestId("create-food-carbs")
    .fill(`${overrides?.carbs || "20"}`);
  await page.getByTestId("create-food-fat").fill(`${overrides?.fat || "5"}`);
  await page
    .getByTestId("create-food-saturates")
    .fill(`${overrides?.saturates || "2"}`);
  await page
    .getByTestId("create-food-sugars")
    .fill(`${overrides?.sugars || "3"}`);
  await page
    .getByTestId("create-food-fibre")
    .fill(`${overrides?.fibre || "1"}`);
  await page
    .getByTestId("create-food-salt")
    .fill(`${overrides?.salt || "0.5"}`);
  await page
    .getByTestId("create-food-serving-description")
    .fill(`${overrides?.defaultServingDescription || "1 thing"}`);
  await page
    .getByTestId("create-food-serving-amount")
    .fill(`${overrides?.defaultServingAmount || "50"}`);
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
  await page
    .getByTestId(/food-item-/)
    .filter({ hasText: foodName })
    .click();

  if (servingSize) {
    await page.getByTestId("edit-food-serving-size").fill(servingSize);
  }

  if (quantity) {
    await page.getByTestId("edit-food-quantity").fill(quantity);
  }

  await page.getByTestId("add-food-submit").click();
}

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

const selectOptions = async (page: Page, values: Record<string, string>) => {
  for (const [testId, value] of Object.entries(values)) {
    await page.getByTestId(testId).selectOption(value);
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

export const resetSettings = async (page: Page) => {
  await page.getByTestId("nav-settings").click();

  await selectOptions(page, {
    "measurement-calorie-unit-select": DEFAULT_CALORIE_UNIT,
    "measurement-weight-unit-select": DEFAULT_WEIGHT_UNIT,
    "measurement-body-weight-unit-select": DEFAULT_BODY_WEIGHT_UNIT,
    "measurement-volume-unit-select": DEFAULT_VOLUME_UNIT,
  });

  await expectSelectValues(page, {
    "measurement-calorie-unit-select": DEFAULT_CALORIE_UNIT,
    "measurement-weight-unit-select": DEFAULT_WEIGHT_UNIT,
    "measurement-body-weight-unit-select": DEFAULT_BODY_WEIGHT_UNIT,
    "measurement-volume-unit-select": DEFAULT_VOLUME_UNIT,
  });

  await fillInputs(page, {
    "nutritional-goals-calorie-goal-input": DEFAULT_CALORIE_GOAL.toString(),
    "nutritional-goals-protein-goal-input": DEFAULT_PROTEIN_GOAL.toString(),
    "nutritional-goals-carb-goal-input": DEFAULT_CARB_GOAL.toString(),
    "nutritional-goals-fat-goal-input": DEFAULT_FAT_GOAL.toString(),
    "nutritional-goals-saturates-goal-input": DEFAULT_SATURATES_GOAL.toString(),
    "nutritional-goals-sugars-goal-input": DEFAULT_SUGARS_GOAL.toString(),
    "nutritional-goals-fibre-goal-input": DEFAULT_FIBRE_GOAL.toString(),
    "nutritional-goals-salt-goal-input": DEFAULT_SALT_GOAL.toString(),
  });

  await expectInputValues(page, {
    "nutritional-goals-calorie-goal-input": DEFAULT_CALORIE_GOAL.toString(),
    "nutritional-goals-protein-goal-input": DEFAULT_PROTEIN_GOAL.toString(),
    "nutritional-goals-carb-goal-input": DEFAULT_CARB_GOAL.toString(),
    "nutritional-goals-fat-goal-input": DEFAULT_FAT_GOAL.toString(),
    "nutritional-goals-saturates-goal-input": DEFAULT_SATURATES_GOAL.toString(),
    "nutritional-goals-sugars-goal-input": DEFAULT_SUGARS_GOAL.toString(),
    "nutritional-goals-fibre-goal-input": DEFAULT_FIBRE_GOAL.toString(),
    "nutritional-goals-salt-goal-input": DEFAULT_SALT_GOAL.toString(),
  });

  await page.getByTestId("settings-save-button").click();
};
