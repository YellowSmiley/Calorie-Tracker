"use client";

import { useState } from "react";
import {
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import { UserSettings } from "../../settings/types";

interface DailySummaryAccordionProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
  };
  userSettings: Omit<UserSettings, "volumeUnit">;
}

export default function DailySummaryAccordion({
  totals,
  goals,
  userSettings,
}: DailySummaryAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        data-testid="daily-summary-accordion-button"
      >
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Daily Summary
        </h2>
        <svg
          className={`w-5 h-5 text-black dark:text-zinc-50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-250 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse bg-white dark:bg-black">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                  Nutrient
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                  Goal
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                  Left
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Calories
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-calories"
                >
                  {getCalorieForDisplay(
                    totals.calories,
                    userSettings.calorieUnit,
                  )}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-calories"
                >
                  {getCalorieForDisplay(
                    goals.calories,
                    userSettings.calorieUnit,
                  )}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-calories"
                >
                  {getCalorieForDisplay(
                    goals.calories - totals.calories,
                    userSettings.calorieUnit,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Protein
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-protein"
                >
                  {getWeightForDisplay(totals.protein, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-protein"
                >
                  {getWeightForDisplay(goals.protein, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-protein"
                >
                  {getWeightForDisplay(
                    goals.protein - totals.protein,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Carbohydrates
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-carbs"
                >
                  {getWeightForDisplay(totals.carbs, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-carbs"
                >
                  {getWeightForDisplay(goals.carbs, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-carbs"
                >
                  {getWeightForDisplay(
                    goals.carbs - totals.carbs,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Fat
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-fat"
                >
                  {getWeightForDisplay(totals.fat, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-fat"
                >
                  {getWeightForDisplay(goals.fat, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-fat"
                >
                  {getWeightForDisplay(
                    goals.fat - totals.fat,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Saturates
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-saturates"
                >
                  {getWeightForDisplay(
                    totals.saturates,
                    userSettings.weightUnit,
                  )}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-saturates"
                >
                  {getWeightForDisplay(
                    goals.saturates,
                    userSettings.weightUnit,
                  )}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-saturates"
                >
                  {getWeightForDisplay(
                    goals.saturates - totals.saturates,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Sugars
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-sugars"
                >
                  {getWeightForDisplay(totals.sugars, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-sugars"
                >
                  {getWeightForDisplay(goals.sugars, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-sugars"
                >
                  {getWeightForDisplay(
                    goals.sugars - totals.sugars,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Fibre
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-fibre"
                >
                  {getWeightForDisplay(totals.fibre, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-fibre"
                >
                  {getWeightForDisplay(goals.fibre, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-fibre"
                >
                  {getWeightForDisplay(
                    goals.fibre - totals.fibre,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Salt
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-total-salt"
                >
                  {getWeightForDisplay(totals.salt, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-goal-salt"
                >
                  {getWeightForDisplay(goals.salt, userSettings.weightUnit)}
                </td>
                <td
                  className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                  data-testid="summary-left-salt"
                >
                  {getWeightForDisplay(
                    goals.salt - totals.salt,
                    userSettings.weightUnit,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
