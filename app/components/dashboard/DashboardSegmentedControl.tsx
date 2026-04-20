"use client";

import LoadingSpinner from "@/app/components/LoadingSpinner";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  testId?: string;
};

interface DashboardSegmentedControlProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  isLoading?: boolean;
  size?: "sm" | "md";
  fullWidthOnMobile?: boolean;
  className?: string;
}

export default function DashboardSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  isLoading = false,
  size = "md",
  fullWidthOnMobile = false,
  className,
}: DashboardSegmentedControlProps<T>) {
  const buttonSizeClasses =
    size === "sm" ? "h-9 px-3 text-xs" : "h-10 px-4 text-sm";

  return (
    <div
      className={[
        "flex flex-wrap gap-2",
        fullWidthOnMobile ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            data-testid={option.testId}
            onClick={() => onChange(option.value)}
            disabled={isLoading}
            className={[
              "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-60",
              buttonSizeClasses,
              fullWidthOnMobile ? "flex-1 sm:flex-none" : "",
              isActive
                ? "ct-button-primary"
                : "border border-solid border-black/8 text-black hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isLoading && isActive && (
              <LoadingSpinner className="h-3.5 w-3.5 mr-1.5" />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
