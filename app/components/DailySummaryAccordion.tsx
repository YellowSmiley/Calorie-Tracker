"use client";

import { useState } from "react";
import { formatCalories, formatMacro, formatSalt } from "@/lib/unitConversions";

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
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
  };
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
        className="w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
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
          isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"
        }`}
      >
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full border-collapse bg-white dark:bg-zinc-950">
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
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCalories(totals.calories, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCalories(goals.calories, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatCalories(
                    goals.calories - totals.calories,
                    userSettings,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Protein
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(totals.protein, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.protein, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.protein - totals.protein, userSettings)}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Carbohydrates
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(totals.carbs, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.carbs, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.carbs - totals.carbs, userSettings)}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Fat
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(totals.fat, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.fat, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.fat - totals.fat, userSettings)}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Saturates
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(totals.saturates, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.saturates, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(
                    goals.saturates - totals.saturates,
                    userSettings,
                  )}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Sugars
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(totals.sugars, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.sugars, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.sugars - totals.sugars, userSettings)}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Fibre
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(totals.fibre, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.fibre, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatMacro(goals.fibre - totals.fibre, userSettings)}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Salt
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatSalt(totals.salt, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatSalt(goals.salt, userSettings)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatSalt(goals.salt - totals.salt, userSettings)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
