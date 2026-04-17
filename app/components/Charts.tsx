"use client";

import React from "react";
import {
  convertBodyWeightForDisplay,
  convertCaloriesForDisplay,
  convertWeightForDisplay,
  getBodyWeightForDisplay,
  getCalorieForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import {
  AcceptedBodyWeightUnits,
  AcceptedCalorieUnits,
  AcceptedWeightedUnits,
} from "../settings/types";
import TrendMeasurementsAccordion from "./dashboard/TrendMeasurementsAccordion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export interface TrendPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bodyWeight: number | null;
}

interface InterpolatedTrendPoint extends TrendPoint {
  interpolatedBodyWeight: number | null;
}

interface ChartDataPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  bodyWeight: number | null;
  actualWeight: number | null;
}

type MetricKey = "calories" | "bodyWeight" | "protein" | "carbs" | "fat";

const METRIC_STROKES: Record<MetricKey, string> = {
  calories: "#f94807",
  bodyWeight: "#fa9932",
  protein: "#e43c03",
  carbs: "#fbd577",
  fat: "#fa9932",
};

interface CalorieWeightChartProps {
  points: TrendPoint[];
  calorieUnit: AcceptedCalorieUnits;
  weightUnit: AcceptedWeightedUnits;
  bodyWeightUnit: AcceptedBodyWeightUnits;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}

function interpolateWeightData(points: TrendPoint[]): InterpolatedTrendPoint[] {
  if (points.length === 0) {
    return [];
  }

  const result: InterpolatedTrendPoint[] = [];
  const weightEntryIndices = points
    .map((point, index) => (point.bodyWeight !== null ? index : -1))
    .filter((index) => index !== -1);

  if (weightEntryIndices.length === 0) {
    return points.map((point) => ({
      ...point,
      interpolatedBodyWeight: null,
    }));
  }

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const previousWeightIndex =
      weightEntryIndices.findLast((entryIndex) => entryIndex <= index) ?? -1;
    const nextWeightIndex =
      weightEntryIndices.find((entryIndex) => entryIndex >= index) ?? -1;

    let interpolatedBodyWeight: number | null = null;

    if (point.bodyWeight !== null) {
      interpolatedBodyWeight = point.bodyWeight;
    } else if (
      previousWeightIndex !== -1 &&
      nextWeightIndex !== -1 &&
      previousWeightIndex !== nextWeightIndex
    ) {
      const previousWeight = points[previousWeightIndex].bodyWeight!;
      const nextWeight = points[nextWeightIndex].bodyWeight!;
      const previousDate = new Date(
        `${points[previousWeightIndex].date}T00:00:00`,
      );
      const nextDate = new Date(`${points[nextWeightIndex].date}T00:00:00`);
      const currentDate = new Date(`${point.date}T00:00:00`);
      const totalDays = Math.max(
        1,
        (nextDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const elapsedDays = Math.max(
        0,
        (currentDate.getTime() - previousDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const progress = Math.min(1, elapsedDays / totalDays);

      interpolatedBodyWeight =
        previousWeight + (nextWeight - previousWeight) * progress;
    } else if (previousWeightIndex !== -1) {
      interpolatedBodyWeight = points[previousWeightIndex].bodyWeight!;
    } else if (nextWeightIndex !== -1) {
      interpolatedBodyWeight = points[nextWeightIndex].bodyWeight!;
    }

    result.push({
      ...point,
      interpolatedBodyWeight,
    });
  }

  return result;
}

export default function Charts({
  points,
  calorieUnit,
  weightUnit,
  bodyWeightUnit,
  calorieGoal,
  proteinGoal,
  carbGoal,
  fatGoal,
}: CalorieWeightChartProps) {
  const chartData: ChartDataPoint[] = interpolateWeightData(points).map(
    (point) => ({
      date: point.date,
      calories: convertCaloriesForDisplay(point.calories, calorieUnit),
      protein: convertWeightForDisplay(point.protein, weightUnit),
      carbs: convertWeightForDisplay(point.carbs, weightUnit),
      fat: convertWeightForDisplay(point.fat, weightUnit),
      bodyWeight:
        point.interpolatedBodyWeight === null
          ? null
          : convertBodyWeightForDisplay(
              point.interpolatedBodyWeight,
              bodyWeightUnit,
            ),
      actualWeight:
        point.bodyWeight === null
          ? null
          : convertBodyWeightForDisplay(point.bodyWeight, bodyWeightUnit),
    }),
  );

  const totalCalories = points.reduce((sum, point) => sum + point.calories, 0);
  const totalProtein = points.reduce((sum, point) => sum + point.protein, 0);
  const totalCarbs = points.reduce((sum, point) => sum + point.carbs, 0);
  const totalFat = points.reduce((sum, point) => sum + point.fat, 0);
  const averageCalories = totalCalories / Math.max(points.length, 1);
  const averageProtein = totalProtein / Math.max(points.length, 1);
  const averageCarbs = totalCarbs / Math.max(points.length, 1);
  const averageFat = totalFat / Math.max(points.length, 1);
  const maxCalories = Math.max(...points.map((point) => point.calories), 1);
  const weightValues = points
    .map((point) => point.bodyWeight)
    .filter((value): value is number => value !== null);
  const latestWeight = [...points]
    .reverse()
    .find((point) => point.bodyWeight !== null)?.bodyWeight;
  const lowestWeight = weightValues.length ? Math.min(...weightValues) : null;
  const highestWeight = weightValues.length ? Math.max(...weightValues) : null;
  const latestDataPoint = [...chartData]
    .reverse()
    .find(
      (point) =>
        point.calories > 0 ||
        point.protein > 0 ||
        point.carbs > 0 ||
        point.fat > 0 ||
        point.bodyWeight !== null,
    );

  const displayedCalorieGoal = convertCaloriesForDisplay(
    calorieGoal,
    calorieUnit,
  );
  const displayedProteinGoal = convertWeightForDisplay(proteinGoal, weightUnit);
  const displayedCarbGoal = convertWeightForDisplay(carbGoal, weightUnit);
  const displayedFatGoal = convertWeightForDisplay(fatGoal, weightUnit);

  const formatXAxis = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00`);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: chartData.length > 120 ? undefined : "numeric",
    });
  };

  const renderMetricTooltip = (
    metric: MetricKey,
    props: TooltipContentProps<ValueType, NameType>,
  ): React.ReactNode => {
    const { active, payload } = props;
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    const point = payload[0].payload;
    const dateLabel = formatXAxis(point.date);

    const valueText = (() => {
      switch (metric) {
        case "calories":
          return `Calories: ${Number(point.calories.toFixed(0))} ${calorieUnit}`;
        case "protein":
          return `Protein: ${Number(point.protein.toFixed(2))}${weightUnit}`;
        case "carbs":
          return `Carbs: ${Number(point.carbs.toFixed(2))}${weightUnit}`;
        case "fat":
          return `Fat: ${Number(point.fat.toFixed(2))}${weightUnit}`;
        case "bodyWeight":
          return `${point.actualWeight === null ? "Estimated Weight" : "Weight"}: ${point.bodyWeight === null ? "No entry" : `${Number(point.bodyWeight.toFixed(1))} ${bodyWeightUnit}`}`;
      }
    })();

    return (
      <div className="rounded-lg border border-zinc-300 bg-white p-2 shadow-lg dark:border-zinc-600 dark:bg-zinc-900">
        <p className="text-xs text-zinc-900 dark:text-zinc-100">{dateLabel}</p>
        <p className="text-xs text-zinc-900 dark:text-zinc-100">{valueText}</p>
      </div>
    );
  };

  const renderTrendPanel = (
    metric: MetricKey,
    options: {
      title: string;
      dataKey: keyof ChartDataPoint;
      stroke: string;
      goalValue?: number;
      yAxisLabel: string;
      summary: React.ReactNode;
      defaultOpen?: boolean;
      showActualWeightDots?: boolean;
    },
  ) => {
    return (
      <TrendMeasurementsAccordion
        key={metric}
        title={options.title}
        summary={options.summary}
        defaultOpen={options.defaultOpen}
      >
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              className="text-black dark:text-zinc-100 [&_text]:fill-zinc-600 dark:[&_text]:fill-zinc-400"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-zinc-200 dark:stroke-zinc-800"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatXAxis}
                tick={{ fontSize: 12 }}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: options.yAxisLabel,
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                content={(props) => renderMetricTooltip(metric, props)}
              />
              {options.goalValue !== undefined ? (
                <ReferenceLine
                  y={options.goalValue}
                  stroke={options.stroke}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              ) : null}
              <Line
                type="monotone"
                dataKey={options.dataKey}
                name={options.title}
                stroke={options.stroke}
                strokeWidth={3}
                dot={false}
                isAnimationActive={false}
                connectNulls={metric === "bodyWeight"}
              />
              {options.showActualWeightDots ? (
                <Line
                  type="monotone"
                  dataKey="actualWeight"
                  name="Logged Weight"
                  stroke="transparent"
                  legendType="none"
                  dot={{ r: 3, fill: options.stroke, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: options.stroke, strokeWidth: 0 }}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </TrendMeasurementsAccordion>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No trend data available yet.
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      role="img"
      aria-label="Calorie and body weight trend chart"
    >
      {renderTrendPanel("calories", {
        title: "Calorie Trend",
        dataKey: "calories",
        stroke: METRIC_STROKES.calories,
        goalValue: displayedCalorieGoal,
        yAxisLabel: calorieUnit,
        summary: (
          <span>
            Avg {getCalorieForDisplay(averageCalories, calorieUnit)} | Goal{" "}
            {getCalorieForDisplay(calorieGoal, calorieUnit)} | Peak{" "}
            {getCalorieForDisplay(maxCalories, calorieUnit)}
          </span>
        ),
        defaultOpen: true,
      })}

      {renderTrendPanel("bodyWeight", {
        title: "Body Weight Trend",
        dataKey: "bodyWeight",
        stroke: METRIC_STROKES.bodyWeight,
        yAxisLabel: bodyWeightUnit,
        summary: (
          <span>
            Latest{" "}
            {latestWeight === undefined
              ? "No entry"
              : getBodyWeightForDisplay(latestWeight, bodyWeightUnit)}{" "}
            | Low{" "}
            {lowestWeight === null
              ? "No entry"
              : getBodyWeightForDisplay(lowestWeight, bodyWeightUnit)}{" "}
            | High{" "}
            {highestWeight === null
              ? "No entry"
              : getBodyWeightForDisplay(highestWeight, bodyWeightUnit)}
          </span>
        ),
        showActualWeightDots: true,
      })}

      {renderTrendPanel("protein", {
        title: "Protein Trend",
        dataKey: "protein",
        stroke: METRIC_STROKES.protein,
        goalValue: displayedProteinGoal,
        yAxisLabel: weightUnit,
        summary: (
          <span>
            Avg {getWeightForDisplay(averageProtein, weightUnit)} | Goal{" "}
            {getWeightForDisplay(proteinGoal, weightUnit)} | Latest{" "}
            {getWeightForDisplay(latestDataPoint?.protein ?? 0, weightUnit)}
          </span>
        ),
      })}

      {renderTrendPanel("carbs", {
        title: "Carb Trend",
        dataKey: "carbs",
        stroke: METRIC_STROKES.carbs,
        goalValue: displayedCarbGoal,
        yAxisLabel: weightUnit,
        summary: (
          <span>
            Avg {getWeightForDisplay(averageCarbs, weightUnit)} | Goal{" "}
            {getWeightForDisplay(carbGoal, weightUnit)} | Latest{" "}
            {getWeightForDisplay(latestDataPoint?.carbs ?? 0, weightUnit)}
          </span>
        ),
      })}

      {renderTrendPanel("fat", {
        title: "Fat Trend",
        dataKey: "fat",
        stroke: METRIC_STROKES.fat,
        goalValue: displayedFatGoal,
        yAxisLabel: weightUnit,
        summary: (
          <span>
            Avg {getWeightForDisplay(averageFat, weightUnit)} | Goal{" "}
            {getWeightForDisplay(fatGoal, weightUnit)} | Latest{" "}
            {getWeightForDisplay(latestDataPoint?.fat ?? 0, weightUnit)}
          </span>
        ),
      })}
    </div>
  );
}
