"use client";

import { useEffect, useState } from "react";
import HelpButton from "@/app/components/HelpButton";
import {
  convertBodyWeightFromInput,
  getBodyWeightForDisplay,
} from "@/lib/unitConversions";
import { AcceptedBodyWeightUnits } from "@/app/settings/types";

interface BodyWeightCardProps {
  currentDate: string;
  initialBodyWeightKg: number | null;
  bodyWeightUnit: AcceptedBodyWeightUnits;
  onError: (message: string | null) => void;
}

export default function BodyWeightCard({
  currentDate,
  initialBodyWeightKg,
  bodyWeightUnit,
  onError,
}: BodyWeightCardProps) {
  const [savedBodyWeightKg, setSavedBodyWeightKg] =
    useState(initialBodyWeightKg);
  const [bodyWeightInput, setBodyWeightInput] = useState(
    initialBodyWeightKg === null
      ? ""
      : String(
          Number(
            (bodyWeightUnit === "lbs"
              ? initialBodyWeightKg * 2.20462
              : initialBodyWeightKg
            ).toFixed(1),
          ),
        ),
  );
  const [isSavingBodyWeight, setIsSavingBodyWeight] = useState(false);

  useEffect(() => {
    setSavedBodyWeightKg(initialBodyWeightKg);
    if (initialBodyWeightKg === null) {
      setBodyWeightInput("");
      return;
    }

    const converted =
      bodyWeightUnit === "lbs"
        ? initialBodyWeightKg * 2.20462
        : initialBodyWeightKg;
    setBodyWeightInput(String(Number(converted.toFixed(1))));
  }, [initialBodyWeightKg, bodyWeightUnit]);

  const handleSaveBodyWeight = async () => {
    setIsSavingBodyWeight(true);
    onError(null);

    try {
      const parsedValue = bodyWeightInput.trim()
        ? Number(bodyWeightInput)
        : null;
      if (
        parsedValue !== null &&
        (!Number.isFinite(parsedValue) || parsedValue <= 0)
      ) {
        onError("Body weight must be a positive number");
        return;
      }

      const weight =
        parsedValue === null
          ? null
          : convertBodyWeightFromInput(parsedValue, bodyWeightUnit);

      const response = await fetch("/api/body-weight", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: currentDate,
          weight,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to save body weight");
      }

      setSavedBodyWeightKg(weight);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "Failed to save body weight",
      );
    } finally {
      setIsSavingBodyWeight(false);
    }
  };

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Body Weight
        </h2>
        <HelpButton
          title="Body Weight"
          content="Log your body weight for the selected diary date. Entries are stored per day and shown on the dashboard trend chart using your preferred body weight unit from Settings."
          ariaLabel="Help: Body weight tracking"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="body-weight-input"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Weight ({bodyWeightUnit})
          </label>
          <input
            id="body-weight-input"
            type="number"
            min="0"
            step="0.1"
            value={bodyWeightInput}
            onChange={(e) => setBodyWeightInput(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            placeholder={`Enter weight in ${bodyWeightUnit}`}
            data-testid="diary-body-weight-input"
          />
        </div>
        <button
          type="button"
          onClick={handleSaveBodyWeight}
          disabled={isSavingBodyWeight}
          className="rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          data-testid="diary-body-weight-save-button"
        >
          {isSavingBodyWeight ? "Saving..." : "Save Weight"}
        </button>
      </div>
      <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        {savedBodyWeightKg === null
          ? "No weight logged for this date yet. Leave the field blank and save to clear an existing entry."
          : `Current entry: ${getBodyWeightForDisplay(savedBodyWeightKg, bodyWeightUnit)}`}
      </p>
    </div>
  );
}
