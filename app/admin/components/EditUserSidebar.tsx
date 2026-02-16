"use client";

import { User } from "@prisma/client";
import { useState } from "react";

interface EditUserSidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, email: string, password?: string) => Promise<void>;
  isSaving: boolean;
  error: string | null;
}

export default function EditUserSidebar({
  user,
  isOpen,
  onClose,
  onSave,
  isSaving,
  error,
}: EditUserSidebarProps) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  // Only show if open
  if (!isOpen) return null;

  return (
    <div
      className={`fixed top-0 right-0 h-full w-full bg-zinc-50 dark:bg-zinc-950 shadow-lg z-50 flex flex-col transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <button
          onClick={onClose}
          className="h-10 rounded-lg border border-solid border-black/8 px-4 text-sm font-medium text-black transition-colors hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          Back
        </button>
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Edit User
        </h2>
        <div className="w-12" />
      </div>

      {/* Form Panel */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name, email, password || undefined);
        }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-lg bg-white dark:bg-black p-6 flex flex-col gap-6 shadow border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="Email address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black dark:text-zinc-50 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-transparent text-black dark:text-zinc-50"
                  placeholder="Leave blank to keep current password"
                  autoComplete="new-password"
                  minLength={8}
                />
              </div>
              {error && (
                <div className="rounded bg-red-100 text-red-700 px-3 py-2 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button - Fixed at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-lg border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-50 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-12 rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
