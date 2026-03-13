"use client";

import { ReactNode, RefObject, UIEventHandler } from "react";

interface DataTableShellProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: UIEventHandler<HTMLDivElement>;
  containerClassName?: string;
  listClassName?: string;
  overlay?: ReactNode;
  children: ReactNode;
  loadingNode?: ReactNode;
  emptyNode?: ReactNode;
  footerNode?: ReactNode;
}

export default function DataTableShell({
  scrollRef,
  onScroll,
  containerClassName = "flex-1 overflow-y-auto",
  listClassName = "divide-y divide-zinc-200 dark:divide-zinc-800",
  overlay,
  children,
  loadingNode,
  emptyNode,
  footerNode,
}: DataTableShellProps) {
  return (
    <div ref={scrollRef} onScroll={onScroll} className={containerClassName}>
      {overlay}
      <div className={listClassName}>
        {children}
        {loadingNode}
        {emptyNode}
        {footerNode}
      </div>
    </div>
  );
}
