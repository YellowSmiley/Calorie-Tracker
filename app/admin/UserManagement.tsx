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
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers(users.filter((u) => u.id !== userId));
        setDeleteConfirm(null);
        setError(null);
      } else {
        setError("Failed to delete user");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error deleting user");
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
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-black dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400"
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
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50">
                Name
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50">
                Email
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50">
                Admin
              </th>
              <th className="text-left px-4 py-3 font-semibold text-black dark:text-zinc-50">
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
                    {deleteConfirm === user.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1 rounded text-sm font-medium bg-black text-white dark:bg-zinc-50 dark:text-black hover:opacity-90"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-3 py-1 rounded text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:opacity-90"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        className="px-3 py-1 rounded text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-50 hover:opacity-90"
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
    </div>
  );
}
