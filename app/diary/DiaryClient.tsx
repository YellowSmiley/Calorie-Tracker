"use client";

import { useMemo, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import DailySummaryAccordion from "./components/DailySummaryAccordion";
import BodyWeightCard from "./components/BodyWeightCard";
import MealsSection from "./components/MealsSection";
import HelpButton from "@/app/components/HelpButton";
import { calculateNutritionTotals } from "@/lib/nutritionSummary";
import type { Meal } from "./types";
import { UserSettings } from "../settings/types";
import { startRouteLoading } from "@/app/components/routeLoading";

export interface DiaryClientProps {
  initialMeals: Meal[];
  activeDate: string;
  initialBodyWeightKg: number | null;
  userSettings: UserSettings;
  userGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
  };
}

export default function DiaryClient({
  initialMeals,
  activeDate,
  initialBodyWeightKg,
  userSettings,
  userGoals,
}: DiaryClientProps) {
  const router = useRouter();
  const [isNavigatingDate, startDateNavigation] = useTransition();
  const [currentDate, setCurrentDate] = useState(activeDate);
  const [goals] = useState(userGoals);

  const [meals, setMeals] = useState<Meal[]>(initialMeals);

  // Sync state when server data changes
  useEffect(() => {
    setMeals(initialMeals);
  }, [initialMeals]);

  useEffect(() => {
    setCurrentDate(activeDate);
  }, [activeDate]);

  // Error state
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return calculateNutritionTotals(meals.flatMap((meal) => meal.items));
  }, [meals]);

  const handleDateChange = (newDate: string) => {
    setCurrentDate(newDate);
    startRouteLoading("Loading diary...");
    startDateNavigation(() => {
      router.push(`/diary?date=${newDate}`);
    });
  };

  const handlePreviousDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - 1);
    const newDate = date.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  const handleNextDay = () => {
    const date = new Date(currentDate);
    date.setDate(date.getDate() + 1);
    const newDate = date.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Diary
            </h1>
            <HelpButton
              title="Food Diary"
              content="Log your daily food intake to track calories and nutrition. Click on any food to adjust serving size, or remove it if needed. Use the date selector to view and record meals from different days."
              ariaLabel="Help: Food diary overview"
            />
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePreviousDay}
                disabled={isNavigatingDate}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
                aria-label="Previous day"
                data-testid="previous-day-button"
              >
                <svg
                  className="w-5 h-5 text-black dark:text-zinc-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <input
                type="date"
                value={currentDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={isNavigatingDate}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 text-center cursor-pointer scheme-light dark:scheme-dark"
                style={{ minWidth: "160px" }}
              />

              <button
                onClick={handleNextDay}
                disabled={isNavigatingDate}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
                aria-label="Next day"
                data-testid="next-day-button"
              >
                <svg
                  className="w-5 h-5 text-black dark:text-zinc-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            {isNavigatingDate && (
              <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading selected day...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-300 dark:border-zinc-700 p-4"
          data-testid="diary-error"
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-900 dark:text-zinc-200">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300 text-sm"
                data-testid="diary-error-dismiss"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          <DailySummaryAccordion
            totals={totals}
            goals={goals}
            userSettings={userSettings}
          />
          <BodyWeightCard
            currentDate={currentDate}
            initialBodyWeightKg={initialBodyWeightKg}
            bodyWeightUnit={userSettings.bodyWeightUnit ?? "kg"}
            onError={setError}
          />
          <MealsSection
            meals={meals}
            setMeals={setMeals}
            currentDate={currentDate}
            userSettings={userSettings}
            error={error}
            onError={setError}
          />
        </div>
      </div>
    </div>
  );
}
