"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PendingLink from "@/app/components/PendingLink";
import LoadingSpinner from "@/app/components/LoadingSpinner";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    !token || !email ? "error" : "loading",
  );
  const [message, setMessage] = useState(
    !token || !email ? "Invalid verification link." : "",
  );

  useEffect(() => {
    if (!token || !email) {
      return;
    }

    fetch(`/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage("Your email has been verified!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token, email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-8 text-center">
          {status === "loading" && (
            <>
              <LoadingSpinner className="mx-auto mb-4 h-8 w-8 text-black dark:text-white" />
              <p className="text-black dark:text-zinc-50 font-medium">
                Verifying your email...
              </p>
            </>
          )}

          {status === "success" && (
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mb-2">
                Email Verified
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
              <PendingLink
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                pendingLabel="Loading sign in..."
              >
                Sign in
              </PendingLink>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black dark:text-zinc-50 mb-2">
                Verification Failed
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">{message}</p>
              <PendingLink
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                pendingLabel="Loading registration..."
              >
                Register again
              </PendingLink>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <LoadingSpinner className="h-8 w-8 text-black dark:text-white" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
