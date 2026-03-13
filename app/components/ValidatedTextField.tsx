"use client";

interface ValidatedTextFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  maxLength?: number;
  dataTestId?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export default function ValidatedTextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  autoComplete,
  minLength,
  maxLength,
  dataTestId,
  labelClassName,
  inputClassName,
}: ValidatedTextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className={
          labelClassName ||
          "block text-sm font-medium text-black dark:text-zinc-50 mb-1"
        }
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${
          inputClassName ||
          "w-full border rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
        } ${
          error
            ? "border-red-500 dark:border-red-500"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        maxLength={maxLength}
        data-testid={dataTestId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
