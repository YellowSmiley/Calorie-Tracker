"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import MyFoodsSidebar from "../components/MyFoodsSidebar";

interface SettingsData {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  saturatesGoal: number;
  sugarsGoal: number;
  fibreGoal: number;
  saltGoal: number;
  calorieUnit: string;
  macroUnit: string;
  weightUnit: string;
  volumeUnit: string;
}

interface SettingsClientProps {
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
    weightUnit: string;
    volumeUnit: string;
  };
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
    macroUnit: "g",
    weightUnit: "g",
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
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
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

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        const error = await response.json();
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
        const data = await response.json();
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
            {/* Nutritional Goals Section */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                Nutritional Goals
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="calorieGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Calories
                    </label>
                    <input
                      id="calorieGoal"
                      type="number"
                      min="0"
                      step="1"
                      value={settings.calorieGoal}
                      onChange={(e) =>
                        handleChange("calorieGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="proteinGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Protein (g)
                    </label>
                    <input
                      id="proteinGoal"
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.proteinGoal}
                      onChange={(e) =>
                        handleChange("proteinGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="carbGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Carbohydrates (g)
                    </label>
                    <input
                      id="carbGoal"
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.carbGoal}
                      onChange={(e) =>
                        handleChange("carbGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fatGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Fat (g)
                    </label>
                    <input
                      id="fatGoal"
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.fatGoal}
                      onChange={(e) =>
                        handleChange("fatGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="saturatesGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Saturates (g)
                    </label>
                    <input
                      id="saturatesGoal"
                      type="number"
                      min="0"
                      step="1"
                      value={settings.saturatesGoal}
                      onChange={(e) =>
                        handleChange(
                          "saturatesGoal",
                          parseFloat(e.target.value),
                        )
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sugarsGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Sugars (g)
                    </label>
                    <input
                      id="sugarsGoal"
                      type="number"
                      min="0"
                      step="1"
                      value={settings.sugarsGoal}
                      onChange={(e) =>
                        handleChange("sugarsGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="fibreGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Fibre (g)
                    </label>
                    <input
                      id="fibreGoal"
                      type="number"
                      min="0"
                      step="1"
                      value={settings.fibreGoal}
                      onChange={(e) =>
                        handleChange("fibreGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="saltGoal"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                    >
                      Salt (g)
                    </label>
                    <input
                      id="saltGoal"
                      type="number"
                      min="0"
                      step="0.1"
                      value={settings.saltGoal}
                      onChange={(e) =>
                        handleChange("saltGoal", parseFloat(e.target.value))
                      }
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Measurement Units Section */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                Measurement Units
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="calorieUnit"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Calorie Unit
                  </label>
                  <select
                    id="calorieUnit"
                    value={settings.calorieUnit}
                    onChange={(e) =>
                      handleChange("calorieUnit", e.target.value)
                    }
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    <option value="kcal">kcal</option>
                    <option value="kJ">kJ</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="macroUnit"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Macronutrient Unit
                  </label>
                  <select
                    id="macroUnit"
                    value={settings.macroUnit}
                    onChange={(e) => handleChange("macroUnit", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="mg">Milligrams (mg)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Food Measurement Units Section */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                Food Measurement Units
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="weightUnit"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Weight Unit
                  </label>
                  <select
                    id="weightUnit"
                    value={settings.weightUnit}
                    onChange={(e) => handleChange("weightUnit", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    <option value="g">Grams (g)</option>
                    <option value="oz">Ounces (oz)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="volumeUnit"
                    className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
                  >
                    Volume Unit
                  </label>
                  <select
                    id="volumeUnit"
                    value={settings.volumeUnit}
                    onChange={(e) => handleChange("volumeUnit", e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                  >
                    <option value="ml">Millilitres (ml)</option>
                    <option value="cup">Cups</option>
                    <option value="tbsp">Tablespoons (tbsp)</option>
                    <option value="tsp">Teaspoons (tsp)</option>
                    <option value="L">Litres (L)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message */}
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

            {/* Data & Privacy Section */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                Data &amp; Privacy
              </h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50 disabled:opacity-50"
                >
                  {isExporting ? "Exporting..." : "Export My Data"}
                </button>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
                  Download all your personal data in JSON format (meals, foods,
                  settings).
                </p>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 px-6 py-3 font-medium transition-colors text-red-600 dark:text-red-400"
                  >
                    Delete My Account
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                      This will permanently delete your account and all
                      associated data (meals, foods, settings). This action
                      cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <Link
                    href="/privacy"
                    className="underline hover:no-underline"
                  >
                    Privacy Policy
                  </Link>
                  <Link href="/terms" className="underline hover:no-underline">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6 mb-40">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                Actions
              </h2>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowMyFoods(true)}
                  className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50"
                >
                  My Foods
                </button>
                {session?.user?.isAdmin && (
                  <Link
                    href="/admin"
                    className="block rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-center text-black dark:text-zinc-50"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Fixed Buttons */}
      <div className="fixed bottom-20 left-0 right-0 z-30 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black p-4">
        <div className="mx-auto max-w-3xl">
          <button
            type="button"
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
      />
    </div>
  );
}
