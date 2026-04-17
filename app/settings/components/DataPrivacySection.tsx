import HelpButton from "@/app/components/HelpButton";
import LoadingButton from "@/app/components/LoadingButton";
import PendingLink from "@/app/components/PendingLink";

interface DataPrivacySectionProps {
  showDeleteConfirm: boolean;
  isExporting: boolean;
  isDeleting: boolean;
  onExport: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export default function DataPrivacySection({
  showDeleteConfirm,
  isExporting,
  isDeleting,
  onExport,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
}: DataPrivacySectionProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          Data &amp; Privacy
        </h2>
        <HelpButton
          title="Data &amp; Privacy"
          ariaLabel="Help: Data and privacy options explained"
        >
          <p>
            Export your personal data as a JSON file for backup or data
            portability.
          </p>
          <p>
            You can also permanently delete your account and all associated
            data. Deleting your account is irreversible and removes all meals,
            foods, and settings.
          </p>
          <p>Read our Privacy Policy and Terms of Service for more details.</p>
        </HelpButton>
      </div>

      <div className="space-y-3">
        <LoadingButton
          type="button"
          data-testid="export-data-button"
          onClick={onExport}
          isLoading={isExporting}
          loadingLabel="Exporting data..."
          spinnerClassName="h-4 w-4"
          className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50 disabled:opacity-50"
        >
          Export My Data
        </LoadingButton>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
          Download all your personal data in JSON format (meals, foods,
          settings).
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            data-testid="delete-account-button"
            onClick={onDeleteClick}
            className="w-full rounded-lg border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a] px-6 py-3 font-medium transition-colors text-black dark:text-zinc-50"
          >
            Delete My Account
          </button>
        ) : (
          <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950 p-4">
            <p className="text-sm text-red-700 dark:text-red-300 mb-3">
              This will permanently delete your account and all associated data
              (meals, foods, settings). This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <LoadingButton
                type="button"
                data-testid="confirm-delete-button"
                onClick={onDeleteConfirm}
                isLoading={isDeleting}
                loadingLabel="Deleting account..."
                spinnerClassName="h-4 w-4"
                className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                Yes, Delete Everything
              </LoadingButton>
              <button
                type="button"
                data-testid="cancel-delete-button"
                onClick={onDeleteCancel}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium text-black dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <PendingLink
            href="/privacy"
            className="underline hover:no-underline"
            pendingLabel="Loading privacy policy..."
            data-testid="privacy-policy-link"
          >
            Privacy Policy
          </PendingLink>
          <PendingLink
            href="/terms"
            className="underline hover:no-underline"
            pendingLabel="Loading terms..."
            data-testid="terms-of-service-link"
          >
            Terms of Service
          </PendingLink>
        </div>
      </div>
    </div>
  );
}
