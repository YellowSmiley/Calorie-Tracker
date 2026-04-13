"use client";

import NutritionSummaryAccordion from "./NutritionSummaryAccordion";
import { type NutritionTotals } from "@/lib/nutritionSummary";
import { UserSettings } from "../../settings/types";

interface DailySummaryAccordionProps {
  totals: NutritionTotals;
  goals: NutritionTotals;
  userSettings: Omit<UserSettings, "volumeUnit">;
}

export default function DailySummaryAccordion({
  totals,
  goals,
  userSettings,
}: DailySummaryAccordionProps) {
  return (
    <NutritionSummaryAccordion
      title="Daily Summary"
      totals={totals}
      goals={goals}
      userSettings={userSettings}
      testIdPrefix="summary"
      className="mb-8"
    />
  );
}
