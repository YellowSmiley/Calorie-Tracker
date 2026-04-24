"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/app/components/analyticsEvents";

const TUTORIAL_STATE_KEY = "dashboard-quick-start-collapsed";

export default function DashboardQuickStartTutorial() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(TUTORIAL_STATE_KEY);
      if (savedState === "open") {
        setIsCollapsed(false);
      } else if (savedState === "closed") {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore storage access errors and keep the default state.
    } finally {
      setHasLoadedPreference(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedPreference) {
      return;
    }

    try {
      localStorage.setItem(TUTORIAL_STATE_KEY, isCollapsed ? "closed" : "open");
    } catch {
      // Ignore storage access errors in environments where storage is unavailable.
    }
  }, [hasLoadedPreference, isCollapsed]);

  const handleToggleTutorial = () => {
    setIsCollapsed((previous) => {
      const nextCollapsed = !previous;

      trackEvent(nextCollapsed ? "tutorial_closed" : "tutorial_opened", {
        tutorial: "dashboard_quick_start",
      });

      return nextCollapsed;
    });
  };

  return (
    <section className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-black dark:text-zinc-50">
          Quick Tutorial
        </h3>
        <button
          type="button"
          onClick={handleToggleTutorial}
          aria-expanded={!isCollapsed}
          aria-controls="dashboard-quick-tutorial-content"
          className="ct-button-secondary h-10 w-full rounded-lg px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500 sm:w-auto"
          data-testid="dashboard-tutorial-toggle"
        >
          {isCollapsed ? "Show tutorial" : "Hide tutorial"}
        </button>
      </div>

      {!isCollapsed ? (
        <div
          id="dashboard-quick-tutorial-content"
          className="mt-4 space-y-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300"
          data-testid="dashboard-tutorial-content"
        >
          <p className="text-zinc-600 dark:text-zinc-400">
            Simple walkthrough to set goals, log food, and save favorites.
          </p>

          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Go to{" "}
              <Link
                href="/settings"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              >
                Settings
              </Link>{" "}
              and check your daily goals for calories, protein, carbs, and fat.
            </li>
            <li>
              Open{" "}
              <Link
                href="/diary"
                className="font-medium text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
              >
                Diary
              </Link>{" "}
              and choose your meal (Breakfast, Lunch, Dinner, or Snacks), then
              select Add Item.
            </li>
            <li>
              Example food entry: search for &quot;Greek yogurt&quot;, select
              it, then enter a serving like 170g before saving it to your meal.
            </li>
            <li>
              Use favorites to save meals with multiple ingredients. Example:
              build a meal with &quot;Chicken breast&quot;, &quot;Rice&quot;,
              and &quot;Soy sauce&quot;, then save it as the &quot;Chicken and
              Rice&quot; favorite.
            </li>
            <li>
              In Diary, use Apply Favourite to add a saved meal to another meal
              slot or another day in a few taps.
            </li>
          </ol>
        </div>
      ) : null}
    </section>
  );
}
