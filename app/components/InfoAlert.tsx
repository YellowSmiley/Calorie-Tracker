import type { ReactNode } from "react";

interface InfoAlertProps {
  title?: string;
  children: ReactNode;
  className?: string;
  dataTestId?: string;
}

export default function InfoAlert({
  title,
  children,
  className = "",
  dataTestId,
}: InfoAlertProps) {
  return (
    <div
      className={`rounded-lg border border-orange-200 bg-orange-50/70 px-3 py-2 text-orange-900 dark:border-orange-800/70 dark:bg-orange-950/35 dark:text-orange-200 ${className}`.trim()}
      data-testid={dataTestId}
      role="status"
      aria-live="polite"
    >
      {title ? (
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-950 dark:text-orange-100">
          {title}
        </p>
      ) : null}
      <div className="text-sm">{children}</div>
    </div>
  );
}