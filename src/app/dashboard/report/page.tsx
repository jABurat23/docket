import { headers } from "next/headers";
import { ReportCard } from "@/components/report/ReportCard";

async function getReport() {
  try {
    const requestHeaders = headers();
    const host = requestHeaders.get("host");
    if (!host) return null;
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    const res = await fetch(`${protocol}://${host}/api/report/generate`, {
      headers: requestHeaders,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = await res.json();
    return body.report ?? null;
  } catch {
    return null;
  }
}

export default async function ReportPage() {
  const report = await getReport();

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-[28px] tracking-[-0.04em]">Monthly report</h2>
        <p className="mt-1 text-[13px] text-paper/60">
          Auto-generated from your budget at the start of each month.
        </p>
      </div>
      {report ? <ReportCard report={report} /> : (
        <p className="text-[13.5px] text-paper/60">Couldn't load the report — try refreshing.</p>
      )}
    </section>
  );
}
