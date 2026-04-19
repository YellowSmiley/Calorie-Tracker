import { Metadata } from "next";
import PendingLink from "@/app/components/PendingLink";
import AppHeader from "@/app/components/AppHeader";

export const metadata: Metadata = {
  title: "Privacy Policy - Calorie Tracker",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-24 dark:bg-zinc-950">
      <AppHeader title="Privacy Policy" />

      <div className="mx-auto w-full max-w-3xl p-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black sm:p-8">
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: 19 April 2026
          </p>

          <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                1. Who We Are
              </h2>
              <p>
                Calorie Tracker (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a nutrition tracking
                service. We are the data controller for personal data processed
                through this app.
              </p>
              <p className="mt-2">
                Contact email:
                <a
                  href="mailto:privacy@masmith.uk"
                  className="ct-link-accent ml-1 underline hover:no-underline"
                >
                  privacy@masmith.uk
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                2. Personal Data Collected
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Account details: name, email address, and profile image (if
                  using Google sign-in).
                </li>
                <li>
                  Authentication and security data: password hash for credentials
                  users, active sessions, security tokens, and last known sign-in
                  IP address.
                </li>
                <li>
                  Nutrition and app content: diary entries, saved meals, body
                  weight logs, meal favorites, and custom foods you create.
                </li>
                <li>
                  Preferences: calorie goal settings and unit preferences.
                </li>
                <li>
                  Moderation and safety records: reports submitted, black marks,
                  account status, and blacklist records where needed for abuse
                  prevention.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                3. How We Use Personal Data
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>To create and manage your account.</li>
                <li>To run calorie tracking and nutrition features.</li>
                <li>To send essential account emails such as verification and reset links.</li>
                <li>To protect the app against abuse, spam, and harmful content.</li>
                <li>To maintain security, reliability, and service integrity.</li>
              </ul>
              <p className="mt-2">
                We do not sell your personal data and we do not use your data for
                third-party advertising.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                4. Legal Bases
              </h2>
              <p>
                We process data under contract performance (to provide your
                account and app features), legal obligations, and legitimate
                interests (security, fraud prevention, and moderation).
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                5. Cookies and Sessions
              </h2>
              <p>
                We use strictly necessary cookies and session storage for sign-in,
                CSRF protection, and secure account access. We do not run
                behavioral advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                6. Sharing with Service Providers
              </h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Google OAuth, if you choose Google sign-in.
                </li>
                <li>
                  Email delivery provider for verification and password reset
                  messages.
                </li>
                <li>
                  Infrastructure providers used to host and secure the service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                7. Retention
              </h2>
              <p>
                We keep personal data while your account is active. If you delete
                your account, associated personal data is deleted except where
                retention is required for legal, security, or abuse-prevention
                reasons.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                8. Your Rights
              </h2>
              <p>
                Depending on your location, you may have rights to access,
                correct, delete, restrict, or export your data. To request help,
                email privacy@masmith.uk.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                9. Updates to This Policy
              </h2>
              <p>
                We may update this policy as the service evolves. The latest
                version is always posted on this page with the updated date.
              </p>
            </section>
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <PendingLink
              href="/login"
              className="ct-link-accent text-sm underline hover:no-underline"
              pendingLabel="Loading sign in..."
            >
              Back to sign in
            </PendingLink>
          </div>
        </div>
      </div>
    </div>
  );
}
