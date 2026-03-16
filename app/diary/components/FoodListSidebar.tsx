"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FoodItem, MeasurementType } from "../types";
import {
  getCalorieForDisplay,
  getVolumeForDisplay,
  getWeightForDisplay,
} from "@/lib/unitConversions";
import HelpButton from "../../components/HelpButton";
import SearchInput from "../../components/SearchInput";
import DataTableShell from "../../components/DataTableShell";
import EditFoodSidebar from "./EditFoodSidebar";
import { UserSettings } from "../../settings/types";
import { Food } from "@prisma/client";
import { FoodWithCreator } from "../../api/admin/foods/route";

interface FoodListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, serving: number) => void;
  onOpenCreateForm: () => void;
  isLoading?: boolean;
  userSettings: UserSettings;
}

const PAGE_SIZE = 50;

const mapFood = (food: FoodWithCreator): FoodItem => ({
  id: food.id,
  name: food.name,
  measurementAmount: food.measurementAmount,
  measurementType: food.measurementType as MeasurementType,
  calories: food.calories,
  baseCalories: food.calories,
  serving: 1,
  protein: food.protein,
  carbs: food.carbs,
  fat: food.fat,
  saturates: food.saturates ?? 0,
  sugars: food.sugars ?? 0,
  fibre: food.fibre ?? 0,
  salt: food.salt ?? 0,
  baseProtein: food.protein,
  baseCarbs: food.carbs,
  baseFat: food.fat,
  baseSaturates: food.saturates ?? 0,
  baseSugars: food.sugars ?? 0,
  baseFibre: food.fibre ?? 0,
  baseSalt: food.salt ?? 0,
  defaultServingAmount: food.defaultServingAmount,
  defaultServingDescription: food.defaultServingDescription,
  createdByName: food.createdByName,
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
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
          if (process.env.NODE_ENV === "development")
            console.error("Failed to fetch foods");
          return;
        }
        const data = (await res.json()) as {
          foods: Food[];
          total: number;
          suggestions?: string[];
        };
        const mapped = (data.foods || []).map(mapFood);
        setFoods((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(data.total ?? 0);
        if (!append) {
          setSuggestions(data.suggestions ?? []);
        }
        setHasLoaded(true);
      } catch (err) {
        if (process.env.NODE_ENV === "development")
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

  const handleClose = () => {
    setSearchQuery("");
    setSuggestions([]);
    setFoods([]);
    setTotal(0);
    setHasLoaded(false);
    onClose();
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setShowEditForm(true);
  };

  const applyServingChange = async (serving: number) => {
    if (!selectedFood) return;
    // 'serving' here is actually the number of base servings (e.g., 5), but DiaryClient expects total amount (e.g., 350g)
    // So calculate total amount
    const totalAmount = serving * selectedFood.measurementAmount;
    onSelectFood(selectedFood, totalAmount);
    setShowEditForm(false);
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
          data-testid="food-list-sidebar-back-button"
        >
          Back
        </button>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Select Food
          </h2>
          <HelpButton
            title="Select Food"
            content="Search for a food to add to your meal. Use the search bar to find foods by name. You can also create custom foods if you don't find what you're looking for. Select a food and adjust the quantity before adding it to your meal."
            ariaLabel="Help: How to select and add food"
          />
        </div>
        <div className="w-12" />
      </div>

      <div className="p-4 overflow-hidden">
        <div className="mx-auto w-full max-w-3xl h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden flex flex-col">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            showSuggestions={
              !isFetching && hasLoaded && foods.length === 0 && !!searchQuery
            }
            suggestions={suggestions}
            onSuggestionClick={setSearchQuery}
            data-testid="food-list-search"
          />

          <DataTableShell
            scrollRef={scrollRef}
            onScroll={handleScroll}
            containerClassName="overflow-y-auto relative"
            overlay={
              isLoading ? (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                  <div className="text-sm text-zinc-700 dark:text-zinc-300">
                    Adding food...
                  </div>
                </div>
              ) : undefined
            }
            loadingNode={
              isFetching ? (
                <div className="px-4 py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Loading...
                </div>
              ) : undefined
            }
            emptyNode={
              !isFetching && hasLoaded && foods.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p
                    className="text-sm text-zinc-500 dark:text-zinc-400 mb-3"
                    data-testid="no-foods-found"
                  >
                    No foods found{searchQuery ? ` for "${searchQuery}"` : ""}
                  </p>
                  <button
                    onClick={onOpenCreateForm}
                    className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                    data-testid="create-food-button"
                  >
                    Create Food
                  </button>
                </div>
              ) : undefined
            }
            footerNode={
              !isFetching && foods.length > 0 && foods.length >= total ? (
                <div className="px-4 py-4 text-center">
                  <button
                    onClick={onOpenCreateForm}
                    className="rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                    data-testid="create-food-button"
                  >
                    Create Food
                  </button>
                </div>
              ) : undefined
            }
          >
            {foods.map((food) => (
              <div
                key={food.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                onClick={() => handleSelectFood(food)}
                data-testid={`food-item-${food.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-black dark:text-zinc-50">
                    {food.name}
                  </p>
                  {(() => {
                    const actualAmount = food.serving * food.measurementAmount;
                    const amountStr =
                      food.measurementType === "weight"
                        ? getWeightForDisplay(
                            actualAmount,
                            userSettings.weightUnit,
                            0,
                          )
                        : getVolumeForDisplay(
                            actualAmount,
                            userSettings.volumeUnit,
                            0,
                          );
                    return (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {amountStr} -{" "}
                        {getCalorieForDisplay(
                          food.calories,
                          userSettings.calorieUnit,
                        )}
                      </p>
                    );
                  })()}
                </div>
              </div>
            ))}
          </DataTableShell>
        </div>
      </div>
      <EditFoodSidebar
        isOpen={showEditForm}
        food={selectedFood}
        onClose={() => {
          setShowEditForm(false);
        }}
        onSubmit={applyServingChange}
        userSettings={userSettings}
        isAdd
      />
    </div>
  );
}
