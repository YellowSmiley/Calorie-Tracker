"use client";

import { useEffect, useState } from "react";
import HelpButton from "@/app/components/HelpButton";
import Charts, { TrendPoint } from "./Charts";
import DashboardPanel from "./dashboard/DashboardPanel";
import DashboardSegmentedControl from "./dashboard/DashboardSegmentedControl";
import NutritionSummaryPanel from "./dashboard/NutritionSummaryPanel";
import { UserSettings } from "../settings/types";

type TimeRange = "day" | "week" | "month";
type ChartDateRange = "1m" | "3m" | "6m" | "1y" | "all";

interface DashboardClientProps {
  userName: string;
  userSettings: Omit<UserSettings, "volumeUnit">;
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
  initialTotals: {
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

const CHART_RANGE_OPTIONS = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "6m", label: "6M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
] as const;

export default function DashboardClient({
  userName,
  userSettings,
  userGoals,
  initialTotals,
}: DashboardClientProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [chartDateRange, setChartDateRange] = useState<ChartDateRange>("6m");
  const [totals, setTotals] = useState(initialTotals);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedDate, chartDateRange]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: timeRange,
        date: selectedDate,
        chartRange: chartDateRange,
      });
      const response = await fetch(`/api/dashboard?${params}`);

      if (response.ok) {
        const data = (await response.json()) as {
          totals: DashboardClientProps["initialTotals"];
          trend: TrendPoint[];
        };
        setTotals(data.totals);
        setTrend(data.trend || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching totals:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const chartRangeLabel =
    chartDateRange === "all"
      ? "all available history"
      : `the last ${
          CHART_RANGE_OPTIONS.find((option) => option.value === chartDateRange)
            ?.label
        }`;

  const selectedDateLabel = new Date(
    `${selectedDate}T00:00:00`,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Dashboard
            </h1>
            <HelpButton
              title="Dashboard Overview"
              content="Your Dashboard provides a snapshot of your nutrition intake. Use the View Period selector to switch between daily, weekly, and monthly views. Each card shows your current intake vs. your goals, with progress bars to visualize how close you are to reaching them. Adjust your goals in Settings to see changes reflected here."
              ariaLabel="Help: Dashboard overview"
              data-testid="dashboard-help"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 bg-zinc-50 p-4 pb-24 dark:bg-zinc-950">
        <div className="mx-auto max-w-5xl space-y-6">
          <DashboardPanel title={`Welcome, ${userName}!`}>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track your daily calorie intake and macronutrients to reach your
              health goals.
            </p>
          </DashboardPanel>

          <NutritionSummaryPanel
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            totals={totals}
            userGoals={userGoals}
            userSettings={userSettings}
            isLoading={isLoading}
          />

          <DashboardPanel
            title="Charts & Trends"
            helpTitle="Charts & Trends"
            helpContent="The chart shows your daily calories and body weight over time. Use the selector to adjust the date range. This helps you see trends and how your intake correlates with changes in body weight."
            helpAriaLabel="Help: Trend analysis explained"
            actions={
              <DashboardSegmentedControl<ChartDateRange>
                value={chartDateRange}
                options={CHART_RANGE_OPTIONS}
                onChange={setChartDateRange}
                isLoading={isLoading}
                size="sm"
                fullWidthOnMobile
              />
            }
          >
            <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
              Showing daily calories, protein, fat, and body weight for{" "}
              {chartRangeLabel} ending on {selectedDateLabel}.
            </p>

            <Charts
              points={trend}
              calorieUnit={userSettings.calorieUnit}
              weightUnit={userSettings.weightUnit}
              bodyWeightUnit={userSettings.bodyWeightUnit ?? "kg"}
              calorieGoal={userGoals.calories}
              proteinGoal={userGoals.protein}
              carbGoal={userGoals.carbs}
              fatGoal={userGoals.fat}
            />
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
