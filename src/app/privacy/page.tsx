import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy",
  description: "How Docket handles account, authentication, and financial workspace data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="September 18, 2026">
      <p>
        Docket is a personal finance workspace for budgets, goals, reports, and work pipelines. This policy explains what information Docket handles, why it is handled, and the choices available to you.
      </p>

      <h2>Information we handle</h2>
      <p>
        When you sign in, Docket receives basic account and profile information from your selected authentication provider, such as your provider identifier, name, email address, and profile image when available. Docket stores the budget entries, goals, pipeline entries, reports, and profile preferences that you choose to enter.
      </p>
      <p>
        Google and GitHub identities may be connected to one Supabase authentication account when those providers use the same verified email. Docket keeps separate provider workspaces so records created under one selected provider are not shown in the other provider workspace.
      </p>

      <h2>How we use information</h2>
      <p>
        We use information to authenticate you, provide Docket features, save and display your workspace data, generate requested reports, maintain service security, diagnose errors, and respond to support requests. Docket does not sell personal information or use your financial entries for advertising.
      </p>

      <h2>Service providers</h2>
      <p>
        Docket uses Supabase for authentication, database storage, and row-level access controls. Docket may be hosted by a cloud hosting provider such as Vercel or Google Cloud. Google and GitHub process sign-in requests according to their own privacy policies. These providers may process information as necessary to provide their services.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        Docket uses authentication cookies to maintain your signed-in session and a provider-selection cookie to choose the active Google or GitHub workspace. The browser may also store theme, interface preferences, and short-lived cached dashboard data in local or session storage. You can clear these browser values, but doing so may sign you out or reset preferences.
      </p>

      <h2>Security and retention</h2>
      <p>
        Docket uses authenticated server requests, Supabase access policies, and security headers to protect workspace data. No online service can guarantee absolute security. Your information is retained while your account or stored records remain active, unless deletion is requested or a longer period is required for legitimate security or legal purposes.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update profile information, export your Docket data from the account settings, sign out, or request deletion of your account and stored records. To request assistance, contact the support email listed in the Docket Google Cloud OAuth consent-screen configuration.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy as Docket changes. The effective date above will be updated when material changes are made.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions should be sent to the support email listed in the app&apos;s Google Cloud OAuth configuration.
      </p>
    </LegalPage>
  );
}
