"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FoodItem } from "../diary/types";
import { formatCalories, parseMeasurement } from "@/lib/unitConversions";

interface FoodListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, quantity: number) => void;
  onOpenCreateForm: () => void;
  isLoading?: boolean;
  userSettings: {
    calorieUnit: string;
    macroUnit: string;
  };
}

const PAGE_SIZE = 50;

const mapFood = (food: {
  id: string;
  name: string;
  measurement: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  defaultServingAmount?: number | null;
  defaultServingDescription?: string | null;
}): FoodItem => ({
  id: food.id,
  name: food.name,
  measurement: food.measurement,
  calories: food.calories,
  baseCalories: food.calories,
  serving: 1,
  protein: food.protein,
  carbs: food.carbs,
  fat: food.fat,
  baseProtein: food.protein,
  baseCarbs: food.carbs,
  baseFat: food.fat,
  defaultServingAmount: food.defaultServingAmount,
  defaultServingDescription: food.defaultServingDescription,
});

export default function FoodListSidebar({
  isOpen,
  onClose,
  onSelectFood,
  onOpenCreateForm,
  isLoading = false,
  userSettings,
}: FoodListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchFoods = useCallback(
    async (search: string, skip: number, append: boolean) => {
      loadingTimerRef.current = setTimeout(() => setIsFetching(true), 100);
      try {
        const params = new URLSearchParams({
          search,
          take: String(PAGE_SIZE),
          skip: String(skip),
        });
        const res = await fetch(`/api/foods?${params}`);
        if (!res.ok) {
          console.error("Failed to fetch foods");
          return;
        }
        const data = await res.json();
        const mapped = (data.foods || []).map(mapFood);
        setFoods((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(data.total ?? 0);
        setHasLoaded(true);
      } catch (err) {
        console.error("Error fetching foods:", err);
      } finally {
        if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
        setIsFetching(false);
      }
    },
    [],
  );

  // Fetch on open
  useEffect(() => {
    if (isOpen && !hasLoaded) {
      fetchFoods("", 0, false);
    }
  }, [isOpen, hasLoaded, fetchFoods]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFoods(searchQuery, 0, false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, isOpen, fetchFoods]);

  const loadMore = useCallback(() => {
    if (isFetching || foods.length >= total) return;
    fetchFoods(searchQuery, foods.length, true);
  }, [isFetching, foods.length, total, searchQuery, fetchFoods]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      loadMore();
    }
  }, [loadMore]);

  const getQty = (foodId: string): number => {
    const raw = quantities[foodId];
    if (raw === undefined || raw === "") return 0;
    const n = parseInt(raw);
    return isNaN(n) || n < 1 ? 0 : n;
  };

  const handleClose = () => {
    setSearchQuery("");
    setQuantities({});
    setFoods([]);
    setTotal(0);
    setHasLoaded(false);
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    const qty = getQty(food.id) || 1;
    onSelectFood(food, qty);
    setSearchQuery("");
    setQuantities({});
  };

  const getServingDisplay = (food: FoodItem) => {
    const parsed = parseMeasurement(food.measurement);
    const unit = parsed.inputUnit;

    if (food.defaultServingAmount) {
      const servingRatio = food.defaultServingAmount / parsed.amount;
      const servingCals = Math.round(food.baseCalories * servingRatio);
      const desc = food.defaultServingDescription
        ? ` · ${food.defaultServingDescription}`
        : "";
      return {
        line: `${food.defaultServingAmount}${unit}${desc}`,
        calories: servingCals,
      };
    }
    return {
      line: `${parsed.amount}${unit}${parsed.description ? ` ${parsed.description}` : ""}`,
      calories: food.baseCalories,
    };
  };

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={handleClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Select Food
        </h2>
        <div className="w-12" />
      </div>

      {/* Search Box */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-3xl">
          <input
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600"
          />
        </div>
      </div>

      {/* Food List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative"
      >
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
            <div className="text-sm text-zinc-700 dark:text-zinc-300">
              Adding food...
            </div>
          </div>
        )}
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-w-3xl mx-auto">
          {foods.map((food) => (
            <div key={food.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-zinc-50">
                  {food.name}
                </p>
                {(() => {
                  const serving = getServingDisplay(food);
                  return (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {serving.line} •{" "}
                      {formatCalories(serving.calories, userSettings)}
                    </p>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-zinc-400 dark:text-zinc-500">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantities[food.id] ?? "1"}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [food.id]: e.target.value,
                    }))
                  }
                  className="w-14 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-center text-sm bg-transparent text-black dark:text-zinc-50"
                />
                <button
                  onClick={() => handleSelectFood(food)}
                  disabled={isLoading || !getQty(food.id)}
                  className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-3 py-1 text-sm font-medium text-black dark:text-zinc-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isFetching && (
            <div className="px-4 py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Loading...
            </div>
          )}

          {/* No results */}
          {!isFetching && hasLoaded && foods.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
                No foods found{searchQuery ? ` for "${searchQuery}"` : ""}
              </p>
              <button
                onClick={onOpenCreateForm}
                className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
              >
                Create Food
              </button>
            </div>
          )}

          {/* Create button at end of list */}
          {!isFetching && foods.length > 0 && foods.length >= total && (
            <div className="px-4 py-4 text-center">
              <button
                onClick={onOpenCreateForm}
                className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
              >
                Create Food
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
