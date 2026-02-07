"use client";

import { useState } from "react";
import UserManagement from "./UserManagement";
import FoodDatabase from "./FoodDatabase";

type AdminTab = "users" | "foods";

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Admin Panel
          </h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-6xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "users"
                ? "bg-foreground text-background"
                : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("foods")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "foods"
                ? "bg-foreground text-background"
                : "bg-zinc-100 dark:bg-zinc-900 text-black dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            Foods
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 pb-24">
        <div className="max-w-6xl mx-auto">
          {activeTab === "users" && <UserManagement />}
          {activeTab === "foods" && <FoodDatabase />}
        </div>
      </div>
    </div>
  );
}
