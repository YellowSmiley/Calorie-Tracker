"use client";

interface ValidatedNumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  dataTestId?: string;
  min?: string;
  step?: string;
  required?: boolean;
  labelClassName?: string;
  inputClassName?: string;
}

export default function ValidatedNumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  dataTestId,
  min = "0",
  step = "any",
  required = false,
  labelClassName,
  inputClassName,
}: ValidatedNumberFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        className={
          labelClassName ||
          "block text-sm font-semibold text-black dark:text-zinc-50 mb-2"
        }
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`${
          inputClassName ||
          "w-full border rounded-lg px-4 py-3 bg-transparent text-black dark:text-zinc-50 text-lg font-medium text-center"
        } ${
          error
            ? "border-red-500 dark:border-red-500"
            : "border-zinc-200 dark:border-zinc-700"
        }`}
        placeholder={placeholder}
        data-testid={dataTestId}
        required={required}
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
