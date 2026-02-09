"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  isAdmin: boolean;
  createdAt?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        setError(null);
      } else {
        setError("Failed to fetch users");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Error fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setDeleteUser(null);
        setError(null);
      } else {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setDeleteError("Error deleting user");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-lg">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="p-4">
        <input
          type="text"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-600"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-900 dark:text-zinc-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-zinc-700 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-300"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full border-collapse bg-white dark:bg-zinc-950">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                Email
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                Admin
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-black dark:text-zinc-50">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-3 text-center text-zinc-500">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {user.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-black dark:text-zinc-50">
                    {user.email || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        user.isAdmin
                          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200"
                          : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-400"
                      }`}
                    >
                      {user.isAdmin ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {deleteUser?.id === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setDeleteUser(null);
                            setDeleteError(null);
                          }}
                          className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDeleteUser(user);
                          setDeleteError(null);
                        }}
                        className="text-zinc-700 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300 text-sm font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
              <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-4 space-y-3">
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
