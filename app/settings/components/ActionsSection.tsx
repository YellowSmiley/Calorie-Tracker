"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import HelpButton from "@/app/components/HelpButton";
import LoadingButton from "@/app/components/LoadingButton";
import PendingLink from "@/app/components/PendingLink";
import { startRouteLoading } from "@/app/components/routeLoading";

interface ActionsSectionProps {
  isAdmin: boolean;
  onMyFoodsClick: () => void;
  onFavoriteMealsClick: () => void;
}

export default function ActionsSection({
  isAdmin,
  onMyFoodsClick,
  onFavoriteMealsClick,
}: ActionsSectionProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6 mb-40">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Actions
        </h2>
        <HelpButton title="Actions" ariaLabel="Help: Actions explained">
          <p>Quick access to account and management actions.</p>
          <p>
            My Foods lets you manage your own food entries, and admins can
            manage all foods there.
          </p>
          <p>
            Admin is for account administration only. Sign Out safely logs you
            out of your account.
          </p>
        </HelpButton>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onMyFoodsClick}
          className="ct-button-secondary h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors"
          data-testid="my-foods-button"
        >
          My Foods
        </button>
        <button
          type="button"
          onClick={onFavoriteMealsClick}
          className="ct-button-secondary h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors"
          data-testid="favorite-meals-button"
        >
          Favorite Meals
        </button>
        {isAdmin && (
          <PendingLink
            href="/admin"
            className="ct-button-secondary block h-10 rounded-lg px-6 text-sm font-medium leading-10 transition-colors text-center"
            pendingLabel="Loading admin panel..."
            data-testid="admin-panel-link"
          >
            Admin
          </PendingLink>
        )}
        <LoadingButton
          type="button"
          onClick={() => {
            setIsSigningOut(true);
            startRouteLoading("Signing out...");
            signOut({ callbackUrl: "/login" });
          }}
          isLoading={isSigningOut}
          loadingLabel="Signing out..."
          spinnerClassName="h-4 w-4"
          className="ct-button-secondary h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors disabled:opacity-50"
          data-testid="sign-out-button"
        >
          Sign Out
        </LoadingButton>
      </div>
    </div>
  );
}
