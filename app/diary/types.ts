export interface FoodItem {
    id: string;
    name: string;
    measurement: string;
    calories: number;
    baseCalories: number;
    serving: number;
    protein: number;
    carbs: number;
    fat: number;
    saturates: number;
    sugars: number;
    fibre: number;
    salt: number;
    baseProtein: number;
    baseCarbs: number;
    baseFat: number;
    baseSaturates: number;
    baseSugars: number;
    baseFibre: number;
    baseSalt: number;
    defaultServingAmount?: number | null;
    defaultServingDescription?: string | null;
}

export interface Meal {
    name: string;
    items: FoodItem[];
}