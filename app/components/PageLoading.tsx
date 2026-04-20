import LoadingSpinner from "./LoadingSpinner";

interface PageLoadingProps {
  label?: string;
}

export default function PageLoading({
  label = "Loading...",
}: PageLoadingProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="flex min-w-[220px] flex-col items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-6 py-8 shadow-sm dark:border-zinc-800 dark:bg-black">
        <LoadingSpinner className="ct-route-loading-spinner h-10 w-10" />
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </p>
      </div>
    </div>
  );
}
