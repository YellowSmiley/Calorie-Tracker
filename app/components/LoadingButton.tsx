"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingLabel?: string;
  spinnerClassName?: string;
  children: ReactNode;
}

export default function LoadingButton({
  isLoading = false,
  loadingLabel,
  spinnerClassName,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={className}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {isLoading && <LoadingSpinner className={spinnerClassName} />}
        <span>{isLoading ? loadingLabel || children : children}</span>
      </span>
    </button>
  );
}
