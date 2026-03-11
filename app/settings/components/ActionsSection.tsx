import Link from "next/link";
import { signOut } from "next-auth/react";
import HelpButton from "@/app/components/HelpButton";

interface ActionsSectionProps {
  isAdmin: boolean;
  onMyFoodsClick: () => void;
}

export default function ActionsSection({
  isAdmin,
  onMyFoodsClick,
}: ActionsSectionProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6 mb-40">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Actions
        </h2>
        <HelpButton
          title="Actions"
          content="Quick access to other functions. 'My Foods' lets you manage your food entries, and admins can see and manage all foods there. 'Admin Panel' is for user management only. 'Sign Out' securely logs you out of your account."
          ariaLabel="Help: Actions explained"
        />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onMyFoodsClick}
          className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50"
          data-testid="my-foods-button"
        >
          My Foods
        </button>
        {isAdmin && (
          <Link
            href="/admin"
            className="block rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-center text-black dark:text-zinc-50"
            data-testid="admin-panel-link"
          >
            User Management
          </Link>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50"
          data-testid="sign-out-button"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
