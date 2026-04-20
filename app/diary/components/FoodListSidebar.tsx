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
import InfoAlert from "../../components/InfoAlert";
import { UserSettings } from "../../settings/types";
import { Food } from "@prisma/client";
import { FoodWithCreator } from "../../api/admin/foods/route";
import { formatFoodNameForDisplay } from "@/lib/foodNameDisplay";

interface FoodListSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFood: (food: FoodItem, serving: number) => void;
  onOpenCreateForm: () => void;
  isLoading?: boolean;
  userSettings: UserSettings;
  isAdmin?: boolean;
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
  isApproved: food.isApproved,
  hasUserReported: food.hasUserReported,
  reportCount: food.reportCount,
  canUserReport: food.canUserReport,
});

export default function FoodListSidebar({
  isOpen,
  onClose,
  onSelectFood,
  onOpenCreateForm,
  isLoading = false,
  userSettings,
  isAdmin = false,
}: FoodListSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [reportingFoodId, setReportingFoodId] = useState<string | null>(null);
  const [approvingFoodId, setApprovingFoodId] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
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
          foods: Array<
            Food & {
              isApproved?: boolean;
              hasUserReported?: boolean;
              reportCount?: number;
              canUserReport?: boolean;
            }
          >;
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
      fetchFoods(searchQuery.trim(), 0, false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, isOpen, fetchFoods]);

  const loadMore = useCallback(() => {
    if (isFetching || foods.length >= total) return;
    fetchFoods(searchQuery.trim(), foods.length, true);
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

  const handleReportFood = async (foodId: string, reason?: string) => {
    setReportingFoodId(foodId);
    setReportError(null);

    try {
      const response = await fetch("/api/foods/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId, reason }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setReportError(data.error || "Failed to submit report");
        return;
      }

      setFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? {
                ...food,
                hasUserReported: true,
                reportCount: (food.reportCount ?? 0) + 1,
              }
            : food,
        ),
      );

      setSelectedFood((prev) =>
        prev && prev.id === foodId
          ? {
              ...prev,
              hasUserReported: true,
              reportCount: (prev.reportCount ?? 0) + 1,
            }
          : prev,
      );
    } catch {
      setReportError("Failed to submit report");
    } finally {
      setReportingFoodId(null);
    }
  };

  const handleApproveFood = async (
    foodId: string,
    currentlyApproved: boolean,
  ) => {
    if (!isAdmin) {
      return;
    }

    setApprovingFoodId(foodId);
    setReportError(null);

    try {
      const response = await fetch(`/api/admin/foods/${foodId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        setReportError(
          currentlyApproved ? "Failed to unapprove food" : "Failed to approve food",
        );
        return;
      }

      setFoods((prev) =>
        prev.map((food) =>
          food.id === foodId
            ? { ...food, isApproved: !currentlyApproved }
            : food,
        ),
      );

      setSelectedFood((prev) =>
        prev && prev.id === foodId
          ? { ...prev, isApproved: !currentlyApproved }
          : prev,
      );
    } catch {
      setReportError(
        currentlyApproved ? "Failed to unapprove food" : "Failed to approve food",
      );
    } finally {
      setApprovingFoodId(null);
    }
  };

  const applyServingChange = async (serving: number) => {
    if (!selectedFood) return;
    // 'serving' here is actually the number of base servings (e.g., 5), but DiaryClient expects total amount (e.g., 350g)
    // So calculate total amount
    const totalAmount = serving * selectedFood.measurementAmount;
    onSelectFood(selectedFood, totalAmount);
    setShowEditForm(false);
    setSearchQuery("");
    setSuggestions([]);
    setFoods([]);
    setTotal(0);
    setHasLoaded(false);
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
            ariaLabel="Help: How to select and add food"
          >
            <p>Step 1: Search and select a food to add to your meal.</p>
            <p>
              Step 2: In the next screen, enter serving size and quantity, then
              confirm.
            </p>
            <p>
              Approved foods are marked with an Approved badge and appear first
              in results.
            </p>
            <p>
              You can create custom foods if nothing matches, then adjust
              quantity before adding.
            </p>
            <p>
              If a food looks incorrect or inappropriate, use Report so admins
              can review it.
            </p>
          </HelpButton>
        </div>
        <div className="w-12" />
      </div>

      <div className="p-4 overflow-hidden">
        <div className="mx-auto w-full max-w-3xl h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden flex flex-col">
          <InfoAlert className="mx-4 mt-4" dataTestId="select-food-flow-alert">
            Select a food first. You will set serving size and quantity on the
            next screen.
          </InfoAlert>

          {reportError && (
            <div className="px-4 pt-4" data-testid="food-report-error">
              <div className="rounded-lg border border-zinc-300 bg-zinc-100 p-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                {reportError}
              </div>
            </div>
          )}

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
            containerClassName="overflow-y-auto"
            isLoading={isFetching || isLoading}
            loadingLabel={isLoading ? "Adding food" : "Loading foods"}
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
                    className="ct-button-primary h-10 rounded-lg px-4 text-sm font-medium transition-colors"
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
                    className="ct-button-primary h-10 rounded-lg px-4 text-sm font-medium transition-colors"
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
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                onClick={() => handleSelectFood(food)}
                data-testid={`food-item-${food.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-black dark:text-zinc-50">
                      {formatFoodNameForDisplay(food.name)}
                    </p>
                    {food.isApproved ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                        Approved
                      </span>
                    ) : null}
                  </div>
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
                {isAdmin ? (
                  <div
                    className="shrink-0"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleApproveFood(food.id, Boolean(food.isApproved))}
                      disabled={approvingFoodId === food.id}
                      className={`h-9 rounded-lg px-3 text-xs font-medium transition-colors disabled:opacity-60 ${
                        food.isApproved ? "ct-button-secondary" : "ct-button-primary"
                      }`}
                      data-testid={`add-food-list-approve-${food.id}`}
                    >
                      {approvingFoodId === food.id
                        ? food.isApproved
                          ? "Unapproving..."
                          : "Approving..."
                        : food.isApproved
                          ? "Unapprove"
                          : "Approve"}
                    </button>
                  </div>
                ) : null}
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
        onReport={handleReportFood}
        isReporting={Boolean(
          selectedFood && reportingFoodId === selectedFood.id,
        )}
        hasUserReported={Boolean(selectedFood?.hasUserReported)}
        canReport={selectedFood?.canUserReport !== false}
        userSettings={userSettings}
        isAdd
        isAdmin={isAdmin}
        onApprove={handleApproveFood}
        isApproving={Boolean(
          selectedFood && approvingFoodId === selectedFood.id,
        )}
      />
    </div>
  );
}
