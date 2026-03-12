"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MyFoodsSidebar from "./components/MyFoodsSidebar";
import NutritionGoalsSection from "./components/NutritionGoalsSection";
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

interface SettingsClientProps {
  userSettings: UserSettings;
}

export default function SettingsClient({ userSettings }: SettingsClientProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SettingsData>({
    calorieGoal: 3000,
    proteinGoal: 150,
    carbGoal: 410,
    fatGoal: 83,
    saturatesGoal: 20,
    sugarsGoal: 90,
    fibreGoal: 30,
    saltGoal: 6,
    calorieUnit: "kcal",
    weightUnit: "g",
    bodyWeightUnit: userSettings.bodyWeightUnit ?? "kg",
    volumeUnit: "ml",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showMyFoods, setShowMyFoods] = useState(false);

  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const convertBackSettings = (data: SettingsData): SettingsData => {
    const convertedBackSettings: SettingsData = {
      ...data,
      calorieGoal: convertCaloriesForDisplay(
        data.calorieGoal,
        data.calorieUnit,
      ),
      proteinGoal: convertWeightForDisplay(data.proteinGoal, data.weightUnit),
      carbGoal: convertWeightForDisplay(data.carbGoal, data.weightUnit),
      fatGoal: convertWeightForDisplay(data.fatGoal, data.weightUnit),
      saturatesGoal: convertWeightForDisplay(
        data.saturatesGoal,
        data.weightUnit,
      ),
      sugarsGoal: convertWeightForDisplay(data.sugarsGoal, data.weightUnit),
      fibreGoal: convertWeightForDisplay(data.fibreGoal, data.weightUnit),
      saltGoal: convertWeightForDisplay(data.saltGoal, data.weightUnit),
    };
    return convertedBackSettings;
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = (await response.json()) as SettingsData;
        setSettings(convertBackSettings(data));
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Error fetching settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

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
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        const error = (await response.json()) as { error?: string };
        setMessage({
          type: "error",
          text: error.error || "Failed to save settings",
        });
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleExportData = async () => {
    setIsExporting(true);
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
      setMessage({ type: "success", text: "Data exported successfully!" });
    } catch {
      setMessage({ type: "error", text: "Failed to export data" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setMessage({
          type: "error",
          text: data.error || "Failed to delete account",
        });
        setShowDeleteConfirm(false);
        return;
      }
      signOut({ callbackUrl: "/login" });
    } catch {
      setMessage({ type: "error", text: "Failed to delete account" });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Settings
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <NutritionGoalsSection
              settings={settings}
              onChange={handleChange}
              userSettings={userSettings}
            />

            <MeasurementUnitsSection
              settings={settings}
              onChange={handleChange}
            />
            {message && (
              <div
                className={`rounded-lg p-4 ${
                  message.type === "success"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-200"
                }`}
              >
                {message.text}
              </div>
            )}

            <DataPrivacySection
              showDeleteConfirm={showDeleteConfirm}
              isExporting={isExporting}
              isDeleting={isDeleting}
              onExport={handleExportData}
              onDeleteClick={() => setShowDeleteConfirm(true)}
              onDeleteConfirm={handleDeleteAccount}
              onDeleteCancel={() => setShowDeleteConfirm(false)}
            />

            <ActionsSection
              isAdmin={session?.user?.isAdmin || false}
              onMyFoodsClick={() => setShowMyFoods(true)}
            />
          </form>
        </div>
      </div>

      {/* Fixed Buttons */}
      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black p-4">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
            data-testid="settings-save-button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full rounded-lg bg-foreground text-background px-6 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* My Foods Sidebar */}
      <MyFoodsSidebar
        isOpen={showMyFoods}
        onClose={() => setShowMyFoods(false)}
        userSettings={userSettings}
        isAdmin={session?.user?.isAdmin || false}
      />
    </div>
  );
}
