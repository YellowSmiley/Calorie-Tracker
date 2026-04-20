"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SearchInput from "@/app/components/SearchInput";
import DataTableShell from "@/app/components/DataTableShell";
import { getApiErrorMessage } from "@/lib/apiError";
import LoadingButton from "@/app/components/LoadingButton";
import CreateFoodSidebar, {
  CreateFoodSidebarOnSubmitData,
} from "@/app/diary/components/create-food-sidebar/CreateFoodSidebar";
import { Food } from "@prisma/client";
import DeleteFoodModal from "@/app/diary/components/DeleteFoodModal";
import type { UserSettings } from "@/app/settings/types";
import { formatFoodNameForDisplay } from "@/lib/foodNameDisplay";

type ModerationItem = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  saturates: number;
  sugars: number;
  fibre: number;
  salt: number;
  measurementAmount: number;
  measurementType: "weight" | "volume";
  defaultServingAmount?: number | null;
  defaultServingDescription?: string | null;
  createdByName: string;
  createdAt: string;
  isApproved: boolean;
  reportCount: number;
  lastReportedAt: string | null;
  reasons: string[];
};

const PAGE_SIZE = 50;
const DEFAULT_USER_SETTINGS: UserSettings = {
  calorieUnit: "kcal",
  weightUnit: "g",
  volumeUnit: "ml",
};

export default function FoodModeration() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [punishingId, setPunishingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ModerationItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ModerationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchItems = useCallback(
    async (search: string, skip: number, append: boolean) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          search,
          take: String(PAGE_SIZE),
          skip: String(skip),
        });

        const response = await fetch(`/api/admin/food-reports?${params}`);
        if (!response.ok) {
          setError(
            await getApiErrorMessage(response, "Failed to fetch reports"),
          );
          return;
        }

        const data = (await response.json()) as {
          items: ModerationItem[];
          total: number;
        };

        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
        setTotal(data.total);
      } catch {
        setError("Failed to fetch reports");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchItems(searchQuery, 0, false);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }, 600);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchItems, searchQuery]);

  const loadMore = useCallback(() => {
    if (isLoading || items.length >= total) {
      return;
    }

    fetchItems(searchQuery, items.length, true);
  }, [fetchItems, isLoading, items.length, searchQuery, total]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) {
      loadMore();
    }
  }, [loadMore]);

  const approveFood = async (foodId: string, currentlyApproved: boolean) => {
    setApprovingId(foodId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/foods/${foodId}/approve`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(
          await getApiErrorMessage(
            response,
            currentlyApproved
              ? "Failed to unapprove food"
              : "Failed to approve food",
          ),
        );
        return;
      }

      if (currentlyApproved) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === foodId ? { ...item, isApproved: false } : item,
          ),
        );
        setEditingItem((prev) =>
          prev?.id === foodId ? { ...prev, isApproved: false } : prev,
        );
      } else {
        setItems((prev) => prev.filter((item) => item.id !== foodId));
        setTotal((prev) => Math.max(prev - 1, 0));
      }
    } catch {
      setError(
        currentlyApproved
          ? "Failed to unapprove food"
          : "Failed to approve food",
      );
    } finally {
      setApprovingId(null);
    }
  };

  const punishCreator = async (foodId: string) => {
    setPunishingId(foodId);
    setError(null);

    try {
      const response = await fetch(`/api/admin/foods/${foodId}/punish`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Failed to punish user"));
        return;
      }

      await fetchItems(searchQuery, 0, false);
    } catch {
      setError("Failed to punish user");
    } finally {
      setPunishingId(null);
    }
  };

  const resolveReports = async (foodId: string) => {
    setResolvingId(foodId);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/foods/${foodId}/resolve-reports`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        setError(
          await getApiErrorMessage(response, "Failed to resolve reports"),
        );
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== foodId));
      setTotal((prev) => Math.max(prev - 1, 0));
      setEditingItem((prev) => (prev?.id === foodId ? null : prev));
    } catch {
      setError("Failed to resolve reports");
    } finally {
      setResolvingId(null);
    }
  };

  const handleEditSubmit = async (formData: CreateFoodSidebarOnSubmitData) => {
    if (!editingItem) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/foods/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Failed to update food"));
        return;
      }

      await fetchItems(searchQuery, 0, false);
      setEditingItem(null);
    } catch {
      setError("Failed to update food");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/foods/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Failed to delete food"));
        return;
      }

      setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      setTotal((prev) => Math.max(prev - 1, 0));
      setDeleteTarget(null);
    } catch {
      setError("Failed to delete food");
    } finally {
      setIsDeleting(false);
    }
  };

  const toEditableFood = (item: ModerationItem): Food => {
    return {
      id: item.id,
      name: item.name,
      measurementType: item.measurementType,
      measurementAmount: item.measurementAmount,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      saturates: item.saturates,
      sugars: item.sugars,
      fibre: item.fibre,
      salt: item.salt,
      defaultServingAmount: item.defaultServingAmount ?? null,
      defaultServingDescription: item.defaultServingDescription ?? null,
      createdBy: null,
      isApproved: item.isApproved,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.createdAt),
    };
  };

  const emptyText = useMemo(() => {
    if (searchQuery) {
      return `No reported foods found for "${searchQuery}".`;
    }

    return "No pending food reports. Everything is currently reviewed.";
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mx-auto w-full max-w-3xl flex-1 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black overflow-hidden">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search reported foods..."
          data-testid="food-moderation-search"
        />

        {error && (
          <div className="px-4 pt-4" data-testid="food-moderation-error">
            <div className="rounded-lg border border-zinc-300 bg-zinc-100 p-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
              {error}
            </div>
          </div>
        )}

        <DataTableShell
          scrollRef={scrollRef}
          onScroll={handleScroll}
          isLoading={isLoading}
          loadingLabel="Loading reports"
          emptyNode={
            !isLoading && items.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {emptyText}
              </div>
            ) : undefined
          }
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="border-b border-zinc-200 px-4 py-4 last:border-b-0 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              data-testid={`moderation-item-${item.id}`}
              onClick={() => setEditingItem(item)}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-black dark:text-zinc-50">
                    {formatFoodNameForDisplay(item.name)}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.calories} kcal · {item.measurementAmount}
                    {item.measurementType === "weight" ? "g" : "ml"} · by{" "}
                    {item.createdByName}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.reportCount} report{item.reportCount === 1 ? "" : "s"}
                  </p>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <LoadingButton
                    onClick={() => punishCreator(item.id)}
                    isLoading={punishingId === item.id}
                    loadingLabel="Punishing..."
                    spinnerClassName="h-4 w-4"
                    className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    data-testid={`punish-user-${item.id}`}
                  >
                    Punish
                  </LoadingButton>
                  <button
                    type="button"
                    className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                    onClick={() => setDeleteTarget(item)}
                    data-testid={`delete-food-${item.id}`}
                  >
                    Delete
                  </button>
                  <LoadingButton
                    onClick={() => resolveReports(item.id)}
                    isLoading={resolvingId === item.id}
                    loadingLabel="Resolving..."
                    spinnerClassName="h-4 w-4"
                    className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    data-testid={`resolve-reports-${item.id}`}
                  >
                    Undo Report
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => approveFood(item.id, item.isApproved)}
                    isLoading={approvingId === item.id}
                    loadingLabel={
                      item.isApproved ? "Unapproving..." : "Approving..."
                    }
                    spinnerClassName="h-4 w-4"
                    className={[
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                      item.isApproved
                        ? "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
                        : "ct-button-primary",
                    ].join(" ")}
                    data-testid={`approve-food-${item.id}`}
                  >
                    {item.isApproved ? "Unapprove" : "Approve"}
                  </LoadingButton>
                </div>
              </div>
            </div>
          ))}
        </DataTableShell>
      </div>

      <CreateFoodSidebar
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSubmit={handleEditSubmit}
        userSettings={DEFAULT_USER_SETTINGS}
        isLoading={isSaving}
        editingFood={editingItem ? toEditableFood(editingItem) : null}
        editingDetails={
          editingItem
            ? {
                createdByName: editingItem.createdByName,
                createdAt: editingItem.createdAt,
                reportCount: editingItem.reportCount,
                lastReportedAt: editingItem.lastReportedAt,
                reportReasons: editingItem.reasons,
              }
            : undefined
        }
        adminActions={
          editingItem ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <LoadingButton
                type="button"
                onClick={() => punishCreator(editingItem.id)}
                isLoading={punishingId === editingItem.id}
                loadingLabel="Punishing..."
                spinnerClassName="h-4 w-4"
                className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                data-testid="edit-sidebar-punish"
              >
                Punish
              </LoadingButton>
              <button
                type="button"
                className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                onClick={() => setDeleteTarget(editingItem)}
                data-testid="edit-sidebar-delete"
              >
                Delete
              </button>
              <LoadingButton
                type="button"
                onClick={() => resolveReports(editingItem.id)}
                isLoading={resolvingId === editingItem.id}
                loadingLabel="Resolving..."
                spinnerClassName="h-4 w-4"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
                data-testid="edit-sidebar-resolve-reports"
              >
                Undo Report
              </LoadingButton>
              <LoadingButton
                type="button"
                onClick={() =>
                  approveFood(editingItem.id, editingItem.isApproved)
                }
                isLoading={approvingId === editingItem.id}
                loadingLabel={
                  editingItem.isApproved ? "Unapproving..." : "Approving..."
                }
                spinnerClassName="h-4 w-4"
                className={[
                  "rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                  editingItem.isApproved
                    ? "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
                    : "ct-button-primary",
                ].join(" ")}
                data-testid="edit-sidebar-approve"
              >
                {editingItem.isApproved ? "Unapprove" : "Approve"}
              </LoadingButton>
            </div>
          ) : undefined
        }
        error={error}
      />

      <DeleteFoodModal
        isOpen={Boolean(deleteTarget)}
        item={
          deleteTarget
            ? {
                name: formatFoodNameForDisplay(deleteTarget.name),
                measurementType: deleteTarget.measurementType,
                measurementAmount: deleteTarget.measurementAmount,
                calories: deleteTarget.calories,
                protein: deleteTarget.protein,
                carbs: deleteTarget.carbs,
                fat: deleteTarget.fat,
                saturates: deleteTarget.saturates,
                sugars: deleteTarget.sugars,
                fibre: deleteTarget.fibre,
                salt: deleteTarget.salt,
              }
            : null
        }
        mealName="Reported Foods"
        onConfirm={handleDeleteFood}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
        error={error}
        userSettings={DEFAULT_USER_SETTINGS}
      />
    </div>
  );
}
