"use client";

interface NutritionMetricCardProps {
  label: string;
  value: string;
  goal: string;
  average: string;
  showAverage: boolean;
  progressPercent: number;
  accentClassName: string;
  totalTestId: string;
  averageTestId: string;
  goalTestId: string;
  progressTestId?: string;
}

export default function NutritionMetricCard({
  label,
  value,
  goal,
  average,
  showAverage,
  progressPercent,
  accentClassName,
  totalTestId,
  averageTestId,
  goalTestId,
  progressTestId,
}: NutritionMetricCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <p
        className="mt-1 text-2xl font-bold text-black dark:text-zinc-50"
        data-testid={totalTestId}
      >
        {value}
      </p>

      <div className="overflow-hidden">
        <p
          className={[
            "text-xs text-zinc-600 transition-all duration-300 dark:text-zinc-300",
            showAverage ? "mt-1 max-h-6 opacity-100" : "mt-0 max-h-0 opacity-0",
          ].join(" ")}
          data-testid={averageTestId}
        >
          {average}
        </p>
      </div>

      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Goal: <span data-testid={goalTestId}>{goal}</span>
      </p>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={["h-full transition-all", accentClassName].join(" ")}
          data-testid={progressTestId}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
