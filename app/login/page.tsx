"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";
import PendingLink from "@/app/components/PendingLink";
import LoadingSpinner from "@/app/components/LoadingSpinner";

export default function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const isLoading = isGoogleLoading || isFormLoading || isResetLoading;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch {
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setResetSent(false);
    setIsFormLoading(true);
    try {
      const result = await signIn("credentials", {
        email: email,
        password: password,
        redirect: false,
      });
      if (result?.error || !result?.ok) {
        setError(
          "Failed to login. Please check your credentials and try again.",
        );
      } else {
        window.location.href = "/";
      }
    } catch {
      setError("Failed to sign in. Please try again.");
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setResetSending(true);
    setError("");
    setResetSent(false);

    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    setIsResetLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setResetSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsResetLoading(false);
      setResetSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-8 text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
              Calorie Tracker
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Track your daily food intake and macronutrients
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-black dark:text-zinc-50 font-medium">
              Sign in to access your diary
            </p>
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <>
                  <LoadingSpinner className="h-5 w-5 text-background" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-black px-2 text-zinc-500">
                  or
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                {error}
              </p>
            )}

            {resetSent && (
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  If an account exists with that email, a password reset link
                  has been sent.
                </p>
              </div>
            )}

            {resetSending && (
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3">
                <p className="text-sm text-zinc-700 dark:text-zinc-300">
                  Sending password reset link to {email}...
                </p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="grid gap-2 text-left">
                <label
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  id="email"
                  data-testid="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2 text-left">
                <div className="flex items-center justify-between">
                  <label
                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isLoading || resetSending}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-black dark:hover:text-zinc-50 underline underline-offset-2 disabled:opacity-50"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  data-testid="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex h-10 items-center justify-center rounded-lg bg-foreground text-background px-4 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="sign-in-button"
              >
                Sign in
              </button>
            </form>
          </div>

          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            Don&apos;t have an account?{" "}
            <PendingLink
              href="/register"
              className="font-medium text-black dark:text-zinc-50 underline underline-offset-4 hover:no-underline"
              pendingLabel="Loading registration..."
            >
              Create one
            </PendingLink>
          </p>

          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
            By signing in, you agree to our{" "}
            <PendingLink
              href="/terms"
              className="underline hover:no-underline"
              pendingLabel="Loading terms..."
            >
              Terms of Service
            </PendingLink>{" "}
            and{" "}
            <PendingLink
              href="/privacy"
              className="underline hover:no-underline"
              pendingLabel="Loading privacy policy..."
            >
              Privacy Policy
            </PendingLink>
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Copyright © 2026 Michael Smith. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
