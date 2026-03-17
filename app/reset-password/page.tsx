"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import PendingLink from "@/app/components/PendingLink";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >(!token || !email ? "error" : "idle");
  const [message, setMessage] = useState(
    !token || !email ? "Invalid password reset link." : "",
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    // Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRequirements = [
      { regex: /.{8,}/, message: "at least 8 characters" },
      { regex: /[A-Z]/, message: "one uppercase letter" },
      { regex: /[a-z]/, message: "one lowercase letter" },
      { regex: /[0-9]/, message: "one number" },
      { regex: /[^A-Za-z0-9]/, message: "one special character" },
    ];
    for (const req of passwordRequirements) {
      if (!req.regex.test(password)) {
        setStatus("error");
        setMessage(`Password must contain ${req.message}.`);
        return;
      }
    }

    if (password !== confirmPassword) {
      setStatus("error");
      setMessage("Passwords do not match.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Your password has been reset successfully.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-8 text-center">
          <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mb-6">
            Reset Password
          </h1>

          {status === "success" ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                  {message}
                </p>
              </div>
              <PendingLink
                href="/login"
                className="inline-block w-full h-10 leading-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                pendingLabel="Loading sign in..."
              >
                Back to Login
              </PendingLink>
            </div>
          ) : status === "error" && (!token || !email) ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {message}
              </p>
              <PendingLink
                href="/login"
                className="inline-block w-full h-10 leading-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800"
                pendingLabel="Loading sign in..."
              >
                Back to Login
              </PendingLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {message && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {message}
                </p>
              )}
              <div className="grid gap-2 text-left">
                <label
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="password"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="grid gap-2 text-left">
                <label
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="confirm-password"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Resetting..." : "Reset Password"}
              </button>
              <PendingLink
                href="/login"
                className="block text-sm text-zinc-600 dark:text-zinc-400 hover:underline mt-2"
                pendingLabel="Loading sign in..."
              >
                Back to Login
              </PendingLink>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <p className="text-zinc-500">Loading...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
