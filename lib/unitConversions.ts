// All values are stored in the database as kcal and grams
// These functions convert for display based on user preferences

interface UserSettings {
    calorieUnit: string | null | undefined;
    macroUnit: string | null | undefined;
}

// Calorie conversions (stored as kcal)
export function convertCaloriesForDisplay(
    kcalValue: number | null | undefined,
    targetUnit: string | null | undefined
): number {
    if (kcalValue === null || kcalValue === undefined || !targetUnit) {
        return 0;
    }
    switch (targetUnit) {
        case "kJ":
            return kcalValue * 4.184;
        case "kcal":
        default:
            return kcalValue;
    }
}

export function convertCaloriesFromInput(
    inputValue: number | null | undefined,
    inputUnit: string | null | undefined
): number {
    if (inputValue === null || inputValue === undefined || !inputUnit) {
        return 0;
    }
    switch (inputUnit) {
        case "kJ":
            return inputValue / 4.184;
        case "kcal":
        default:
            return inputValue;
    }
}

// Macro conversions (stored as grams)
export function convertMacroForDisplay(
    gramsValue: number | null | undefined,
    targetUnit: string | null | undefined
): number {
    if (gramsValue === null || gramsValue === undefined) {
        return 0;
    }
    switch (targetUnit) {
        case "oz":
            return gramsValue * 0.035274;
        case "mg":
            return gramsValue * 1000;
        case "g":
        default:
            return gramsValue;
    }
}

export function convertMacroFromInput(
    inputValue: number | null | undefined,
    inputUnit: string
): number {
    if (inputValue === null || inputValue === undefined) {
        return 0;
    }
    switch (inputUnit) {
        case "oz":
            return inputValue / 0.035274;
        case "mg":
            return inputValue / 1000;
        case "g":
        default:
            return inputValue;
    }
}

// Format display value with unit
export function formatCalories(
    kcalValue: number | null | undefined,
    settings: UserSettings
): string {
    const converted = convertCaloriesForDisplay(kcalValue, settings.calorieUnit);
    return `${Math.round(converted)} ${settings.calorieUnit}`;
}

export function formatMacro(
    gramsValue: number | null | undefined,
    settings: UserSettings
): string {
    const converted = convertMacroForDisplay(gramsValue, settings.macroUnit);
    const formatted =
        settings.macroUnit === "mg"
            ? Math.round(converted)
            : Math.round(converted * 10) / 10;
    return `${formatted}${settings.macroUnit}`;
}

export function formatSalt(
    gramsValue: number | null | undefined,
    settings: UserSettings
): string {
    if (gramsValue === null || gramsValue === undefined) {
        return "0g";
    }
    const converted = convertMacroForDisplay(gramsValue, settings.macroUnit);
    const unit = settings.macroUnit || "g";
    return `${Number(converted.toFixed(2))}${unit}`;
}

// Parse a measurement string like "100g", "1 cup cooked", "250ml" into { amount, unit, description }
export interface ParsedMeasurement {
    amount: number;      // e.g. 100
    unit: string;        // e.g. "g", "ml", "cup", "large"
    description: string; // e.g. "cooked", "" (extra text after the unit)
    isWeight: boolean;   // g, kg, oz, lbs
    isVolume: boolean;   // ml, L, cup, tbsp, tsp
    inputLabel: string;  // user-friendly label e.g. "Weight (g)" or "Volume (ml)"
    inputUnit: string;   // the unit to show in the input e.g. "g", "ml"
}

const WEIGHT_UNITS = ["g", "kg", "oz", "lbs", "lb"];
const VOLUME_UNITS = ["ml", "l", "cup", "cups", "tbsp", "tsp", "fl oz"];

export function parseMeasurement(measurement: string): ParsedMeasurement {
    const trimmed = measurement.trim();

    // Try to match patterns like "100g", "100 g", "1 cup cooked", "250ml", "1 large"
    const match = trimmed.match(/^(\d+\.?\d*)\s*(.+)$/);

    if (!match) {
        // Fallback: treat as descriptive (e.g. "1 serving")
        return {
            amount: 1,
            unit: "serving",
            description: trimmed,
            isWeight: false,
            isVolume: false,
            inputLabel: "Servings",
            inputUnit: "serving",
        };
    }

    const amount = parseFloat(match[1]);
    const rest = match[2].trim().toLowerCase();

    // Extract the unit from the rest
    let unit = "";
    let description = "";

    // Try matching known units (longest match first to avoid "l" matching before "lbs")
    const allUnits = [...VOLUME_UNITS, ...WEIGHT_UNITS].sort((a, b) => b.length - a.length);
    for (const knownUnit of allUnits) {
        // Match unit at start, followed by end of string, space, or non-alpha char
        if (rest === knownUnit || rest.startsWith(knownUnit + " ") || rest.startsWith(knownUnit + ",")) {
            unit = knownUnit;
            description = rest.slice(knownUnit.length).trim();
            break;
        }
    }

    // If no known unit matched, take the first word
    if (!unit) {
        const parts = rest.split(/\s+/);
        unit = parts[0];
        description = parts.slice(1).join(" ");
    }

    const isWeight = WEIGHT_UNITS.includes(unit);
    const isVolume = VOLUME_UNITS.includes(unit);

    let inputLabel: string;
    let inputUnit: string;

    if (isWeight) {
        inputLabel = `Weight (${unit})`;
        inputUnit = unit;
    } else if (isVolume) {
        inputLabel = `Volume (${unit})`;
        inputUnit = unit;
    } else {
        inputLabel = `Amount (${unit})`;
        inputUnit = unit;
    }

    return { amount, unit, description, isWeight, isVolume, inputLabel, inputUnit };
}
