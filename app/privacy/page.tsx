import { Metadata } from "next";
import PendingLink from "@/app/components/PendingLink";

export const metadata: Metadata = {
  title: "Privacy Policy - Calorie Tracker",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 pb-24">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
            Last updated: 25 January 2026
          </p>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-6 text-zinc-700 dark:text-zinc-300">
            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                1. Who We Are
              </h2>
              <p>
                Calorie Tracker (&quot;we&quot;, &quot;us&quot;,
                &quot;our&quot;) is a personal nutrition tracking web
                application operated by Michael Smith. We are the data
                controller for the personal data processed through this
                application.
              </p>
              <p className="mt-2">
                Contact:{" "}
                <a
                  href="mailto:privacy@masmith.uk"
                  className="underline hover:no-underline"
                >
                  privacy@masmith.uk
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                2. What Data We Collect
              </h2>
              <p>We collect and process the following personal data:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Account information:</strong> Name, email address, and
                  profile picture (if signing in via Google)
                </li>
                <li>
                  <strong>Authentication data:</strong> Hashed password (if
                  using email/password sign-in), OAuth tokens (if using Google
                  sign-in)
                </li>
                <li>
                  <strong>Nutritional data:</strong> Food diary entries, meal
                  logs, custom foods you create, and nutritional goals
                </li>
                <li>
                  <strong>Preferences:</strong> Measurement unit settings
                  (weight, volume, calorie, and macronutrient units)
                </li>
                <li>
                  <strong>Technical data:</strong> Session tokens and
                  authentication cookies necessary for the application to
                  function
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                3. How We Use Your Data
              </h2>
              <p>We process your personal data for the following purposes:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  To provide and maintain the calorie tracking service (legal
                  basis: contract performance)
                </li>
                <li>
                  To authenticate your identity and secure your account (legal
                  basis: contract performance and legitimate interest)
                </li>
                <li>
                  To send account-related emails such as verification and
                  password reset emails (legal basis: contract performance)
                </li>
                <li>
                  To protect against fraud, abuse, and security threats (legal
                  basis: legitimate interest)
                </li>
              </ul>
              <p className="mt-2">
                We do <strong>not</strong> use your data for marketing,
                profiling, automated decision-making, or selling to third
                parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                4. Cookies
              </h2>
              <p>
                We use only <strong>strictly necessary cookies</strong> that are
                essential for the application to function. These include:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Session cookie</strong> (
                  <code className="text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">
                    authjs.session-token
                  </code>
                  ): Keeps you signed in during your session
                </li>
                <li>
                  <strong>CSRF cookie</strong> (
                  <code className="text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">
                    authjs.csrf-token
                  </code>
                  ): Protects against cross-site request forgery attacks
                </li>
                <li>
                  <strong>Callback URL cookie</strong> (
                  <code className="text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">
                    authjs.callback-url
                  </code>
                  ): Handles authentication redirect flow
                </li>
                <li>
                  <strong>Cookie consent cookie</strong> (
                  <code className="text-sm bg-zinc-100 dark:bg-zinc-900 px-1 rounded">
                    cookie-consent
                  </code>
                  ): Remembers that you have acknowledged this cookie notice
                </li>
              </ul>
              <p className="mt-2">
                We do not use any analytics, advertising, or third-party
                tracking cookies. Because all our cookies are strictly necessary
                for the service to operate, they do not require your consent
                under the Privacy and Electronic Communications Regulations
                (PECR).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                5. Third Parties
              </h2>
              <p>
                We share data with the following third-party services only as
                necessary:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Google</strong> (OAuth authentication): If you sign in
                  with Google, we receive your name, email, and profile image
                  from Google. See{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Google&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong>Resend</strong> (email delivery): Used to send
                  verification and password reset emails. See{" "}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    Resend&apos;s Privacy Policy
                  </a>
                  .
                </li>
              </ul>
              <p className="mt-2">
                We do not sell, rent, or trade your personal data to any third
                party.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                6. Data Retention
              </h2>
              <p>
                We retain your personal data for as long as your account is
                active. When you delete your account, all of your personal data
                — including your profile, meal diary, custom foods, and
                preferences — is permanently deleted from our systems.
              </p>
              <p className="mt-2">
                Verification and password reset tokens are automatically deleted
                after they expire (typically within 24 hours).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                7. Data Security
              </h2>
              <p>
                We implement appropriate technical and organisational measures
                to protect your personal data, including:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  Passwords are hashed using bcrypt with a cost factor of 12
                </li>
                <li>All communication is encrypted via HTTPS/TLS</li>
                <li>
                  CSRF protection, rate limiting, and account lockout mechanisms
                  are in place
                </li>
                <li>
                  Verification and reset tokens are hashed using SHA-256 before
                  storage
                </li>
                <li>Security headers are applied to all responses</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                8. Your Rights
              </h2>
              <p>
                Under the UK General Data Protection Regulation (UK GDPR) and
                the Data Protection Act 2018, you have the following rights:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>
                  <strong>Right of access:</strong> You can download a copy of
                  all your personal data from the Settings page.
                </li>
                <li>
                  <strong>Right to rectification:</strong> You can update your
                  personal information through your account settings.
                </li>
                <li>
                  <strong>Right to erasure:</strong> You can delete your account
                  and all associated data from the Settings page.
                </li>
                <li>
                  <strong>Right to data portability:</strong> You can export
                  your data in a machine-readable format (JSON) from the
                  Settings page.
                </li>
                <li>
                  <strong>Right to restrict processing:</strong> Contact us at{" "}
                  <a
                    href="mailto:privacy@masmith.uk"
                    className="underline hover:no-underline"
                  >
                    privacy@masmith.uk
                  </a>
                  .
                </li>
                <li>
                  <strong>Right to object:</strong> Contact us at{" "}
                  <a
                    href="mailto:privacy@masmith.uk"
                    className="underline hover:no-underline"
                  >
                    privacy@masmith.uk
                  </a>
                  .
                </li>
              </ul>
              <p className="mt-2">
                If you are not satisfied with how we handle your data, you have
                the right to lodge a complaint with the Information
                Commissioner&apos;s Office (ICO):
              </p>
              <p className="mt-1">
                <a
                  href="https://ico.org.uk/make-a-complaint/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  https://ico.org.uk/make-a-complaint/
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                9. International Transfers
              </h2>
              <p>
                Your data is stored on servers that may be located outside the
                UK. Where data is transferred internationally, we ensure
                appropriate safeguards are in place in accordance with UK GDPR
                requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-black dark:text-zinc-50 mb-3">
                10. Changes to This Policy
              </h2>
              <p>
                We may update this privacy policy from time to time. Any changes
                will be posted on this page with an updated &quot;Last
                updated&quot; date. We encourage you to review this policy
                periodically.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <PendingLink
              href="/login"
              className="text-sm text-zinc-500 dark:text-zinc-400 underline hover:no-underline"
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
