"use client";
import { useState, useEffect, useRef } from "react";
import {
  convertCaloriesFromInput,
  convertMacroFromInput,
} from "@/lib/unitConversions";
import HelpButton from "../../../components/HelpButton";
import NutritionLabelPhotoInput from "./NutritionLabelPhotoInput";
import { FoodItem, MeasurementType } from "../../types";
import { UserSettings } from "../../../settings/types";
import { Food } from "@prisma/client";
import BarcodeInput from "./BarcodeInput";

export type CreateFoodSidebarOnSubmitData = Omit<
  FoodItem,
  | "baseCalories"
  | "serving"
  | "baseProtein"
  | "baseCarbs"
  | "id"
  | "baseFat"
  | "baseSaturates"
  | "baseSugars"
  | "baseFibre"
  | "baseSalt"
>;

interface CreateFoodSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateFoodSidebarOnSubmitData) => void;
  userSettings: UserSettings;
  isLoading?: boolean;
  editingFood?: Food | null;
}

export default function CreateFoodSidebar({
  isOpen,
  onClose,
  onSubmit,
  userSettings,
  isLoading = false,
  editingFood = null,
}: CreateFoodSidebarProps) {
  const initialFormData = {
    name: "",
    measurementAmount: "",
    measurementType: "weight" as MeasurementType,
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    saturates: "",
    sugars: "",
    fibre: "",
    salt: "",
    defaultServingAmount: "",
    defaultServingDescription: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  const hasInitialized = useRef<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (editingFood && isOpen) {
      const foodKey = `edit-${editingFood.id}`;

      if (hasInitialized.current !== foodKey) {
        hasInitialized.current = foodKey;

        setFormData({
          name: editingFood.name,
          measurementAmount: String(editingFood.measurementAmount),
          measurementType: editingFood.measurementType as MeasurementType,
          calories: String(editingFood.calories),
          protein: String(editingFood.protein),
          carbs: String(editingFood.carbs),
          fat: String(editingFood.fat),
          saturates: String(editingFood.saturates),
          sugars: String(editingFood.sugars),
          fibre: String(editingFood.fibre),
          salt: String(editingFood.salt),
          defaultServingAmount: editingFood.defaultServingAmount
            ? String(editingFood.defaultServingAmount)
            : "",
          defaultServingDescription:
            editingFood.defaultServingDescription ?? "",
        });
      }
    } else if (!editingFood && isOpen) {
      const foodKey = "create-new";

      if (hasInitialized.current !== foodKey) {
        hasInitialized.current = foodKey;

        setFormData(initialFormData);
      }
    } else if (!isOpen) {
      hasInitialized.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingFood?.id, isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required nutrition fields
    if (
      formData.saturates.trim() === "" ||
      formData.sugars.trim() === "" ||
      formData.fibre.trim() === "" ||
      formData.salt.trim() === ""
    ) {
      alert("Saturates, Sugars, Fibre, and Salt are required.");
      return;
    }

    // Convert from user's input units to database storage units (kcal, grams)
    const servingAmount = parseFloat(formData.defaultServingAmount);
    onSubmit({
      name: formData.name,
      measurementAmount: parseFloat(formData.measurementAmount) || 100,
      measurementType: formData.measurementType,
      calories: convertCaloriesFromInput(
        parseFloat(formData.calories) || 0,
        userSettings.calorieUnit,
      ),
      protein: convertMacroFromInput(
        parseFloat(formData.protein) || 0,
        userSettings.weightUnit,
      ),
      carbs: convertMacroFromInput(
        parseFloat(formData.carbs) || 0,
        userSettings.weightUnit,
      ),
      fat: convertMacroFromInput(
        parseFloat(formData.fat) || 0,
        userSettings.weightUnit,
      ),
      saturates: convertMacroFromInput(
        parseFloat(formData.saturates) || 0,
        userSettings.weightUnit,
      ),
      sugars: convertMacroFromInput(
        parseFloat(formData.sugars) || 0,
        userSettings.weightUnit,
      ),
      fibre: convertMacroFromInput(
        parseFloat(formData.fibre) || 0,
        userSettings.weightUnit,
      ),
      salt: convertMacroFromInput(
        parseFloat(formData.salt) || 0,
        userSettings.weightUnit,
      ),
      defaultServingAmount: servingAmount > 0 ? servingAmount : null,
      defaultServingDescription:
        formData.defaultServingDescription.trim() || null,
    });
  };

  const handleClose = () => {
    setFormData({
      name: "",
      measurementAmount: "",
      measurementType: "weight",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
      saturates: "",
      sugars: "",
      fibre: "",
      salt: "",
      defaultServingAmount: "",
      defaultServingDescription: "",
    });
    onClose();
  };

  // Handler for extracted nutrition label data
  function handleExtractedLabel(data: Partial<Record<string, string>>) {
    setFormData((prev) => ({
      ...prev,
      name: data.name ?? prev.name,
      calories: data.calories ?? prev.calories,
      protein: data.protein ?? prev.protein,
      carbs: data.carbs ?? prev.carbs,
      fat: data.fat ?? prev.fat,
      saturates: data.saturates ?? prev.saturates,
      sugars: data.sugars ?? prev.sugars,
      fibre: data.fibre ?? prev.fibre,
      salt: data.salt ?? prev.salt,
    }));
  }

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={handleClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {editingFood ? "Edit Food" : "Create Food"}
          </h2>
          <HelpButton
            title={editingFood ? "Edit Food" : "Create Food"}
            content="Enter the food details including name, measurement unit, and nutrition information. Fill in all fields marked with * (required). Nutrition values should be per the measurement unit you specify (e.g., per 100g, per serving). You can optionally set a default serving size and description for easier logging."
            ariaLabel="Help: How to create or edit a food"
          />
        </div>
        <div className="w-12" />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wrapping in isOpen to clear on close */}
              {isOpen && (
                <div className="md:col-span-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  {/* Barcode input sits in front of NutritionLabelPhotoInput */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BarcodeInput onExtract={handleExtractedLabel} />
                    <NutritionLabelPhotoInput
                      onExtract={handleExtractedLabel}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Food Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="e.g., Chicken Breast"
                  required
                  data-testid="create-food-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Measurement Type
                </label>
                <select
                  value={formData.measurementType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      measurementType: e.target.value as MeasurementType,
                    })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-zinc-900 text-black dark:text-zinc-50"
                  data-testid="create-food-measurement-type"
                >
                  <option
                    value="weight"
                    className="bg-white text-black dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    Weight ({userSettings.weightUnit})
                  </option>
                  <option
                    value="volume"
                    className="bg-white text-black dark:bg-zinc-900 dark:text-zinc-50"
                  >
                    Volume ({userSettings.volumeUnit})
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Measurement Value (
                  {formData.measurementType === "weight"
                    ? userSettings.weightUnit
                    : userSettings.volumeUnit}
                  )
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.measurementAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      measurementAmount: e.target.value,
                    })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="100"
                  data-testid="create-food-measurement-amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Calories ({userSettings.calorieUnit}) *
                </label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) =>
                    setFormData({ ...formData, calories: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-calories"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Protein ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.protein}
                  onChange={(e) =>
                    setFormData({ ...formData, protein: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-protein"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Carbs ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.carbs}
                  onChange={(e) =>
                    setFormData({ ...formData, carbs: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-carbs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Fat ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-fat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Saturates ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.saturates}
                  onChange={(e) =>
                    setFormData({ ...formData, saturates: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-saturates"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Sugars ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.sugars}
                  onChange={(e) =>
                    setFormData({ ...formData, sugars: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-sugars"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Fibre ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.fibre}
                  onChange={(e) =>
                    setFormData({ ...formData, fibre: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-fibre"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Salt ({userSettings.weightUnit}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salt}
                  onChange={(e) =>
                    setFormData({ ...formData, salt: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                  required
                  data-testid="create-food-salt"
                />
              </div>
            </div>

            {/* Default Serving Section */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                Default Serving (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                    Serving Amount (
                    {formData.measurementType === "weight"
                      ? userSettings.weightUnit
                      : userSettings.volumeUnit}
                    )
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.defaultServingAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultServingAmount: e.target.value,
                      })
                    }
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                    placeholder="e.g. 70"
                    data-testid="create-food-serving-amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                    Serving Description
                  </label>
                  <input
                    type="text"
                    maxLength={50}
                    value={formData.defaultServingDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultServingDescription: e.target.value,
                      })
                    }
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                    placeholder="e.g. 1 medium egg"
                    data-testid="create-food-serving-description"
                  />
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
              disabled={isLoading}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="create-food-submit"
            >
              {isLoading
                ? editingFood
                  ? "Updating..."
                  : "Creating..."
                : editingFood
                  ? "Update Food"
                  : "Create Food"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
