"use client";

import UserManagement from "./UserManagement";
import HelpButton from "../components/HelpButton";

export default function AdminClient() {
  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              User Management
            </h1>
            <HelpButton
              title="User Management"
              ariaLabel="Help: User management overview"
            >
              <p>
                Manage user accounts and permissions. Food management is handled
                in Settings via My Foods.
              </p>
            </HelpButton>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 pb-24">
        <UserManagement />
      </div>
    </div>
  );
}
