"use client";

import { User } from "@prisma/client";
import { useState, useEffect, useRef, useCallback } from "react";
import EditUserSidebar from "./components/EditUserSidebar";
import SearchInput from "../components/SearchInput";
import DataTableShell from "../components/DataTableShell";

const PAGE_SIZE = 50;

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchUsers = useCallback(
    async (search: string, skip: number, append: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          search,
          take: String(PAGE_SIZE),
          skip: String(skip),
        });
        const res = await fetch(`/api/admin/users?${params}`);
        if (!res.ok) {
          setError("Failed to fetch users");
          return;
        }
        const data = (await res.json()) as {
          users: User[];
          total: number;
          suggestions?: string[];
        };
        const fetched: User[] = data.users || [];
        setUsers((prev) => (append ? [...prev, ...fetched] : fetched));
        setTotal(data.total ?? 0);
        if (!append) {
          setSuggestions(data.suggestions ?? []);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.error("Error fetching users:", err);
        setError("Error fetching users");
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Fetch on mount
  useEffect(() => {
    fetchUsers("", 0, false);
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQuery) {
      setSuggestions([]);
      fetchUsers("", 0, false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      fetchUsers(searchQuery, 0, false);
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, 1000);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchUsers]);

  const loadMore = useCallback(() => {
    if (isLoading || users.length >= total) return;
    fetchUsers(searchQuery, users.length, true);
  }, [isLoading, users.length, total, searchQuery, fetchUsers]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Only load more if user has scrolled past 2720px (40 rows * 68px)
    if (el.scrollTop < 2720) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      loadMore();
    }
  }, [loadMore]);

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotal((prev) => prev - 1);
        setDeleteUser(null);
        setError(null);
      } else {
        const data = (await response.json()) as { error?: string };
        setDeleteError(data.error || "Failed to delete user");
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error("Error deleting user:", err);
      setDeleteError("Error deleting user");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="mx-auto w-full max-w-3xl flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search users..."
          inputTestId="user-search-input"
          showSuggestions={!isLoading && users.length === 0 && !!searchQuery}
          suggestions={suggestions}
          onSuggestionClick={setSearchQuery}
          suggestionsTestId="user-search-suggestions"
          suggestionButtonTestIdPrefix="user-search-suggestion"
          data-testid="user-search"
        />

        {/* Error Message */}
        {error && (
          <div className="px-4 pt-4">
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-900 dark:text-zinc-200">
                  {error}
                </p>
                <button
                  onClick={() => setError(null)}
                  className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        <DataTableShell
          scrollRef={scrollRef}
          onScroll={handleScroll}
          loadingNode={
            isLoading ? (
              <div className="px-4 py-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Loading...
              </div>
            ) : undefined
          }
          emptyNode={
            !isLoading && users.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {searchQuery
                    ? `No users found for "${searchQuery}"`
                    : "No users found"}
                </p>
              </div>
            ) : undefined
          }
        >
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                user.provider === "credentials"
                  ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  : ""
              }`}
              onClick={
                user.provider === "credentials"
                  ? () => {
                      setEditUser(user);
                      setEditError(null);
                    }
                  : undefined
              }
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-black dark:text-zinc-50 flex items-center gap-2">
                  {user.name || "No name"}
                  {user.provider === "credentials" && (
                    <span className="inline-block px-2 py-0.5 text-xs rounded bg-black text-white dark:bg-zinc-50 dark:text-black">
                      Our User
                    </span>
                  )}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {user.email || "No email"}
                  {user.isAdmin ? " - Admin" : ""}
                </p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteUser(user);
                    setDeleteError(null);
                  }}
                  className="rounded-lg border border-solid border-black/8 hover:border-black hover:bg-black/4 dark:border-white/[.145] dark:hover:border-white dark:hover:bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </DataTableShell>

        {/* Edit User Sidebar */}
        <EditUserSidebar
          key={editUser?.id}
          user={editUser}
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          isSaving={isSaving}
          error={editError}
          onSave={async (name, email, password) => {
            setIsSaving(true);
            setEditError(null);
            try {
              const response = await fetch(`/api/admin/users/${editUser?.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
              });
              if (response.ok) {
                setUsers((prev) =>
                  prev.map((u) =>
                    u.id === editUser?.id ? { ...u, name, email } : u,
                  ),
                );
                setEditUser(null);
              } else {
                const data = (await response.json()) as { error?: string };
                setEditError(data.error || "Failed to update user");
              }
            } catch {
              setEditError("Error updating user");
            } finally {
              setIsSaving(false);
            }
          }}
        />
      </div>

      {/* Delete User Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-zinc-950 shadow-xl">
            {/* Header */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 p-4">
              <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
                Delete User?
              </h2>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Are you sure you want to delete this user? This will permanently
                remove their account and all associated data.
              </p>

              {deleteError && (
                <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 border border-zinc-300 dark:border-zinc-700">
                  <p className="text-sm text-zinc-900 dark:text-zinc-200">
                    {deleteError}
                  </p>
                </div>
              )}

              {/* User Details */}
              <div className="rounded-lg bg-zinc-50 dark:bg-black p-4 space-y-3 border border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="font-medium text-black dark:text-zinc-50">
                    {deleteUser.name || "No name"}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    {deleteUser.email || "No email"}
                  </p>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Admin:
                    </span>
                    <span className="font-medium text-black dark:text-zinc-50">
                      {deleteUser.isAdmin ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex gap-3 sm:flex-row flex-col">
              <button
                onClick={() => {
                  setDeleteUser(null);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUser.id)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 rounded-lg bg-black text-white font-medium hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
