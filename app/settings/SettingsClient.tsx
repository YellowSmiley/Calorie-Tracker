"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import MyFoodsSidebar from "./components/MyFoodsSidebar";
import FavoriteMealsSidebar from "./components/FavoriteMealsSidebar";
import NutritionGoalsSection from "./components/NutritionGoalsSection";
import GoalsCalculatorSection from "./components/GoalsCalculatorSection";
import MeasurementUnitsSection from "./components/MeasurementUnitsSection";
import DataPrivacySection from "./components/DataPrivacySection";
import ActionsSection from "./components/ActionsSection";
import { SettingsData, UserSettings } from "./types";
import { signOut } from "next-auth/react";
import {
  convertCaloriesForDisplay,
  convertCaloriesFromInput,
  convertWeightForDisplay,
  convertWeightFromInput,
} from "@/lib/unitConversions";
import LoadingButton from "@/app/components/LoadingButton";
import AppHeader from "../components/AppHeader";

interface SettingsClientProps {
  userSettings: UserSettings;
  initialSettings: SettingsData;
}

type NutritionGoalField =
  | "calorieGoal"
  | "proteinGoal"
  | "carbGoal"
  | "fatGoal"
  | "saturatesGoal"
  | "sugarsGoal"
  | "fibreGoal"
  | "saltGoal";

type NutritionGoalErrors = Partial<Record<NutritionGoalField, string>>;

type SectionMessage = {
  type: "success" | "error";
  text: string;
};

export default function SettingsClient({
  userSettings,
  initialSettings,
}: SettingsClientProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SettingsData>(() => ({
    ...initialSettings,
    calorieGoal: convertCaloriesForDisplay(
      initialSettings.calorieGoal,
      initialSettings.calorieUnit,
    ),
    proteinGoal: convertWeightForDisplay(
      initialSettings.proteinGoal,
      initialSettings.weightUnit,
    ),
    carbGoal: convertWeightForDisplay(
      initialSettings.carbGoal,
      initialSettings.weightUnit,
    ),
    fatGoal: convertWeightForDisplay(
      initialSettings.fatGoal,
      initialSettings.weightUnit,
    ),
    saturatesGoal: convertWeightForDisplay(
      initialSettings.saturatesGoal,
      initialSettings.weightUnit,
    ),
    sugarsGoal: convertWeightForDisplay(
      initialSettings.sugarsGoal,
      initialSettings.weightUnit,
    ),
    fibreGoal: convertWeightForDisplay(
      initialSettings.fibreGoal,
      initialSettings.weightUnit,
    ),
    saltGoal: convertWeightForDisplay(
      initialSettings.saltGoal,
      initialSettings.weightUnit,
    ),
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<SectionMessage | null>(null);
  const [exportMessage, setExportMessage] = useState<SectionMessage | null>(
    null,
  );
  const [deleteMessage, setDeleteMessage] = useState<SectionMessage | null>(
    null,
  );
  const [favoriteMealsMessage, setFavoriteMealsMessage] =
    useState<SectionMessage | null>(null);
  const [showMyFoods, setShowMyFoods] = useState(false);
  const [showFavoriteMeals, setShowFavoriteMeals] = useState(false);
  const [nutritionGoalErrors, setNutritionGoalErrors] =
    useState<NutritionGoalErrors>({});

  const nutritionGoalFields: NutritionGoalField[] = [
    "calorieGoal",
    "proteinGoal",
    "carbGoal",
    "fatGoal",
    "saturatesGoal",
    "sugarsGoal",
    "fibreGoal",
    "saltGoal",
  ];

  const goalLabels: Record<NutritionGoalField, string> = {
    calorieGoal: "Calories",
    proteinGoal: "Protein",
    carbGoal: "Carbohydrates",
    fatGoal: "Fat",
    saturatesGoal: "Saturates",
    sugarsGoal: "Sugars",
    fibreGoal: "Fibre",
    saltGoal: "Salt",
  };

  const isNutritionGoalField = (
    field: keyof SettingsData,
  ): field is NutritionGoalField =>
    nutritionGoalFields.includes(field as NutritionGoalField);

  const validateNutritionGoalField = (
    field: NutritionGoalField,
    value: number | null,
  ) => {
    if (!Number.isFinite(value) || value === null) {
      return `${goalLabels[field]} is required.`;
    }
    if (value < 0) {
      return `${goalLabels[field]} must be at least 0.`;
    }
    return undefined;
  };

  const validateAllNutritionGoals = () => {
    const nextErrors: NutritionGoalErrors = {};

    for (const field of nutritionGoalFields) {
      nextErrors[field] = validateNutritionGoalField(field, settings[field]);
    }

    setNutritionGoalErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleNutritionFieldBlur = (field: NutritionGoalField) => {
    setNutritionGoalErrors((prev) => ({
      ...prev,
      [field]: validateNutritionGoalField(field, settings[field]),
    }));
  };

  const convertBackSettings = (data: SettingsData): SettingsData => ({
    ...data,
    calorieGoal: convertCaloriesForDisplay(data.calorieGoal, data.calorieUnit),
    proteinGoal: convertWeightForDisplay(data.proteinGoal, data.weightUnit),
    carbGoal: convertWeightForDisplay(data.carbGoal, data.weightUnit),
    fatGoal: convertWeightForDisplay(data.fatGoal, data.weightUnit),
    saturatesGoal: convertWeightForDisplay(data.saturatesGoal, data.weightUnit),
    sugarsGoal: convertWeightForDisplay(data.sugarsGoal, data.weightUnit),
    fibreGoal: convertWeightForDisplay(data.fibreGoal, data.weightUnit),
    saltGoal: convertWeightForDisplay(data.saltGoal, data.weightUnit),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllNutritionGoals()) {
      setSaveMessage({
        type: "error",
        text: "Please fix the highlighted nutritional goals.",
      });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    // Convert settings to base units before saving

    const convertedSettings: SettingsData = {
      ...settings,
      calorieGoal: convertCaloriesFromInput(
        settings.calorieGoal,
        settings.calorieUnit,
      ),
      proteinGoal: convertWeightFromInput(
        settings.proteinGoal,
        settings.weightUnit,
      ),
      carbGoal: convertWeightFromInput(settings.carbGoal, settings.weightUnit),
      fatGoal: convertWeightFromInput(settings.fatGoal, settings.weightUnit),
      saturatesGoal: convertWeightFromInput(
        settings.saturatesGoal,
        settings.weightUnit,
      ),
      sugarsGoal: convertWeightFromInput(
        settings.sugarsGoal,
        settings.weightUnit,
      ),
      fibreGoal: convertWeightFromInput(
        settings.fibreGoal,
        settings.weightUnit,
      ),
      saltGoal: convertWeightFromInput(settings.saltGoal, settings.weightUnit),
    };

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(convertedSettings),
      });

      if (response.ok) {
        const updated = (await response.json()) as SettingsData;
        setSettings(convertBackSettings(updated));
        setSaveMessage({
          type: "success",
          text: "Settings saved successfully!",
        });
      } else {
        const error = (await response.json()) as { error?: string };
        setSaveMessage({
          type: "error",
          text: error.error || "Failed to save settings",
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Error saving settings:", error);
      setSaveMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));

    if (isNutritionGoalField(field)) {
      const numericValue = typeof value === "number" ? value : Number(value);
      setNutritionGoalErrors((prev) => ({
        ...prev,
        [field]: validateNutritionGoalField(field, numericValue),
      }));
    }
  };

  const handleApplyCalculatedGoals = (goals: {
    calorieGoal: number;
    proteinGoal: number;
    carbGoal: number;
    fatGoal: number;
    saturatesGoal: number;
    sugarsGoal: number;
    fibreGoal: number;
    saltGoal: number;
  }) => {
    setSettings((prev) => ({ ...prev, ...goals }));
    setNutritionGoalErrors((prev) => ({
      ...prev,
      calorieGoal: validateNutritionGoalField("calorieGoal", goals.calorieGoal),
      proteinGoal: validateNutritionGoalField("proteinGoal", goals.proteinGoal),
      carbGoal: validateNutritionGoalField("carbGoal", goals.carbGoal),
      fatGoal: validateNutritionGoalField("fatGoal", goals.fatGoal),
      saturatesGoal: validateNutritionGoalField(
        "saturatesGoal",
        goals.saturatesGoal,
      ),
      sugarsGoal: validateNutritionGoalField("sugarsGoal", goals.sugarsGoal),
      fibreGoal: validateNutritionGoalField("fibreGoal", goals.fibreGoal),
      saltGoal: validateNutritionGoalField("saltGoal", goals.saltGoal),
    }));
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportMessage(null);
    try {
      const response = await fetch("/api/account/export");
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `calorie-tracker-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMessage({
        type: "success",
        text: "Data exported successfully!",
      });
    } catch {
      setExportMessage({ type: "error", text: "Failed to export data" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteMessage(null);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setDeleteMessage({
          type: "error",
          text: data.error || "Failed to delete account",
        });
        setShowDeleteConfirm(false);
        return;
      }
      signOut({ callbackUrl: "/login" });
    } catch {
      setDeleteMessage({ type: "error", text: "Failed to delete account" });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <AppHeader title="Settings" />

      {/* Main Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 pb-32">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <GoalsCalculatorSection
              calorieUnit={settings.calorieUnit}
              weightUnit={settings.weightUnit}
              bodyWeightUnit={settings.bodyWeightUnit}
              onApplyGoals={handleApplyCalculatedGoals}
            />

            <NutritionGoalsSection
              settings={settings}
              onChange={handleChange}
              fieldErrors={nutritionGoalErrors}
              onFieldBlur={handleNutritionFieldBlur}
            />

            <MeasurementUnitsSection
              settings={settings}
              onChange={handleChange}
            />

            <DataPrivacySection
              showDeleteConfirm={showDeleteConfirm}
              isExporting={isExporting}
              isDeleting={isDeleting}
              exportMessage={exportMessage}
              deleteMessage={deleteMessage}
              onExport={handleExportData}
              onDeleteClick={() => {
                setDeleteMessage(null);
                setShowDeleteConfirm(true);
              }}
              onDeleteConfirm={handleDeleteAccount}
              onDeleteCancel={() => {
                setDeleteMessage(null);
                setShowDeleteConfirm(false);
              }}
            />

            {favoriteMealsMessage && (
              <div
                className={`rounded-lg p-4 ${
                  favoriteMealsMessage.type === "success"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200"
                }`}
                role={
                  favoriteMealsMessage.type === "error" ? "alert" : "status"
                }
                aria-live="polite"
              >
                {favoriteMealsMessage.text}
              </div>
            )}

            <ActionsSection
              isAdmin={session?.user?.isAdmin || false}
              onMyFoodsClick={() => setShowMyFoods(true)}
              onFavoriteMealsClick={() => setShowFavoriteMeals(true)}
            />
          </form>
        </div>
      </div>

      {/* Fixed Buttons */}
      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black p-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {saveMessage && (
            <div
              className={`rounded-lg p-4 ${
                saveMessage.type === "success"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200"
              }`}
              role={saveMessage.type === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {saveMessage.text}
            </div>
          )}
          <LoadingButton
            type="button"
            data-testid="settings-save-button"
            onClick={handleSubmit}
            isLoading={isSaving}
            loadingLabel="Saving settings..."
            spinnerClassName="h-4 w-4"
            className="ct-button-primary w-full rounded-lg px-6 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Save Settings
          </LoadingButton>
        </div>
      </div>

      {/* My Foods Sidebar */}
      <MyFoodsSidebar
        isOpen={showMyFoods}
        onClose={() => setShowMyFoods(false)}
        userSettings={userSettings}
        isAdmin={session?.user?.isAdmin || false}
      />

      <FavoriteMealsSidebar
        isOpen={showFavoriteMeals}
        onClose={() => setShowFavoriteMeals(false)}
        userSettings={userSettings}
        onError={(text) =>
          setFavoriteMealsMessage(text ? { type: "error", text } : null)
        }
      />
    </div>
  );
}
