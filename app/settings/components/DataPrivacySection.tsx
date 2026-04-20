import HelpButton from "@/app/components/HelpButton";
import LoadingButton from "@/app/components/LoadingButton";
import PendingLink from "@/app/components/PendingLink";

interface DataPrivacySectionProps {
  showDeleteConfirm: boolean;
  isExporting: boolean;
  isDeleting: boolean;
  exportMessage: {
    type: "success" | "error";
    text: string;
  } | null;
  deleteMessage: {
    type: "success" | "error";
    text: string;
  } | null;
  onExport: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
}

export default function DataPrivacySection({
  showDeleteConfirm,
  isExporting,
  isDeleting,
  exportMessage,
  deleteMessage,
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
          className="ct-button-primary h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors disabled:opacity-50"
        >
          Export My Data
        </LoadingButton>
        {exportMessage && (
          <p
            className={`px-1 text-sm ${
              exportMessage.type === "success"
                ? "text-zinc-700 dark:text-zinc-300"
                : "text-zinc-800 dark:text-zinc-200"
            }`}
            role={exportMessage.type === "error" ? "alert" : "status"}
            aria-live="polite"
          >
            {exportMessage.text}
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
          Download all your personal data in JSON format (meals, foods,
          settings).
        </p>

        {!showDeleteConfirm ? (
          <>
            <button
              type="button"
              data-testid="delete-account-button"
              onClick={onDeleteClick}
              className="ct-button-danger-subtle h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors"
            >
              Delete My Account
            </button>
            {deleteMessage && (
              <p
                className="px-1 text-sm text-zinc-800 dark:text-zinc-200"
                role={deleteMessage.type === "error" ? "alert" : "status"}
                aria-live="polite"
              >
                {deleteMessage.text}
              </p>
            )}
          </>
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
                className="ct-button-danger-solid h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Yes, Delete Everything
              </LoadingButton>
              <button
                type="button"
                data-testid="cancel-delete-button"
                onClick={onDeleteCancel}
                className="ct-button-secondary h-10 flex-1 rounded-lg px-4 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 flex gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <PendingLink
            href="/privacy"
            className="ct-link-accent underline hover:no-underline"
            pendingLabel="Loading privacy policy..."
            data-testid="privacy-policy-link"
          >
            Privacy Policy
          </PendingLink>
          <PendingLink
            href="/terms"
            className="ct-link-accent underline hover:no-underline"
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
