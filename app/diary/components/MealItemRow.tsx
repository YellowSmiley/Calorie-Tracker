"use client";

import { FoodItem } from "../types";
import { UserSettings } from "@/app/settings/types";
import {
  getCalorieForDisplay,
  getVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";

interface MealItemRowProps {
  item: FoodItem;
  mealIndex: number;
  userSettings: UserSettings;
  onEdit: (mealIndex: number, itemId: string) => void;
  onRemove: (mealIndex: number, itemId: string) => void;
}

export default function MealItemRow({
  item,
  mealIndex,
  userSettings,
  onEdit,
  onRemove,
}: MealItemRowProps) {
  const actualAmount = item.serving * item.measurementAmount;
  const amountStr =
    item.measurementType === "weight"
      ? getWeightForDisplay(actualAmount, userSettings.weightUnit)
      : getVolumeForDisplay(actualAmount, userSettings.volumeUnit);

  const servingDescription = (() => {
    if (!item.defaultServingDescription || !item.defaultServingAmount) {
      return amountStr;
    }

    const servingQty = Number(
      (actualAmount / item.defaultServingAmount).toFixed(1),
    );
    const qtyStr =
      servingQty === 1
        ? item.defaultServingDescription
        : `${servingQty} × ${item.defaultServingDescription}`;

    return `${amountStr} (${qtyStr})`;
  })();

  return (
    <tr
      key={item.id}
      data-testid={`diary-food-row-${item.id}`}
      onClick={() => onEdit(mealIndex, item.id)}
      className="cursor-pointer border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
    >
      <td className="px-4 py-3" data-testid={`diary-food-name-${item.id}`}>
        <p className="text-black dark:text-zinc-50 font-medium">{item.name}</p>
        <p
          className="text-sm text-zinc-500 dark:text-zinc-400"
          data-testid={`diary-food-serving-${item.id}`}
        >
          {servingDescription}
        </p>
      </td>
      <td className="px-4 py-3" data-testid={`diary-food-calories-${item.id}`}>
        <p
          className="text-sm text-zinc-500 dark:text-zinc-400"
          data-testid={`diary-food-calorie-info-${item.id}`}
        >
          {getCalorieForDisplay(item.calories, userSettings.calorieUnit)}
        </p>
      </td>
      <td className="px-4 py-3">
        <button
          onClick={(event) => {
            event.stopPropagation();
            onRemove(mealIndex, item.id);
          }}
          className="ct-button-danger-subtle rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          data-testid={`diary-food-remove-${item.id}`}
        >
          Remove
        </button>
      </td>
    </tr>
  );
}
