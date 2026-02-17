"use client";

import { useMemo, useState } from "react";
import type { FoodItem } from "../types";
import {
  formatCalories,
  formatMacro,
  formatSalt,
  getMeasurementInputLabel,
} from "@/lib/unitConversions";
import HelpButton from "../../components/HelpButton";
import { UserSettings } from "../../settings/types";

interface EditFoodSidebarProps {
  isOpen: boolean;
  food: FoodItem | null;
  onClose: () => void;
  onSubmit: (serving: number) => void;
  userSettings: UserSettings;
  isLoading?: boolean;
  isAdd?: boolean;
}

export default function EditFoodSidebar({
  isOpen,
  food,
  onClose,
  onSubmit,
  userSettings,
  isLoading = false,
  isAdd = false,
}: EditFoodSidebarProps) {
  const foodMeasurementAmount = food?.measurementAmount || 100;
  const defaultServing = food?.defaultServingAmount || foodMeasurementAmount;

  const [servingSize, setServingSize] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Initialise when food / sidebar opens (adjust state during render)
  const [prevKey, setPrevKey] = useState("");
  const currentKey = `${food?.id}-${food?.serving}-${isOpen}-${isAdd}`;

  if (currentKey !== prevKey && food && isOpen) {
    setPrevKey(currentKey);
    if (isAdd) {
      setServingSize(String(defaultServing));
      setQuantity("1");
    } else {
      const totalAmount = food.serving * foodMeasurementAmount;
      const qty = Number((totalAmount / defaultServing).toFixed(2));
      setServingSize(String(defaultServing));
      setQuantity(String(qty));
    }
  }

  const servingSizeNum = parseFloat(servingSize) || 0;
  const quantityNum = parseFloat(quantity) || 0;
  const totalAmount = servingSizeNum * quantityNum;

  const calculatedNutrition = useMemo(() => {
    if (!food) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const serving = totalAmount / foodMeasurementAmount;
    return {
      calories: Number((food.baseCalories * serving).toFixed(1)),
      protein: Number((food.baseProtein * serving).toFixed(1)),
      carbs: Number((food.baseCarbs * serving).toFixed(1)),
      fat: Number((food.baseFat * serving).toFixed(1)),
      saturates: Number((food.baseSaturates * serving).toFixed(1)),
      sugars: Number((food.baseSugars * serving).toFixed(1)),
      fibre: Number((food.baseFibre * serving).toFixed(1)),
      salt: Number((food.baseSalt * serving).toFixed(2)),
    };
  }, [food, totalAmount, foodMeasurementAmount]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const serving = totalAmount / foodMeasurementAmount;
    onSubmit(serving);
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={onClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {isAdd ? "Add Food" : "Edit Serving"}
          </h2>
          <HelpButton
            title={isAdd ? "Add Food" : "Edit Serving"}
            content={
              isAdd
                ? "Fill in the details to add a new food item. Enter the name, serving size, and nutrition information."
                : "Adjust the serving size of this food by entering the amount and units. You can use the quantity field to increase or decrease the serving. The nutrition information will update automatically based on the serving size you specify."
            }
            ariaLabel={
              isAdd
                ? "Help: How to add a new food item"
                : "Help: How to adjust serving size"
            }
          />
        </div>
        <div className="w-12" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {/* Food Name - Centered */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-black dark:text-zinc-50 mb-1">
                {food?.name || ""}
              </h3>
              {food?.defaultServingDescription && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {food.defaultServingDescription}
                </p>
              )}
            </div>

            {/* Base Nutrition Info */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
              <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                Base Nutrition (Per {foodMeasurementAmount || ""}{" "}
                {getMeasurementInputLabel(food?.measurementType, userSettings)
                  .inputUnit || ""}
                )
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400" data->
                    Calories
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-base-calories"
                        : "edit-food-base-calories"
                    }
                  >
                    {formatCalories(food?.baseCalories || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Protein
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd ? "add-food-base-protein" : "edit-food-base-protein"
                    }
                  >
                    {formatMacro(food?.baseProtein || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Carbs
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd ? "add-food-base-carbs" : "edit-food-base-carbs"
                    }
                  >
                    {formatMacro(food?.baseCarbs || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Fat
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd ? "add-food-base-fat" : "edit-food-base-fat"
                    }
                  >
                    {formatMacro(food?.baseFat || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Saturates
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-base-saturates"
                        : "edit-food-base-saturates"
                    }
                  >
                    {formatMacro(food?.baseSaturates || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Sugars
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd ? "add-food-base-sugars" : "edit-food-base-sugars"
                    }
                  >
                    {formatMacro(food?.baseSugars || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Fibre
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd ? "add-food-base-fibre" : "edit-food-base-fibre"
                    }
                  >
                    {formatMacro(food?.baseFibre || 0, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Salt
                  </p>
                  <p
                    className="text-lg font-semibold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd ? "add-food-base-salt" : "edit-food-base-salt"
                    }
                  >
                    {formatSalt(food?.baseSalt || 0, userSettings)}
                  </p>
                </div>
              </div>
            </div>

            {/* Serving Size + Quantity Inputs */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-black dark:text-zinc-50 mb-2">
                    Serving Size (
                    {getMeasurementInputLabel(
                      food?.measurementType,
                      userSettings,
                    ).inputUnit || ""}
                    )
                  </label>
                  <input
                    id="serving-size-input"
                    type="number"
                    step="any"
                    min="0"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 bg-transparent text-black dark:text-zinc-50 text-lg font-medium text-center"
                    placeholder={String(defaultServing)}
                    data-testid={
                      isAdd ? "add-food-serving-size" : "edit-food-serving-size"
                    }
                  />
                </div>
                <div>
                  <label
                    className="block text-sm font-semibold text-black dark:text-zinc-50 mb-2"
                    htmlFor="quantity-input"
                  >
                    Quantity
                  </label>
                  <input
                    id="quantity-input"
                    type="number"
                    step="any"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-4 py-3 bg-transparent text-black dark:text-zinc-50 text-lg font-medium text-center"
                    placeholder="1"
                    data-testid={
                      isAdd ? "add-food-quantity" : "edit-food-quantity"
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                {totalAmount > 0
                  ? `Total: ${Number(totalAmount.toFixed(2))}${getMeasurementInputLabel(food?.measurementType, userSettings).inputUnit || ""}`
                  : "Enter serving size and quantity"}
              </p>
            </div>

            {/* Calculated Nutrition */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
              <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                Nutrition for this entry (Serving size × quantity)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Calories
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-calories"
                        : "edit-food-nutrition-calories"
                    }
                  >
                    {formatCalories(calculatedNutrition.calories, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Protein
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-protein"
                        : "edit-food-nutrition-protein"
                    }
                  >
                    {formatMacro(calculatedNutrition.protein, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Carbs
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-carbs"
                        : "edit-food-nutrition-carbs"
                    }
                  >
                    {formatMacro(calculatedNutrition.carbs, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Fat
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-fat"
                        : "edit-food-nutrition-fat"
                    }
                  >
                    {formatMacro(calculatedNutrition.fat, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Saturates
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-saturates"
                        : "edit-food-nutrition-saturates"
                    }
                  >
                    {formatMacro(calculatedNutrition.saturates, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Sugars
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-sugars"
                        : "edit-food-nutrition-sugars"
                    }
                  >
                    {formatMacro(calculatedNutrition.sugars, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Fibre
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-fibre"
                        : "edit-food-nutrition-fibre"
                    }
                  >
                    {formatMacro(calculatedNutrition.fibre, userSettings)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Salt
                  </p>
                  <p
                    className="text-xl font-bold text-black dark:text-zinc-50"
                    data-testid={
                      isAdd
                        ? "add-food-nutrition-salt"
                        : "edit-food-nutrition-salt"
                    }
                  >
                    {formatSalt(calculatedNutrition.salt, userSettings)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-3xl">
            <button
              type="submit"
              disabled={isLoading || totalAmount <= 0}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={isAdd ? "add-food-submit" : "edit-food-submit"}
            >
              {isLoading
                ? "Updating..."
                : isAdd
                  ? "Add Food"
                  : "Update Serving"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
