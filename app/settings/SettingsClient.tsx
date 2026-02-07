"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

interface SettingsData {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  calorieUnit: string;
  macroUnit: string;
  weightUnit: string;
  volumeUnit: string;
}

export default function SettingsClient() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SettingsData>({
    calorieGoal: 3000,
    proteinGoal: 150,
    carbGoal: 410,
    fatGoal: 83,
    calorieUnit: "kcal",
    macroUnit: "g",
    weightUnit: "g",
    volumeUnit: "ml",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: string | number) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
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
                    <option value="cal">cal</option>
                    <option value="kcal">kcal</option>
                    <option value="Cal">Cal</option>
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
                    <option value="g">grams (g)</option>
                    <option value="oz">ounces (oz)</option>
                    <option value="mg">milligrams (mg)</option>
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
                    <option value="g">grams (g)</option>
                    <option value="oz">ounces (oz)</option>
                    <option value="kg">kilograms (kg)</option>
                    <option value="lbs">pounds (lbs)</option>
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
                    <option value="ml">milliliters (ml)</option>
                    <option value="cup">cups</option>
                    <option value="tbsp">tablespoons (tbsp)</option>
                    <option value="tsp">teaspoons (tsp)</option>
                    <option value="L">liters (L)</option>
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

            {/* Actions Section */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6 mb-40">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-4">
                Actions
              </h2>

              <div className="space-y-3">
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
    </div>
  );
}
