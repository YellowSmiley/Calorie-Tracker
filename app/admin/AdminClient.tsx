"use client";

import { useState } from "react";
import UserManagement from "./UserManagement";
import FoodDatabase from "./FoodDatabase";

type AdminTab = "users" | "foods";

export default function AdminClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            Admin Panel
          </h1>
        </div>
      </div>

      {/* Tab Navigation - styled like bottom nav */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-6xl mx-auto flex gap-4">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex h-12 items-center justify-center rounded-lg px-6 text-base font-medium transition-colors ${
              activeTab === "users"
                ? "bg-foreground text-background"
                : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("foods")}
            className={`flex h-12 items-center justify-center rounded-lg px-6 text-base font-medium transition-colors ${
              activeTab === "foods"
                ? "bg-foreground text-background"
                : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            }`}
          >
            Foods
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 pb-24">
        {activeTab === "users" && <UserManagement />}
        {activeTab === "foods" && <FoodDatabase />}
      </div>
    </div>
  );
}
