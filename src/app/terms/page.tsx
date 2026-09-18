import { LegalPage } from "@/components/legal/LegalPage";

export const metadata = {
  title: "Terms of Service",
  description: "Terms for using the Docket personal finance workspace.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="September 18, 2026">
      <p>
        These Terms govern your use of Docket. By signing in to or using Docket, you agree to these Terms. If you do not agree, do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        Docket provides tools for recording budgets, goals, pipeline activity, imports, and personal reports. Features may change, be temporarily unavailable, or be limited during testing and maintenance.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You must be able to legally use the service in your location. You are responsible for using your own Google or GitHub account, keeping access to that account secure, and notifying us if you believe your account has been used without permission.
      </p>

      <h2>Your content</h2>
      <p>
        You retain ownership of the information you enter into Docket. You grant Docket the limited permission needed to store, process, display, back up, and generate requested reports from that information. Do not upload information you do not have the right to use.
      </p>

      <h2>Financial disclaimer</h2>
      <p>
        Docket is an organizational and record-keeping tool, not a bank, broker, accountant, financial adviser, or tax adviser. Reports, categories, suggestions, limits, and calculations may be incomplete or inaccurate. Do not rely on Docket as the sole basis for financial, investment, tax, or legal decisions.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You may not abuse, probe, overload, reverse engineer, interfere with, or attempt unauthorized access to Docket, its accounts, APIs, or infrastructure. You may not use the service for unlawful activity or to upload malicious content.
      </p>

      <h2>Third-party services</h2>
      <p>
        Docket relies on third-party services including Supabase, Google, GitHub, and its hosting provider. Their availability and terms are outside Docket&apos;s control, and their own terms may apply to your use of those services.
      </p>

      <h2>Availability and liability</h2>
      <p>
        Docket is provided on an “as available” and “as is” basis to the extent permitted by law. We do not guarantee uninterrupted availability, error-free calculations, or permanent retention of data. To the extent permitted by law, Docket is not liable for indirect losses, missed opportunities, financial decisions, or data loss resulting from use of the service.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        We may suspend or terminate access when necessary to protect the service, investigate abuse, comply with law, or discontinue Docket. You may stop using Docket at any time and request deletion of your stored data.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms as the service evolves. Continued use after an update means you accept the revised Terms. The effective date above identifies the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms should be sent to the support email listed in the app&apos;s Google Cloud OAuth configuration.
      </p>
    </LegalPage>
  );
}
