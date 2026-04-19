"use client";

import { useState } from "react";
import UserManagement from "./UserManagement";
import AppHeader from "@/app/components/AppHeader";
import FoodModeration from "./FoodModeration";

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<"users" | "moderation">("users");

  return (
    <div className="min-h-full flex flex-col">
      <AppHeader
        title={activeTab === "users" ? "User Management" : "Food Moderation"}
        helpTitle={
          activeTab === "users" ? "User Management" : "Food Moderation"
        }
        helpAriaLabel={
          activeTab === "users"
            ? "Help: User management overview"
            : "Help: Food moderation overview"
        }
        helpContent={
          activeTab === "users" ? (
            <p>Manage user accounts and permissions.</p>
          ) : (
            <p>
              Review reported food entries, then approve trustworthy foods so
              users can identify reviewed items more confidently.
            </p>
          )
        }
      />

      {/* Content */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 pb-24">
        <div className="mx-auto flex w-full max-w-3xl gap-2 px-4 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "ct-button-primary"
                : "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
            }`}
            data-testid="admin-tab-users"
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("moderation")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "moderation"
                ? "ct-button-primary"
                : "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
            }`}
            data-testid="admin-tab-food-moderation"
          >
            Food Moderation
          </button>
        </div>

        {activeTab === "users" ? <UserManagement /> : <FoodModeration />}
      </div>
    </div>
  );
}
