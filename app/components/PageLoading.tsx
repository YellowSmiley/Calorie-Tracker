interface PageLoadingProps {
  label?: string;
}

export default function PageLoading({
  label = "Loading...",
}: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm dark:border-zinc-800 dark:bg-black">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white" />
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
      </div>
    </div>
  );
}
