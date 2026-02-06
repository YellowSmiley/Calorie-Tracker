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
    baseProtein: number;
    baseCarbs: number;
    baseFat: number;
}

export interface Meal {
    name: string;
    items: FoodItem[];
}
