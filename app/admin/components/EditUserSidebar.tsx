"use client";

import { User } from "@prisma/client";
import { useState } from "react";
import ValidatedTextField from "../../components/ValidatedTextField";

type EditableAdminUser = Pick<
  User,
  "id" | "name" | "email" | "isActive" | "blackMarks" | "bannedAt"
>;

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
};

interface EditUserSidebarProps {
  user: EditableAdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, email: string, password?: string) => Promise<void>;
  onPunish: () => Promise<void>;
  onUndoPunish: () => Promise<void>;
  onActivate: () => Promise<void>;
  onDeactivate: () => Promise<void>;
  onClearPunishments: () => Promise<void>;
  isSaving: boolean;
  isModerating: boolean;
  error: string | null;
  moderationError: string | null;
}

export default function EditUserSidebar({
  user,
  isOpen,
  onClose,
  onSave,
  onPunish,
  onUndoPunish,
  onActivate,
  onDeactivate,
  onClearPunishments,
  isSaving,
  isModerating,
  error,
  moderationError,
}: EditUserSidebarProps) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateName = (value: string) => {
    if (!value.trim()) return "Name is required.";
    return undefined;
  };

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address.";
    }
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (value && value.length < 8) {
      return "Password must be at least 8 characters.";
    }
    return undefined;
  };

  const validateForm = () => {
    const nextErrors: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };

    setFieldErrors(nextErrors);

    return !nextErrors.name && !nextErrors.email && !nextErrors.password;
  };

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
          data-testid="edit-user-back-button"
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
          if (!validateForm()) return;
          onSave(name.trim(), email.trim(), password || undefined);
        }}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-lg bg-white dark:bg-black p-6 flex flex-col gap-6 shadow border border-zinc-200 dark:border-zinc-800">
              <ValidatedTextField
                id="edit-user-name"
                label="Name"
                type="text"
                value={name}
                onChange={(nextName) => {
                  setName(nextName);
                  setFieldErrors((prev) => ({
                    ...prev,
                    name: validateName(nextName),
                  }));
                }}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    name: validateName(name),
                  }));
                }}
                placeholder="Full name"
                required
                error={fieldErrors.name}
              />
              <ValidatedTextField
                id="edit-user-email"
                label="Email"
                type="email"
                value={email}
                onChange={(nextEmail) => {
                  setEmail(nextEmail);
                  setFieldErrors((prev) => ({
                    ...prev,
                    email: validateEmail(nextEmail),
                  }));
                }}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    email: validateEmail(email),
                  }));
                }}
                placeholder="Email address"
                required
                error={fieldErrors.email}
              />
              <ValidatedTextField
                id="edit-user-password"
                label="New Password"
                type="password"
                value={password}
                onChange={(nextPassword) => {
                  setPassword(nextPassword);
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validatePassword(nextPassword),
                  }));
                }}
                onBlur={() => {
                  setFieldErrors((prev) => ({
                    ...prev,
                    password: validatePassword(password),
                  }));
                }}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
                minLength={8}
                error={fieldErrors.password}
              />

              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
                    Moderation
                  </h3>
                  <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                    View punishment status and apply or undo moderation actions.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit-user-black-marks"
                      className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Punishments (Black Marks)
                    </label>
                    <input
                      id="edit-user-black-marks"
                      type="text"
                      value={String(user?.blackMarks ?? 0)}
                      readOnly
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-user-active-state"
                      className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Active State
                    </label>
                    <input
                      id="edit-user-active-state"
                      type="text"
                      value={user?.isActive ? "Active" : "Inactive"}
                      readOnly
                      className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-black dark:text-zinc-50"
                    />
                  </div>
                </div>

                {user?.bannedAt && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Banned at: {new Date(user.bannedAt).toLocaleString()}
                  </p>
                )}

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={onPunish}
                    className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    disabled={isModerating}
                    data-testid="edit-user-punish"
                  >
                    {isModerating ? "Working..." : "Punish (+1 Mark)"}
                  </button>
                  <button
                    type="button"
                    onClick={onUndoPunish}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
                    disabled={isModerating || (user?.blackMarks ?? 0) <= 0}
                    data-testid="edit-user-undo-punish"
                  >
                    Undo Punish (-1 Mark)
                  </button>
                  {user?.isActive ? (
                    <button
                      type="button"
                      onClick={onDeactivate}
                      className="ct-button-danger-subtle rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      disabled={isModerating}
                      data-testid="edit-user-deactivate"
                    >
                      Deactivate User
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onActivate}
                      className="ct-button-primary rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      disabled={isModerating}
                      data-testid="edit-user-activate"
                    >
                      Activate User
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClearPunishments}
                    className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
                    disabled={isModerating}
                    data-testid="edit-user-clear-punishments"
                  >
                    Clear Marks and Unban
                  </button>
                </div>

                {moderationError && (
                  <div className="rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700">
                    {moderationError}
                  </div>
                )}
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
