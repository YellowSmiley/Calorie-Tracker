"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useSyncExternalStore } from "react";
import type { MouseEvent, ReactNode } from "react";
import LoadingSpinner from "./LoadingSpinner";
import {
  getRouteLoadingServerSnapshot,
  getRouteLoadingSnapshot,
  startRouteLoading,
  subscribeRouteLoading,
} from "./routeLoading";

type PendingLinkProps = LinkProps & {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
  pendingClassName?: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  "data-testid"?: string;
};

function normalizeHref(href: LinkProps["href"]) {
  if (typeof href === "string") {
    return href;
  }

  if (href.pathname) {
    const searchParams = new URLSearchParams();
    const query = href.query || {};

    for (const [key, value] of Object.entries(query)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          searchParams.append(key, String(entry));
        }
      } else if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }

    const search = searchParams.toString();
    return search ? `${href.pathname}?${search}` : href.pathname;
  }

  return null;
}

export default function PendingLink({
  children,
  href,
  className,
  onClick,
  ...props
}: PendingLinkProps) {
  return (
    <Suspense
      fallback={
        <Link href={href} className={className} onClick={onClick} {...props}>
          <span className="inline-flex items-center justify-center gap-2">
            <span>{children}</span>
          </span>
        </Link>
      }
    >
      <PendingLinkContent
        href={href}
        className={className}
        onClick={onClick}
        {...props}
      >
        {children}
      </PendingLinkContent>
    </Suspense>
  );
}

function PendingLinkContent({
  children,
  href,
  pendingLabel,
  pendingClassName,
  onClick,
  className,
  ...props
}: PendingLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeLoading = useSyncExternalStore(
    subscribeRouteLoading,
    getRouteLoadingSnapshot,
    getRouteLoadingServerSnapshot,
  );

  const currentHref = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  const targetHref = normalizeHref(href);
  const isPending =
    routeLoading.isLoading &&
    targetHref !== null &&
    routeLoading.href === targetHref;
  const resolvedClassName = [
    className,
    isPending ? pendingClassName || "pointer-events-none opacity-70" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link
      {...props}
      href={href}
      aria-busy={isPending}
      data-loading={isPending ? "true" : undefined}
      className={resolvedClassName}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (!targetHref || targetHref === currentHref) {
          return;
        }

        startRouteLoading(pendingLabel, targetHref);
      }}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {isPending && <LoadingSpinner className="h-4 w-4" />}
        <span>{children}</span>
      </span>
    </Link>
  );
}
