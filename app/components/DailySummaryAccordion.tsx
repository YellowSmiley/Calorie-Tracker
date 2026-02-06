"use client";

import { useState } from "react";

interface DailySummaryAccordionProps {
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function DailySummaryAccordion({
  totals,
  goals,
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
                  {Math.round(totals.calories)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {goals.calories}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(goals.calories - totals.calories)}
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Protein
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(totals.protein)}g
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {goals.protein}g
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(goals.protein - totals.protein)}g
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Carbohydrates
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(totals.carbs)}g
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {goals.carbs}g
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(goals.carbs - totals.carbs)}g
                </td>
              </tr>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                  Fat
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(totals.fat)}g
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {goals.fat}g
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round(goals.fat - totals.fat)}g
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
