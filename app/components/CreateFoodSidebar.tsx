"use client";

import { useState } from "react";
import {
  convertCaloriesFromInput,
  convertMacroFromInput,
} from "@/lib/unitConversions";

interface CreateFoodSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    measurement: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
  isLoading?: boolean;
}

export default function CreateFoodSidebar({
  isOpen,
  onClose,
  onSubmit,
  userSettings,
  isLoading = false,
}: CreateFoodSidebarProps) {
  const [formData, setFormData] = useState({
    name: "",
    measurementValue: "",
    measurementType: "weight",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Build measurement string from value and unit
    const unit =
      formData.measurementType === "weight"
        ? userSettings.weightUnit
        : userSettings.volumeUnit;
    const measurement = `${formData.measurementValue}${unit}`;

    // Convert from user's input units to database storage units (kcal, grams)
    onSubmit({
      name: formData.name,
      measurement: measurement,
      calories: convertCaloriesFromInput(
        parseFloat(formData.calories) || 0,
        userSettings.calorieUnit,
      ),
      protein: convertMacroFromInput(
        parseFloat(formData.protein) || 0,
        userSettings.macroUnit,
      ),
      carbs: convertMacroFromInput(
        parseFloat(formData.carbs) || 0,
        userSettings.macroUnit,
      ),
      fat: convertMacroFromInput(
        parseFloat(formData.fat) || 0,
        userSettings.macroUnit,
      ),
    });
    setFormData({
      name: "",
      measurementValue: "",
      measurementType: "weight",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
  };

  const handleClose = () => {
    setFormData({
      name: "",
      measurementValue: "",
      measurementType: "weight",
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    });
    onClose();
  };

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
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Create Food
        </h2>
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
                      measurementType: e.target.value,
                    })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                >
                  <option value="weight">Weight</option>
                  <option value="volume">Volume</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Measurement Value
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.measurementValue}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      measurementValue: e.target.value,
                    })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Unit (
                  {formData.measurementType === "weight"
                    ? userSettings.weightUnit
                    : userSettings.volumeUnit}
                  )
                </label>
                {formData.measurementType === "weight" ? (
                  <select
                    value={userSettings.weightUnit}
                    disabled
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 opacity-60 cursor-not-allowed"
                  >
                    <option value={userSettings.weightUnit}>
                      {userSettings.weightUnit}
                    </option>
                  </select>
                ) : (
                  <select
                    value={userSettings.volumeUnit}
                    disabled
                    className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 opacity-60 cursor-not-allowed"
                  >
                    <option value={userSettings.volumeUnit}>
                      {userSettings.volumeUnit}
                    </option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Calories ({userSettings.calorieUnit})
                </label>
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) =>
                    setFormData({ ...formData, calories: e.target.value })
                  }
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Protein ({userSettings.macroUnit})
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Carbs ({userSettings.macroUnit})
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Fat ({userSettings.macroUnit})
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
                />
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
            >
              {isLoading ? "Adding..." : "Add Food"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
