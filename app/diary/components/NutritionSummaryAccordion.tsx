"use client";

import { useState } from "react";
import {
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import {
  NUTRITION_SUMMARY_FIELDS,
  type NutritionTotals,
} from "@/lib/nutritionSummary";
import { UserSettings } from "../../settings/types";
import { trackEvent } from "@/app/components/analyticsEvents";

interface NutritionSummaryAccordionProps {
  title: string;
  totals: NutritionTotals;
  userSettings: Omit<UserSettings, "volumeUnit">;
  goals?: NutritionTotals;
  testIdPrefix: string;
  className?: string;
}

export default function NutritionSummaryAccordion({
  title,
  totals,
  userSettings,
  goals,
  testIdPrefix,
  className,
}: NutritionSummaryAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatValue = (key: keyof NutritionTotals, value: number) => {
    if (key === "calories") {
      return getCalorieForDisplay(value, userSettings.calorieUnit);
    }

    return getWeightForDisplay(value, userSettings.weightUnit);
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          trackEvent("nutrition_summary_accordion_toggled", {
            title,
            isOpen: !isOpen,
          });
        }}
        className="w-full flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        data-testid={`${testIdPrefix}-accordion-button`}
      >
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          {title}
        </h2>
        <svg
          className={`w-5 h-5 text-black dark:text-zinc-50 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
                {goals && (
                  <>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                      Goal
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                      Left
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {NUTRITION_SUMMARY_FIELDS.map((field, index) => {
                const isLastRow = index === NUTRITION_SUMMARY_FIELDS.length - 1;

                return (
                  <tr
                    key={field.key}
                    className={
                      isLastRow
                        ? undefined
                        : "border-b border-zinc-200 dark:border-zinc-800"
                    }
                  >
                    <td className="px-4 py-3 text-black dark:text-zinc-50 font-medium">
                      {field.label}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                      data-testid={`${testIdPrefix}-total-${field.key}`}
                    >
                      {formatValue(field.key, totals[field.key])}
                    </td>
                    {goals && (
                      <>
                        <td
                          className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                          data-testid={`${testIdPrefix}-goal-${field.key}`}
                        >
                          {formatValue(field.key, goals[field.key])}
                        </td>
                        <td
                          className="px-4 py-3 text-sm text-black dark:text-zinc-50"
                          data-testid={`${testIdPrefix}-left-${field.key}`}
                        >
                          {formatValue(
                            field.key,
                            goals[field.key] - totals[field.key],
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
