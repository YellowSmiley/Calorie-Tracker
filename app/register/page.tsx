"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";
import ValidatedTextField from "../components/ValidatedTextField";
import PendingLink from "@/app/components/PendingLink";
import LoadingSpinner from "@/app/components/LoadingSpinner";

type RegisterFieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const passwordRequirements = [
    { regex: /.{8,}/, message: "at least 8 characters" },
    { regex: /[A-Z]/, message: "one uppercase letter" },
    { regex: /[a-z]/, message: "one lowercase letter" },
    { regex: /[0-9]/, message: "one number" },
    { regex: /[^A-Za-z0-9]/, message: "one special character" },
  ];

  const validateEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return "Enter a valid email address.";
    }
    return undefined;
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required.";
    for (const req of passwordRequirements) {
      if (!req.regex.test(value)) {
        return `Password must contain ${req.message}.`;
      }
    }
    return undefined;
  };

  const validateConfirmPassword = (value: string, passwordValue: string) => {
    if (!value) return "Confirm password is required.";
    if (value !== passwordValue) return "Passwords do not match.";
    return undefined;
  };

  const validateForm = () => {
    const nextErrors: RegisterFieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };
    setFieldErrors(nextErrors);
    return (
      !nextErrors.email && !nextErrors.password && !nextErrors.confirmPassword
    );
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!validateForm()) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Show "check your email" message
      setRegistered(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-8 text-center">
          {registered ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mb-2">
                Check your email
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-2">
                We&apos;ve sent a verification link to:
              </p>
              <p className="font-medium text-black dark:text-zinc-50 mb-6">
                {email}
              </p>
              <p className="text-sm text-zinc-500">
                Click the link in the email to verify your account, then{" "}
                <PendingLink
                  href="/login"
                  className="font-medium text-black dark:text-zinc-50 underline underline-offset-4 hover:no-underline"
                  pendingLabel="Loading sign in..."
                >
                  sign in
                </PendingLink>
                .
              </p>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
                  Create Account
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Sign up to start tracking your nutrition
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-base font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner className="h-5 w-5 text-background" />
                      Please wait...
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
                      Sign up with Google
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
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                <form
                  onSubmit={handleRegister}
                  noValidate
                  className="space-y-3"
                >
                  <div className="grid gap-2 text-left">
                    <ValidatedTextField
                      id="name"
                      label="Name"
                      value={name}
                      onChange={setName}
                      autoComplete="name"
                      placeholder="Optional"
                      dataTestId="name"
                      labelClassName="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      inputClassName="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                    />
                  </div>
                  <div className="grid gap-2 text-left">
                    <ValidatedTextField
                      id="email"
                      label="Email"
                      type="email"
                      value={email}
                      onChange={(value) => {
                        setEmail(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: validateEmail(value),
                        }));
                      }}
                      onBlur={() => {
                        setFieldErrors((prev) => ({
                          ...prev,
                          email: validateEmail(email),
                        }));
                      }}
                      autoComplete="email"
                      required
                      dataTestId="email"
                      error={fieldErrors.email}
                      labelClassName="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      inputClassName="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                    />
                  </div>
                  <div className="grid gap-2 text-left">
                    <ValidatedTextField
                      id="password"
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(value) => {
                        setPassword(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validatePassword(value),
                          confirmPassword: validateConfirmPassword(
                            confirmPassword,
                            value,
                          ),
                        }));
                      }}
                      onBlur={() => {
                        setFieldErrors((prev) => ({
                          ...prev,
                          password: validatePassword(password),
                        }));
                      }}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      dataTestId="password"
                      error={fieldErrors.password}
                      labelClassName="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      inputClassName="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                    />
                    <p className="text-xs text-zinc-500">
                      Must be at least 8 characters, incl. uppercase, lowercase,
                      number, special character
                    </p>
                  </div>
                  <div className="grid gap-2 text-left">
                    <ValidatedTextField
                      id="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(value) => {
                        setConfirmPassword(value);
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(
                            value,
                            password,
                          ),
                        }));
                      }}
                      onBlur={() => {
                        setFieldErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateConfirmPassword(
                            confirmPassword,
                            password,
                          ),
                        }));
                      }}
                      autoComplete="new-password"
                      required
                      dataTestId="confirm-password"
                      error={fieldErrors.confirmPassword}
                      labelClassName="block mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      inputClassName="w-full h-10 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 text-sm text-black dark:text-zinc-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-4 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="register-button"
                  >
                    Create account
                  </button>
                </form>
              </div>

              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
                Already have an account?{" "}
                <PendingLink
                  href="/login"
                  className="font-medium text-black dark:text-zinc-50 underline underline-offset-4 hover:no-underline"
                  pendingLabel="Loading sign in..."
                >
                  Sign in
                </PendingLink>
              </p>
            </>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Copyright © 2026 Michael Smith. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
