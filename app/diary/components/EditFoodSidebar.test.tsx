import { render, fireEvent } from "@testing-library/react";
import EditFoodSidebar from "./EditFoodSidebar";
import { FoodItem } from "../types";
import { UserSettings } from "../../settings/types";

describe("EditFoodSidebar Add Food logic", () => {
  const baseFood = {
    id: "egg1",
    name: "Medium Egg",
    measurementAmount: 100,
    measurementType: "weight",
    defaultServingAmount: 70,
    defaultServingDescription: "1 medium egg",
    baseCalories: 131,
    baseProtein: 12.6,
    baseCarbs: 1.1,
    baseFat: 9.9,
    baseSaturates: 3.1,
    baseSugars: 1.1,
    baseFibre: 0,
    baseSalt: 0.3,
    serving: 1,
    calories: 92,
    protein: 8.9,
    carbs: 0.1,
    fat: 6.3,
    fibre: 0,
    salt: 0.2,
    saturates: 2.4,
    sugars: 0.1,
  } satisfies FoodItem;
  const userSettings: UserSettings = {
    calorieUnit: "kcal",
    weightUnit: "g",
    volumeUnit: "ml",
  };

  it("should call onSubmit with correct serving when quantity is changed in add mode", () => {
    const onSubmit = jest.fn();
    const { getByLabelText, getByRole } = render(
      <EditFoodSidebar
        isOpen={true}
        food={baseFood}
        onClose={() => {}}
        onSubmit={onSubmit}
        userSettings={userSettings}
        isAdd={true}
      />,
    );
    const quantityInput = getByLabelText(/Quantity/i);
    fireEvent.change(quantityInput, { target: { value: "5" } });
    const submitBtn = getByRole("button", { name: /add item/i });
    fireEvent.click(submitBtn);
    // Should call onSubmit with the correct total amount (5 × 70 = 350)
    expect(onSubmit).toHaveBeenCalledWith(3.5);
  });

  it("shows the default serving size when one exists", () => {
    const { getByText } = render(
      <EditFoodSidebar
        isOpen={true}
        food={baseFood}
        onClose={() => {}}
        onSubmit={() => {}}
        userSettings={userSettings}
        isAdd={true}
      />,
    );

    expect(getByText("Default serving: 70g (1 medium egg)")).toBeTruthy();
  });

  it("prefills edit mode with default serving size and derived quantity", () => {
    const onSubmit = jest.fn();
    const editFood = {
      ...baseFood,
      defaultServingAmount: 50,
      defaultServingDescription: "1 thing",
      serving: 3,
    } satisfies FoodItem;

    const { getByRole, getByTestId } = render(
      <EditFoodSidebar
        isOpen={true}
        food={editFood}
        onClose={() => {}}
        onSubmit={onSubmit}
        userSettings={userSettings}
        isAdd={false}
      />,
    );

    const servingSizeInput = getByTestId(
      "edit-food-serving-size",
    ) as HTMLInputElement;
    const quantityInput = getByTestId("edit-food-quantity") as HTMLInputElement;

    expect(servingSizeInput.value).toBe("50.00");
    expect(quantityInput.value).toBe("6");

    fireEvent.click(getByRole("button", { name: /update serving/i }));

    expect(onSubmit).toHaveBeenCalledWith(3);
  });
});
