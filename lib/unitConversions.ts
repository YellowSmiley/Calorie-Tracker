// All values are stored in the database as kcal and grams
// These functions convert for display based on user preferences

interface UserSettings {
    calorieUnit: string;
    macroUnit: string;
}

// Calorie conversions (stored as kcal)
export function convertCaloriesForDisplay(
    kcalValue: number,
    targetUnit: string
): number {
    switch (targetUnit) {
        case "cal":
            return kcalValue * 1000;
        case "Cal": // Same as kcal
        case "kcal":
        default:
            return kcalValue;
    }
}

export function convertCaloriesFromInput(
    inputValue: number,
    inputUnit: string
): number {
    switch (inputUnit) {
        case "cal":
            return inputValue / 1000;
        case "Cal": // Same as kcal
        case "kcal":
        default:
            return inputValue;
    }
}

// Macro conversions (stored as grams)
export function convertMacroForDisplay(
    gramsValue: number,
    targetUnit: string
): number {
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
    inputValue: number,
    inputUnit: string
): number {
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
    kcalValue: number,
    settings: UserSettings
): string {
    const converted = convertCaloriesForDisplay(kcalValue, settings.calorieUnit);
    return `${Math.round(converted)} ${settings.calorieUnit}`;
}

export function formatMacro(
    gramsValue: number,
    settings: UserSettings
): string {
    const converted = convertMacroForDisplay(gramsValue, settings.macroUnit);
    const formatted =
        settings.macroUnit === "mg"
            ? Math.round(converted)
            : Math.round(converted * 10) / 10;
    return `${formatted}${settings.macroUnit}`;
}
