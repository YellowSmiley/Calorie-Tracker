import PendingLink from "@/app/components/PendingLink";
import { Metadata } from "next";
import AppHeader from "@/app/components/AppHeader";

export const metadata: Metadata = {
  title: "Terms of Service - Calorie Tracker",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-zinc-50 pb-24 dark:bg-zinc-950">
      <AppHeader title="Terms of Service" />

      <div className="mx-auto w-full max-w-3xl p-4">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black sm:p-8">
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Last updated: 19 April 2026
          </p>

          <div className="space-y-8 text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Calorie Tracker (&quot;the Service&quot;),
                you agree to be bound by these Terms of Service. If you do not
                agree, you must not use the Service.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                2. Description of Service
              </h2>
              <p>
                Calorie Tracker is a personal nutrition tracking web application
                that allows you to log meals, track calorie and macronutrient
                intake, track weight, and manage custom food entries.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                3. Account Registration
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>
                  You must provide accurate and complete information when
                  creating an account.
                </li>
                <li>
                  You are responsible for maintaining the security of your
                  account credentials.
                </li>
                <li>
                  You must notify us immediately if you suspect any unauthorised
                  use of your account.
                </li>
                <li>
                  You must be at least 16 years old to create an account (in
                  accordance with UK data protection law).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                4. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>
                  Use the Service for any unlawful purpose or in violation of
                  any applicable law
                </li>
                <li>
                  Attempt to gain unauthorised access to the Service, other
                  accounts, or any related systems
                </li>
                <li>
                  Interfere with or disrupt the Service or its infrastructure
                </li>
                <li>
                  Upload malicious content or attempt to exploit vulnerabilities
                </li>
                <li>
                  Create multiple accounts to circumvent restrictions or bans
                </li>
                <li>
                  Submit abusive, hateful, threatening, or explicit content in
                  food names, reports, or any user-generated fields
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                5. User Content
              </h2>
              <p>
                You retain ownership of any data you submit to the Service
                (including custom foods and meal entries). By using the Service,
                you grant us a limited licence to store and process this data
                solely for the purpose of providing the Service to you.
              </p>
              <p className="mt-2">
                Admin users may create food entries that are visible to all
                users of the Service. Custom foods you create are only visible
                to you unless you are an admin.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                6. Moderation and Enforcement
              </h2>
              <p>
                To protect users and service quality, we may review reported
                content and apply moderation actions including warnings,
                restrictions, deactivation, and bans for serious or repeated
                violations.
              </p>
              <p className="mt-2">
                Accounts involved in abuse or ban evasion may be blocked,
                including by email and security signals where appropriate.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                7. Disclaimer
              </h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, whether express
                or implied.
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6">
                <li>
                  Calorie Tracker is <strong>not</strong> a medical or dietary
                  advice tool. Nutritional information is user-provided and may
                  not be accurate.
                </li>
                <li>
                  We do not guarantee that the Service will be uninterrupted,
                  error-free, or secure at all times.
                </li>
                <li>
                  You should consult a qualified healthcare professional before
                  making dietary decisions based on information from this
                  Service.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                8. Limitation of Liability
              </h2>
              <p>
                To the fullest extent permitted by law, we shall not be liable
                for any indirect, incidental, special, consequential, or
                punitive damages arising out of or relating to your use of the
                Service. Nothing in these terms excludes or limits our liability
                for death or personal injury caused by negligence, fraud, or any
                other liability that cannot be excluded under English law.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                9. Account Termination
              </h2>
              <p>
                You may delete your account at any time from the Settings page.
                Upon deletion, all of your personal data will be permanently
                removed. We reserve the right to suspend or terminate accounts
                that violate these terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                10. Privacy
              </h2>
              <p>
                Your use of the Service is also governed by our{" "}
                <PendingLink
                  href="/privacy"
                  className="ct-link-accent underline hover:no-underline"
                  pendingLabel="Loading privacy policy..."
                >
                  Privacy Policy
                </PendingLink>
                , which explains how we collect, use, and protect your personal
                data.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                11. Changes to These Terms
              </h2>
              <p>
                We may update these terms from time to time. Any changes will be
                posted on this page with an updated &quot;Last updated&quot;
                date. Continued use of the Service after changes are posted
                constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                12. Governing Law
              </h2>
              <p>
                These terms are governed by and construed in accordance with the
                laws of England and Wales. Any disputes shall be subject to the
                exclusive jurisdiction of the courts of England and Wales.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
                13. Contact
              </h2>
              <p>
                If you have any questions about these terms, please contact us
                at
                <a
                  href="mailto:privacy@masmith.uk"
                  className="ct-link-accent ml-1 underline hover:no-underline"
                >
                  privacy@masmith.uk
                </a>
                .
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
