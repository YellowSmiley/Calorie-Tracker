"use client";
import { useState, useEffect, useRef } from "react";
import {
  convertCaloriesFromInput,
  convertWeightFromInput,
  convertVolumeFromInput,
  convertWeightForDisplay,
  convertVolumeForDisplay,
} from "@/lib/unitConversions";
import HelpButton from "../../../components/HelpButton";
import NutritionLabelPhotoInput from "./NutritionLabelPhotoInput";
import { FoodItem, MeasurementType } from "../../types";
import { UserSettings } from "../../../settings/types";
import { Food } from "@prisma/client";
import BarcodeInput from "./BarcodeInput";
import ValidatedNumberField from "../ValidatedNumberField";
import ValidatedTextField from "../../../components/ValidatedTextField";
import LoadingButton from "@/app/components/LoadingButton";

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
  error?: string | null;
}

export default function CreateFoodSidebar({
  isOpen,
  onClose,
  onSubmit,
  userSettings,
  isLoading = false,
  editingFood = null,
  error = null,
}: CreateFoodSidebarProps) {
  type FormErrors = Partial<Record<keyof typeof initialFormData, string>>;

  const requiredNumberFields: Array<keyof typeof initialFormData> = [
    "calories",
    "protein",
    "carbs",
    "fat",
    "saturates",
    "sugars",
    "fibre",
    "salt",
  ];

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
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});

  const validateTextRequired = (value: string, label: string) => {
    if (!value.trim()) return `${label} is required.`;
    return undefined;
  };

  const validateNumberField = (
    value: string,
    label: string,
    options?: { required?: boolean; min?: number },
  ) => {
    const required = options?.required ?? false;
    const min = options?.min ?? 0;

    if (!value.trim()) {
      return required ? `${label} is required.` : undefined;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return `${label} must be a valid number.`;
    }
    if (parsed < min) {
      return `${label} must be at least ${min}.`;
    }
    return undefined;
  };

  const validateField = (
    field: keyof typeof initialFormData,
    value: string,
  ): string | undefined => {
    switch (field) {
      case "name":
        return validateTextRequired(value, "Food name");
      case "calories":
        return validateNumberField(value, "Calories", {
          required: true,
          min: 0,
        });
      case "protein":
        return validateNumberField(value, "Protein", {
          required: true,
          min: 0,
        });
      case "carbs":
        return validateNumberField(value, "Carbs", { required: true, min: 0 });
      case "fat":
        return validateNumberField(value, "Fat", { required: true, min: 0 });
      case "saturates":
        return validateNumberField(value, "Saturates", {
          required: true,
          min: 0,
        });
      case "sugars":
        return validateNumberField(value, "Sugars", { required: true, min: 0 });
      case "fibre":
        return validateNumberField(value, "Fibre", { required: true, min: 0 });
      case "salt":
        return validateNumberField(value, "Salt", { required: true, min: 0 });
      case "measurementAmount":
        return validateNumberField(value, "Measurement value", {
          required: false,
          min: 0,
        });
      case "defaultServingAmount":
        return validateNumberField(value, "Serving amount", {
          required: false,
          min: 0,
        });
      default:
        return undefined;
    }
  };

  const updateField = (field: keyof typeof initialFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateAndValidateField = (
    field: keyof typeof initialFormData,
    value: string,
  ) => {
    updateField(field, value);
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validateField(field, value),
    }));
  };

  const validateAllFields = () => {
    const nextErrors: FormErrors = {
      name: validateField("name", formData.name),
      measurementAmount: validateField(
        "measurementAmount",
        formData.measurementAmount,
      ),
      defaultServingAmount: validateField(
        "defaultServingAmount",
        formData.defaultServingAmount,
      ),
    };

    for (const field of requiredNumberFields) {
      nextErrors[field] = validateField(field, formData[field]);
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const hasInitialized = useRef<string | null>(null);

  useEffect(() => {
    if (editingFood && isOpen) {
      const foodKey = `edit-${editingFood.id}`;

      if (hasInitialized.current !== foodKey) {
        hasInitialized.current = foodKey;

        // Convert measurement amount from base storage unit to user's preferred unit
        const measurementAmountInUserUnit =
          editingFood.measurementType === "weight"
            ? convertWeightForDisplay(
                editingFood.measurementAmount,
                userSettings.weightUnit,
              )
            : convertVolumeForDisplay(
                editingFood.measurementAmount,
                userSettings.volumeUnit,
              );

        setFormData({
          name: editingFood.name,
          measurementAmount: String(measurementAmountInUserUnit),
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
        setFieldErrors({});
      }
    } else if (!editingFood && isOpen) {
      const foodKey = "create-new";

      if (hasInitialized.current !== foodKey) {
        hasInitialized.current = foodKey;

        setFormData(initialFormData);
        setFieldErrors({});
      }
    } else if (!isOpen) {
      hasInitialized.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingFood?.id, isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateAllFields()) {
      return;
    }

    // Convert measurement amount from user's input unit to base storage unit (ml for volume, g for weight)
    const measurementAmountInBaseUnit =
      formData.measurementType === "weight"
        ? convertWeightFromInput(
            parseFloat(formData.measurementAmount) || 100,
            userSettings.weightUnit,
          )
        : convertVolumeFromInput(
            parseFloat(formData.measurementAmount) || 100,
            userSettings.volumeUnit,
          );

    // Convert from user's input units to database storage units (kcal, grams)
    const servingAmount = parseFloat(formData.defaultServingAmount);
    onSubmit({
      name: formData.name,
      measurementAmount: measurementAmountInBaseUnit,
      measurementType: formData.measurementType,
      calories: convertCaloriesFromInput(
        parseFloat(formData.calories) || 0,
        userSettings.calorieUnit,
      ),
      protein: convertWeightFromInput(
        parseFloat(formData.protein) || 0,
        userSettings.weightUnit,
      ),
      carbs: convertWeightFromInput(
        parseFloat(formData.carbs) || 0,
        userSettings.weightUnit,
      ),
      fat: convertWeightFromInput(
        parseFloat(formData.fat) || 0,
        userSettings.weightUnit,
      ),
      saturates: convertWeightFromInput(
        parseFloat(formData.saturates) || 0,
        userSettings.weightUnit,
      ),
      sugars: convertWeightFromInput(
        parseFloat(formData.sugars) || 0,
        userSettings.weightUnit,
      ),
      fibre: convertWeightFromInput(
        parseFloat(formData.fibre) || 0,
        userSettings.weightUnit,
      ),
      salt: convertWeightFromInput(
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
    setFieldErrors({});
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
            ariaLabel="Help: How to create or edit a food"
          >
            <p>
              Enter food details including name, measurement unit, and nutrition
              information.
            </p>
            <p>Fill in all fields marked with * (required).</p>
            <p>
              Nutrition values should match the measurement unit you specify
              (for example per 100g or per serving).
            </p>
            <p>
              Optionally set a default serving size and description for faster
              logging.
            </p>
          </HelpButton>
        </div>
        <div className="w-12" />
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-6xl rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Wrapping in isOpen to clear on close */}
              {isOpen && (
                <>
                  <BarcodeInput onExtract={handleExtractedLabel} />
                  <NutritionLabelPhotoInput onExtract={handleExtractedLabel} />
                </>
              )}
              <div />
              <ValidatedTextField
                id="create-food-name-input"
                label="Food Name *"
                value={formData.name}
                onChange={(value) => updateAndValidateField("name", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    name: validateField("name", formData.name),
                  }));
                }}
                placeholder="e.g., Chicken Breast"
                required
                dataTestId="create-food-name"
                error={fieldErrors.name}
              />

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
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-white dark:bg-black text-black dark:text-zinc-50"
                  data-testid="create-food-measurement-type"
                >
                  <option
                    value="weight"
                    className="bg-white text-black dark:bg-black dark:text-zinc-50"
                  >
                    Weight ({userSettings.weightUnit})
                  </option>
                  <option
                    value="volume"
                    className="bg-white text-black dark:bg-black dark:text-zinc-50"
                  >
                    Volume ({userSettings.volumeUnit})
                  </option>
                </select>
              </div>

              <ValidatedNumberField
                id="create-food-measurement-amount-input"
                label={`Measurement Value (${formData.measurementType === "weight" ? userSettings.weightUnit : userSettings.volumeUnit})`}
                value={formData.measurementAmount}
                onChange={(value) =>
                  updateAndValidateField("measurementAmount", value)
                }
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    measurementAmount: validateField(
                      "measurementAmount",
                      formData.measurementAmount,
                    ),
                  }));
                }}
                step="0.1"
                placeholder="100"
                dataTestId="create-food-measurement-amount"
                error={fieldErrors.measurementAmount}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-calories-input"
                label={`Calories (${userSettings.calorieUnit}) *`}
                value={formData.calories}
                onChange={(value) => updateAndValidateField("calories", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    calories: validateField("calories", formData.calories),
                  }));
                }}
                placeholder="0"
                required
                dataTestId="create-food-calories"
                error={fieldErrors.calories}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-protein-input"
                label={`Protein (${userSettings.weightUnit}) *`}
                value={formData.protein}
                onChange={(value) => updateAndValidateField("protein", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    protein: validateField("protein", formData.protein),
                  }));
                }}
                step="0.1"
                placeholder="0"
                required
                dataTestId="create-food-protein"
                error={fieldErrors.protein}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-carbs-input"
                label={`Carbs (${userSettings.weightUnit}) *`}
                value={formData.carbs}
                onChange={(value) => updateAndValidateField("carbs", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    carbs: validateField("carbs", formData.carbs),
                  }));
                }}
                step="0.1"
                placeholder="0"
                required
                dataTestId="create-food-carbs"
                error={fieldErrors.carbs}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-fat-input"
                label={`Fat (${userSettings.weightUnit}) *`}
                value={formData.fat}
                onChange={(value) => updateAndValidateField("fat", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    fat: validateField("fat", formData.fat),
                  }));
                }}
                step="0.1"
                placeholder="0"
                required
                dataTestId="create-food-fat"
                error={fieldErrors.fat}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-saturates-input"
                label={`Saturates (${userSettings.weightUnit}) *`}
                value={formData.saturates}
                onChange={(value) => updateAndValidateField("saturates", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    saturates: validateField("saturates", formData.saturates),
                  }));
                }}
                step="0.1"
                placeholder="0"
                required
                dataTestId="create-food-saturates"
                error={fieldErrors.saturates}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-sugars-input"
                label={`Sugars (${userSettings.weightUnit}) *`}
                value={formData.sugars}
                onChange={(value) => updateAndValidateField("sugars", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    sugars: validateField("sugars", formData.sugars),
                  }));
                }}
                step="0.1"
                placeholder="0"
                required
                dataTestId="create-food-sugars"
                error={fieldErrors.sugars}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-fibre-input"
                label={`Fibre (${userSettings.weightUnit}) *`}
                value={formData.fibre}
                onChange={(value) => updateAndValidateField("fibre", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    fibre: validateField("fibre", formData.fibre),
                  }));
                }}
                step="0.1"
                placeholder="0"
                required
                dataTestId="create-food-fibre"
                error={fieldErrors.fibre}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />

              <ValidatedNumberField
                id="create-food-salt-input"
                label={`Salt (${userSettings.weightUnit}) *`}
                value={formData.salt}
                onChange={(value) => updateAndValidateField("salt", value)}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    salt: validateField("salt", formData.salt),
                  }));
                }}
                step="0.01"
                placeholder="0"
                required
                dataTestId="create-food-salt"
                error={fieldErrors.salt}
                labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
              />
            </div>

            {/* Default Serving Section */}
            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                Default Serving (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ValidatedNumberField
                  id="create-food-serving-amount-input"
                  label={`Serving Amount (${formData.measurementType === "weight" ? userSettings.weightUnit : userSettings.volumeUnit})`}
                  value={formData.defaultServingAmount}
                  onChange={(value) =>
                    updateAndValidateField("defaultServingAmount", value)
                  }
                  onBlur={() => {
                    setFieldErrors((prev) => ({
                      ...prev,
                      defaultServingAmount: validateField(
                        "defaultServingAmount",
                        formData.defaultServingAmount,
                      ),
                    }));
                  }}
                  step="0.1"
                  placeholder="e.g. 70"
                  dataTestId="create-food-serving-amount"
                  error={fieldErrors.defaultServingAmount}
                  labelClassName="block text-sm font-medium text-black dark:text-zinc-50 mb-1"
                  inputClassName="w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                />
                <ValidatedTextField
                  id="create-food-serving-description-input"
                  label="Serving Description"
                  value={formData.defaultServingDescription}
                  onChange={(value) =>
                    updateField("defaultServingDescription", value)
                  }
                  maxLength={50}
                  placeholder="e.g. 1 medium egg"
                  dataTestId="create-food-serving-description"
                />
              </div>

              {(() => {
                const servAmt = parseFloat(formData.defaultServingAmount);
                const measAmt = parseFloat(formData.measurementAmount);
                if (!servAmt || !measAmt || servAmt <= 0 || measAmt <= 0)
                  return null;
                const ratio = servAmt / measAmt;
                const scale = (v: string) => {
                  const n = parseFloat(v);
                  return isNaN(n)
                    ? "0"
                    : String(Math.round(n * ratio * 10) / 10);
                };
                const unit = userSettings.weightUnit;
                const cal = userSettings.calorieUnit;
                const nutrients = [
                  {
                    label: "Calories",
                    value: `${scale(formData.calories)} ${cal}`,
                  },
                  {
                    label: "Protein",
                    value: `${scale(formData.protein)}${unit}`,
                  },
                  { label: "Carbs", value: `${scale(formData.carbs)}${unit}` },
                  { label: "Fat", value: `${scale(formData.fat)}${unit}` },
                  {
                    label: "Saturates",
                    value: `${scale(formData.saturates)}${unit}`,
                  },
                  {
                    label: "Sugars",
                    value: `${scale(formData.sugars)}${unit}`,
                  },
                  { label: "Fibre", value: `${scale(formData.fibre)}${unit}` },
                  { label: "Salt", value: `${scale(formData.salt)}${unit}` },
                ];
                return (
                  <div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
                    <h4 className="text-sm font-semibold text-black dark:text-zinc-50 mb-3">
                      Nutrition per serving (Serving size * quantity)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {nutrients.map(({ label, value }) => (
                        <div key={label}>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            {label}
                          </p>
                          <p className="text-xl font-bold text-black dark:text-zinc-50">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-3xl">
            {error && (
              <p
                className="mb-3 rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                data-testid="create-food-submit-error"
              >
                Error: {error}
              </p>
            )}
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingLabel={
                editingFood ? "Updating food..." : "Creating food..."
              }
              spinnerClassName="h-4 w-4"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="create-food-submit"
            >
              {editingFood ? "Update Food" : "Create Food"}
            </LoadingButton>
          </div>
        </div>
      </form>
    </div>
  );
}
