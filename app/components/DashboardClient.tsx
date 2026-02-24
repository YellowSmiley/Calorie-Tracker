"use client";

import { useState, useEffect } from "react";
import {
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import HelpButton from "@/app/components/HelpButton";
import { UserSettings } from "../settings/types";

type TimeRange = "day" | "week" | "month";

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

export default function DashboardClient({
  userName,
  userSettings,
  userGoals,
  initialTotals,
}: DashboardClientProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("day");
  const [totals, setTotals] = useState(initialTotals);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Calculate days in the selected month
  const getDaysInMonth = () => {
    const date = new Date(selectedDate);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // Get goal multiplier based on time range
  const getGoalMultiplier = () => {
    if (timeRange === "day") return 1;
    if (timeRange === "week") return 7;
    return getDaysInMonth(); // month
  };

  // Calculate daily average for week/month views
  const getDailyAverage = (total: number) => {
    return total / getGoalMultiplier();
  };

  useEffect(() => {
    fetchTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, selectedDate]);

  const fetchTotals = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        range: timeRange,
        date: selectedDate,
      });
      const response = await fetch(`/api/dashboard?${params}`);
      if (response.ok) {
        const data = (await response.json()) as {
          totals: DashboardClientProps["initialTotals"];
        };
        setTotals(data.totals);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("Error fetching totals:", error);
    } finally {
      setIsLoading(false);
    }
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
    setSelectedDate(date.toISOString().split("T")[0]);
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
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const getDateRangeLabel = () => {
    const date = new Date(selectedDate);
    if (timeRange === "day") {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else if (timeRange === "week") {
      const weekStart = new Date(date);
      const dayOfWeek = date.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(date.getDate() - daysFromMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              Dashboard
            </h1>
            <HelpButton
              title="Dashboard Overview"
              content="Your Dashboard provides a snapshot of your nutrition intake. Use the View Period selector to switch between daily, weekly, and monthly views. Each card shows your current intake vs. your goals, with progress bars to visualize how close you are to reaching them. Adjust your goals in Settings to see changes reflected here."
              ariaLabel="Help: Dashboard overview"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 pb-24">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
            <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-2">
              Welcome, {userName}!
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track your daily calorie intake and macronutrients to reach your
              health goals.
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                  View Period
                </h3>
                <HelpButton
                  title="View Period"
                  content="Choose between Day, Week, or Month to view your nutrition totals. Week view shows daily averages (week total ÷ 7), and month view shows daily averages (month total ÷ number of days)."
                  ariaLabel="Help: View period explained"
                />
              </div>
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeRange("day")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === "day"
                      ? "bg-foreground text-background"
                      : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  Day
                </button>
                <button
                  onClick={() => setTimeRange("week")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === "week"
                      ? "bg-foreground text-background"
                      : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeRange("month")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    timeRange === "month"
                      ? "bg-foreground text-background"
                      : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="space-y-3">
              {/* Date Range Label */}
              <div className="text-center overflow-hidden">
                <p
                  className={`text-sm font-medium text-zinc-700 dark:text-zinc-300 transition-all duration-300 ${
                    timeRange !== "day"
                      ? "opacity-100 max-h-6"
                      : "opacity-0 max-h-0"
                  }`}
                >
                  {getDateRangeLabel()}
                </p>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePreviousDate}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
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
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 text-center cursor-pointer scheme-light dark:scheme-dark"
                  style={{ minWidth: "160px" }}
                />

                <button
                  onClick={handleNextDate}
                  className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors shrink-0"
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
            </div>
          </div>

          {/* Totals Grid */}
          <div
            className={`rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6 ${
              isLoading ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-black dark:text-zinc-50">
                Nutrition Summary
              </h3>
              <HelpButton
                title="Nutrition Summary"
                content="Each card shows your current intake vs. daily goal. The progress bar indicates how close you are to your goal (full = 100%). On week/month view, shown values are averages per day. Adjust goals in Settings."
                ariaLabel="Help: Nutrition summary explained"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Calories */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Calories
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-calories"
                >
                  {getCalorieForDisplay(
                    totals.calories,
                    userSettings.calorieUnit,
                  )}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-calories"
                  >
                    Avg:{" "}
                    {getCalorieForDisplay(
                      getDailyAverage(totals.calories),
                      userSettings.calorieUnit,
                    )}
                    /day
                  </p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Goal:{" "}
                  <span data-testid="goal-calories">
                    {getCalorieForDisplay(
                      userGoals.calories * getGoalMultiplier(),
                      userSettings.calorieUnit,
                    )}
                  </span>
                </p>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-800 dark:bg-zinc-400 transition-all"
                    style={{
                      width: `${Math.min((totals.calories / (userGoals.calories * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Protein */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Protein
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-protein"
                >
                  {getWeightForDisplay(totals.protein, userSettings.weightUnit)}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-protein"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.protein),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Goal:{" "}
                  <span data-testid="goal-protein">
                    {getWeightForDisplay(
                      userGoals.protein * getGoalMultiplier(),
                      userSettings.weightUnit,
                    )}
                  </span>
                </p>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 dark:bg-zinc-500 transition-all"
                    style={{
                      width: `${Math.min((totals.protein / (userGoals.protein * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Carbs */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Carbohydrates
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-carbs"
                >
                  {getWeightForDisplay(totals.carbs, userSettings.weightUnit)}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-carbs"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.carbs),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Goal:{" "}
                  <span data-testid="goal-carbs">
                    {getWeightForDisplay(
                      userGoals.carbs * getGoalMultiplier(),
                      userSettings.weightUnit,
                    )}
                  </span>
                </p>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-600 dark:bg-zinc-600 transition-all"
                    style={{
                      width: `${Math.min((totals.carbs / (userGoals.carbs * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fat */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Fat
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-fat"
                >
                  {getWeightForDisplay(totals.fat, userSettings.weightUnit)}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-fat"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.fat),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Goal:{" "}
                  <span data-testid="goal-fat">
                    {getWeightForDisplay(
                      userGoals.fat * getGoalMultiplier(),
                      userSettings.weightUnit,
                    )}
                  </span>
                </p>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-500 dark:bg-zinc-700 transition-all"
                    style={{
                      width: `${Math.min((totals.fat / (userGoals.fat * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Saturates */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Saturates
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-saturates"
                >
                  {getWeightForDisplay(
                    totals.saturates,
                    userSettings.weightUnit,
                  )}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-saturates"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.saturates),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    Goal:{" "}
                    <span data-testid="goal-saturates">
                      {getWeightForDisplay(
                        userGoals.saturates * getGoalMultiplier(),
                        userSettings.weightUnit,
                      )}
                    </span>
                  </p>
                </div>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 dark:bg-zinc-500 transition-all"
                    style={{
                      width: `${Math.min((totals.saturates / (userGoals.saturates * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sugars */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Sugars
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-sugars"
                >
                  {getWeightForDisplay(totals.sugars, userSettings.weightUnit)}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-sugars"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.sugars),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    Goal:{" "}
                    <span data-testid="goal-sugars">
                      {getWeightForDisplay(
                        userGoals.sugars * getGoalMultiplier(),
                        userSettings.weightUnit,
                      )}
                    </span>
                  </p>
                </div>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 dark:bg-zinc-500 transition-all"
                    data-testid="dashboard-progress-sugars"
                    style={{
                      width: `${Math.min((totals.sugars / (userGoals.sugars * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fibre */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Fibre
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-fibre"
                >
                  {getWeightForDisplay(totals.fibre, userSettings.weightUnit)}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-fibre"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.fibre),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    Goal:{" "}
                    <span data-testid="goal-fibre">
                      {getWeightForDisplay(
                        userGoals.fibre * getGoalMultiplier(),
                        userSettings.weightUnit,
                      )}
                    </span>
                  </p>
                </div>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 dark:bg-zinc-500 transition-all"
                    style={{
                      width: `${Math.min((totals.fibre / (userGoals.fibre * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Salt */}
              <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                  Salt
                </p>
                <p
                  className="text-2xl font-bold text-black dark:text-zinc-50"
                  data-testid="dashboard-total-salt"
                >
                  {getWeightForDisplay(totals.salt, userSettings.weightUnit)}
                </p>
                <div className="overflow-hidden">
                  <p
                    className={`text-xs text-zinc-600 dark:text-zinc-300 transition-all duration-300 ${
                      timeRange !== "day"
                        ? "opacity-100 max-h-6 mt-1"
                        : "opacity-0 max-h-0 mt-0"
                    }`}
                    data-testid="avg-salt"
                  >
                    Avg:{" "}
                    {getWeightForDisplay(
                      getDailyAverage(totals.salt),
                      userSettings.weightUnit,
                    )}
                    /day
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                    Goal:{" "}
                    <span data-testid="goal-salt">
                      {getWeightForDisplay(
                        userGoals.salt * getGoalMultiplier(),
                        userSettings.weightUnit,
                      )}
                    </span>
                  </p>
                </div>
                <div className="mt-2 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-700 dark:bg-zinc-500 transition-all"
                    style={{
                      width: `${Math.min((totals.salt / (userGoals.salt * getGoalMultiplier())) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
