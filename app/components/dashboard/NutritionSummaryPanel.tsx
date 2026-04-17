"use client";

import {
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import {
  AcceptedBodyWeightUnits,
  AcceptedCalorieUnits,
  AcceptedWeightedUnits,
} from "@/app/settings/types";
import DashboardPanel from "./DashboardPanel";
import DashboardSegmentedControl from "./DashboardSegmentedControl";
import NutritionMetricCard from "./NutritionMetricCard";
import LoadingSpinner from "@/app/components/LoadingSpinner";

type TimeRange = "day" | "week" | "month";

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
}

interface NutritionSummaryPanelProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  totals: NutritionTotals;
  userGoals: NutritionTotals;
  userSettings: {
    calorieUnit: AcceptedCalorieUnits;
    weightUnit: AcceptedWeightedUnits;
    bodyWeightUnit?: AcceptedBodyWeightUnits;
  };
  isLoading: boolean;
}

const SUMMARY_RANGE_OPTIONS = [
  { value: "day", label: "Day", testId: "dashboard-period-day" },
  { value: "week", label: "Week", testId: "dashboard-period-week" },
  { value: "month", label: "Month", testId: "dashboard-period-month" },
] as const;

type NutritionMetricConfig = {
  key: keyof NutritionTotals;
  label: string;
  accentClassName: string;
  totalTestId: string;
  avgTestId: string;
  goalTestId: string;
  progressTestId?: string;
  format: "calorie" | "macro";
};

const NUTRITION_METRICS: readonly NutritionMetricConfig[] = [
  {
    key: "calories",
    label: "Calories",
    accentClassName: "bg-zinc-800 dark:bg-zinc-400",
    totalTestId: "dashboard-total-calories",
    avgTestId: "avg-calories",
    goalTestId: "goal-calories",
    format: "calorie",
  },
  {
    key: "protein",
    label: "Protein",
    accentClassName: "bg-zinc-700 dark:bg-zinc-500",
    totalTestId: "dashboard-total-protein",
    avgTestId: "avg-protein",
    goalTestId: "goal-protein",
    format: "macro",
  },
  {
    key: "carbs",
    label: "Carbohydrates",
    accentClassName: "bg-zinc-600 dark:bg-zinc-600",
    totalTestId: "dashboard-total-carbs",
    avgTestId: "avg-carbs",
    goalTestId: "goal-carbs",
    format: "macro",
  },
  {
    key: "fat",
    label: "Fat",
    accentClassName: "bg-zinc-500 dark:bg-zinc-700",
    totalTestId: "dashboard-total-fat",
    avgTestId: "avg-fat",
    goalTestId: "goal-fat",
    format: "macro",
  },
  {
    key: "saturates",
    label: "Saturates",
    accentClassName: "bg-zinc-700 dark:bg-zinc-500",
    totalTestId: "dashboard-total-saturates",
    avgTestId: "avg-saturates",
    goalTestId: "goal-saturates",
    format: "macro",
  },
  {
    key: "sugars",
    label: "Sugars",
    accentClassName: "bg-zinc-700 dark:bg-zinc-500",
    totalTestId: "dashboard-total-sugars",
    avgTestId: "avg-sugars",
    goalTestId: "goal-sugars",
    progressTestId: "dashboard-progress-sugars",
    format: "macro",
  },
  {
    key: "fibre",
    label: "Fibre",
    accentClassName: "bg-zinc-700 dark:bg-zinc-500",
    totalTestId: "dashboard-total-fibre",
    avgTestId: "avg-fibre",
    goalTestId: "goal-fibre",
    format: "macro",
  },
  {
    key: "salt",
    label: "Salt",
    accentClassName: "bg-zinc-700 dark:bg-zinc-500",
    totalTestId: "dashboard-total-salt",
    avgTestId: "avg-salt",
    goalTestId: "goal-salt",
    format: "macro",
  },
] as const;

export default function NutritionSummaryPanel({
  timeRange,
  onTimeRangeChange,
  selectedDate,
  onDateChange,
  totals,
  userGoals,
  userSettings,
  isLoading,
}: NutritionSummaryPanelProps) {
  const getDaysInMonth = () => {
    const date = new Date(selectedDate);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getGoalMultiplier = () => {
    if (timeRange === "day") return 1;
    if (timeRange === "week") return 7;
    return getDaysInMonth();
  };

  const getDailyAverage = (total: number) => total / getGoalMultiplier();

  const getDateRangeLabel = () => {
    const date = new Date(selectedDate);

    if (timeRange === "day") {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (timeRange === "week") {
      const weekStart = new Date(date);
      const dayOfWeek = date.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(date.getDate() - daysFromMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return `${weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${weekEnd.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`;
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const handlePreviousDate = () => {
    const date = new Date(selectedDate);
    if (timeRange === "day") {
      date.setDate(date.getDate() - 1);
    } else if (timeRange === "week") {
      date.setDate(date.getDate() - 7);
    } else {
      date.setMonth(date.getMonth() - 1);
    }
    onDateChange(date.toISOString().split("T")[0]);
  };

  const handleNextDate = () => {
    const date = new Date(selectedDate);
    if (timeRange === "day") {
      date.setDate(date.getDate() + 1);
    } else if (timeRange === "week") {
      date.setDate(date.getDate() + 7);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    onDateChange(date.toISOString().split("T")[0]);
  };

  const formatMetricValue = (metric: NutritionMetricConfig, value: number) => {
    if (metric.format === "calorie") {
      return getCalorieForDisplay(value, userSettings.calorieUnit);
    }
    return getWeightForDisplay(value, userSettings.weightUnit);
  };

  return (
    <DashboardPanel
      title="Nutrition Summary"
      helpTitle="Nutrition Summary"
      helpContent={
        <>
          <p>Each card shows current intake vs. your daily goal.</p>
          <p>Progress bars indicate how close you are to each target.</p>
          <p>
            Switch between day, week, and month to review totals while keeping
            the same date anchor.
          </p>
        </>
      }
      helpAriaLabel="Help: Nutrition summary explained"
      actions={
        <DashboardSegmentedControl<TimeRange>
          value={timeRange}
          options={SUMMARY_RANGE_OPTIONS}
          onChange={onTimeRangeChange}
          isLoading={isLoading}
          fullWidthOnMobile
        />
      }
    >
      <div className="mb-6 space-y-3">
        <div className="overflow-hidden text-center">
          <p
            className={`text-sm font-medium text-zinc-700 transition-all duration-300 dark:text-zinc-300 ${
              timeRange !== "day" ? "max-h-6 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            {getDateRangeLabel()}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:flex-nowrap">
          <button
            type="button"
            onClick={handlePreviousDate}
            disabled={isLoading}
            className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            disabled={isLoading}
            className="min-w-40 cursor-pointer rounded-lg border border-zinc-200 bg-white px-4 py-2 text-center text-black scheme-light dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:scheme-dark"
          />

          <button
            type="button"
            onClick={handleNextDate}
            disabled={isLoading}
            className="rounded-lg p-2 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <LoadingSpinner className="h-3.5 w-3.5" />
            <span>Updating dashboard...</span>
          </div>
        )}
      </div>

      <div
        className={[
          "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4",
          isLoading ? "opacity-50" : "",
        ].join(" ")}
      >
        {NUTRITION_METRICS.map((metric) => {
          const totalValue = totals[metric.key];
          const goalValue = userGoals[metric.key] * getGoalMultiplier();
          const averageValue = getDailyAverage(totalValue);
          const progressPercent = Math.min(
            (totalValue / Math.max(goalValue, 1)) * 100,
            100,
          );

          return (
            <NutritionMetricCard
              key={metric.key}
              label={metric.label}
              value={formatMetricValue(metric, totalValue)}
              goal={formatMetricValue(metric, goalValue)}
              average={`Avg: ${formatMetricValue(metric, averageValue)}/day`}
              showAverage={timeRange !== "day"}
              progressPercent={progressPercent}
              accentClassName={metric.accentClassName}
              totalTestId={metric.totalTestId}
              averageTestId={metric.avgTestId}
              goalTestId={metric.goalTestId}
              progressTestId={metric.progressTestId}
            />
          );
        })}
      </div>
    </DashboardPanel>
  );
}
