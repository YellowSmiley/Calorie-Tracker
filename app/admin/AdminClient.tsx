"use client";

import UserManagement from "./UserManagement";
import AppHeader from "@/app/components/AppHeader";

export default function AdminClient() {
  return (
    <div className="min-h-full flex flex-col">
      <AppHeader
        title="User Management"
        helpTitle="User Management"
        helpAriaLabel="Help: User management overview"
        helpContent={
          <p>
            Manage user accounts and permissions. Food management is handled in
            Settings via My Foods.
          </p>
        }
      />

      {/* Content */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-950 pb-24">
        <UserManagement />
      </div>
    </div>
  );
}
