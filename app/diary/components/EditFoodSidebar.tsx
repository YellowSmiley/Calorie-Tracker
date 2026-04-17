"use client";

import { useMemo, useState } from "react";
import type { FoodItem } from "../types";
import {
  convertWeightForDisplay,
  convertWeightFromInput,
  convertVolumeForDisplay,
  convertVolumeFromInput,
  getCalorieForDisplay,
  getVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import HelpButton from "../../components/HelpButton";
import {
  AcceptedWeightedUnits,
  AcceptedVolumeUnits,
  UserSettings,
} from "../../settings/types";
import ValidatedNumberField from "./ValidatedNumberField";
import LoadingButton from "@/app/components/LoadingButton";

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
  type FieldErrors = {
    servingSize?: string;
    quantity?: string;
  };

  const foodMeasurementAmount = food?.measurementAmount || 100;

  const defaultServing = food?.defaultServingAmount
    ? food.measurementType === "weight"
      ? convertWeightForDisplay(
          food.defaultServingAmount,
          userSettings.weightUnit as AcceptedWeightedUnits,
        )
      : convertVolumeForDisplay(
          food.defaultServingAmount,
          userSettings.volumeUnit as AcceptedVolumeUnits,
        )
    : convertWeightForDisplay(
        100,
        userSettings.weightUnit as AcceptedWeightedUnits,
      );

  const [servingSize, setServingSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateServingSize = (value: string) => {
    if (!value.trim()) return "Serving size is required.";
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return "Serving size must be greater than 0.";
    }
    return undefined;
  };

  const validateQuantity = (value: string) => {
    if (!value.trim()) return "Quantity is required.";
    const parsed = Number(value);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return "Quantity must be greater than 0.";
    }
    return undefined;
  };

  // Initialise when food / sidebar opens (adjust state during render)
  const [prevKey, setPrevKey] = useState("");
  const currentKey = `${food?.id}-${food?.serving}-${isOpen}-${isAdd}`;

  if (currentKey !== prevKey && food && isOpen) {
    setPrevKey(currentKey);
    if (isAdd) {
      setServingSize(String(defaultServing.toFixed(2)));
      setQuantity("1");
    } else {
      const totalAmountInBaseUnits = food.serving * foodMeasurementAmount;
      const totalAmountInDisplayUnits =
        food.measurementType === "weight"
          ? convertWeightForDisplay(
              totalAmountInBaseUnits,
              userSettings.weightUnit as AcceptedWeightedUnits,
            )
          : convertVolumeForDisplay(
              totalAmountInBaseUnits,
              userSettings.volumeUnit as AcceptedVolumeUnits,
            );

      setServingSize(String(totalAmountInDisplayUnits.toFixed(2)));
      setQuantity("1");
    }
  }

  const servingSizeNum = parseFloat(servingSize) || 0;
  const quantityNum = parseFloat(quantity) || 0;
  const totalAmount = servingSizeNum * quantityNum;

  const calculatedNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
  } = useMemo(() => {
    if (!food)
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        saturates: 0,
        sugars: 0,
        fibre: 0,
        salt: 0,
      };
    const convertedTotalAmount =
      food.measurementType === "weight"
        ? convertWeightFromInput(
            totalAmount,
            userSettings.weightUnit as AcceptedWeightedUnits,
          )
        : convertVolumeFromInput(
            totalAmount,
            userSettings.volumeUnit as AcceptedVolumeUnits,
          );
    const serving = convertedTotalAmount / foodMeasurementAmount; // totalAmount is the amount in user units, foodMeasurementAmount in grams/ml
    return {
      calories: food.baseCalories * serving,
      protein: food.baseProtein * serving,
      carbs: food.baseCarbs * serving,
      fat: food.baseFat * serving,
      saturates: food.baseSaturates * serving,
      sugars: food.baseSugars * serving,
      fibre: food.baseFibre * serving,
      salt: food.baseSalt * serving,
    };
  }, [food, totalAmount, foodMeasurementAmount, userSettings]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nextErrors: FieldErrors = {
      servingSize: validateServingSize(servingSize),
      quantity: validateQuantity(quantity),
    };
    setFieldErrors(nextErrors);

    if (nextErrors.servingSize || nextErrors.quantity) {
      return;
    }

    const convertedTotalAmount =
      food?.measurementType === "weight"
        ? convertWeightFromInput(
            totalAmount,
            userSettings.weightUnit as AcceptedWeightedUnits,
          )
        : convertVolumeFromInput(
            totalAmount,
            userSettings.volumeUnit as AcceptedVolumeUnits,
          );
    const serving = convertedTotalAmount / foodMeasurementAmount;
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
          data-testid={isAdd ? "add-food-back-button" : "edit-food-back-button"}
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {isAdd ? "Add Food" : "Edit Serving"}
          </h2>
          <HelpButton
            title={isAdd ? "Add Food" : "Edit Serving"}
            ariaLabel={
              isAdd
                ? "Help: How to add a new food item"
                : "Help: How to adjust serving size"
            }
          >
            {isAdd ? (
              <>
                <p>Fill in details to add a new food item.</p>
                <p>Enter the name, serving size, and nutrition information.</p>
              </>
            ) : (
              <>
                <p>
                  Adjust serving size by entering the amount and units you want
                  to use.
                </p>
                <p>
                  Use quantity to increase or decrease the serving. Nutrition
                  updates automatically.
                </p>
              </>
            )}
          </HelpButton>
        </div>
        <div className="w-12" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-3xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-6">
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
              <h4
                className="text-sm font-semibold text-black dark:text-zinc-50 mb-3"
                data-testid={
                  isAdd
                    ? "add-food-base-nutrition-title"
                    : "edit-food-base-nutrition-title"
                }
              >
                Base Nutrition (Per{" "}
                {food?.measurementType === "weight"
                  ? getWeightForDisplay(
                      food?.measurementAmount,
                      userSettings.weightUnit,
                    )
                  : getVolumeForDisplay(
                      food?.measurementAmount,
                      userSettings.volumeUnit,
                    )}
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
                    {getCalorieForDisplay(
                      food?.baseCalories,
                      userSettings.calorieUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseProtein,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseCarbs,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseFat,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseSaturates,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseSugars,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseFibre,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      food?.baseSalt,
                      userSettings.weightUnit,
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Serving Size + Quantity Inputs */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ValidatedNumberField
                  id="serving-size-input"
                  label={`Serving Size (${food?.measurementType === "weight" ? userSettings.weightUnit : userSettings.volumeUnit})`}
                  value={servingSize}
                  onChange={(nextServingSize) => {
                    setServingSize(nextServingSize);
                    setFieldErrors((prev) => ({
                      ...prev,
                      servingSize: validateServingSize(nextServingSize),
                    }));
                  }}
                  onBlur={() => {
                    setFieldErrors((prev) => ({
                      ...prev,
                      servingSize: validateServingSize(servingSize),
                    }));
                  }}
                  placeholder={String(defaultServing)}
                  dataTestId={
                    isAdd ? "add-food-serving-size" : "edit-food-serving-size"
                  }
                  error={fieldErrors.servingSize}
                />
                <ValidatedNumberField
                  id="quantity-input"
                  label="Quantity"
                  value={quantity}
                  onChange={(nextQuantity) => {
                    setQuantity(nextQuantity);
                    setFieldErrors((prev) => ({
                      ...prev,
                      quantity: validateQuantity(nextQuantity),
                    }));
                  }}
                  onBlur={() => {
                    setFieldErrors((prev) => ({
                      ...prev,
                      quantity: validateQuantity(quantity),
                    }));
                  }}
                  placeholder="1"
                  dataTestId={
                    isAdd ? "add-food-quantity" : "edit-food-quantity"
                  }
                  error={fieldErrors.quantity}
                />
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                {totalAmount > 0
                  ? `Total: ${Number(totalAmount.toFixed(2))}${food?.measurementType === "weight" ? userSettings.weightUnit : userSettings.volumeUnit}`
                  : "Enter serving size and quantity"}
              </p>
            </div>

            {/* Calculated Nutrition */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
              <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                Nutrition for this entry (Serving size * quantity)
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
                    {getCalorieForDisplay(
                      calculatedNutrition.calories,
                      userSettings.calorieUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.protein,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.carbs,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.fat,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.saturates,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.sugars,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.fibre,
                      userSettings.weightUnit,
                    )}
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
                    {getWeightForDisplay(
                      calculatedNutrition.salt,
                      userSettings.weightUnit,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-3xl">
            <LoadingButton
              type="submit"
              disabled={
                isLoading ||
                totalAmount <= 0 ||
                Boolean(fieldErrors.servingSize) ||
                Boolean(fieldErrors.quantity)
              }
              isLoading={isLoading}
              loadingLabel="Updating serving..."
              spinnerClassName="h-4 w-4"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={isAdd ? "add-food-submit" : "edit-food-submit"}
            >
              {isAdd ? "Add Food" : "Update Serving"}
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  );
}
