import type { MonthlyReport } from "@/lib/types";

export function ReportCard({ report }: { report: MonthlyReport }) {
  const monthName = new Date(report.month).toLocaleDateString(undefined, { month: "long" });

  return (
    <div className="panel-surface p-5 soft-hover sm:p-6">
      <p className="mb-5 text-[13.5px] text-paper/60">
        Here's where {monthName} stands so far, generated from your logged and imported transactions.
      </p>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-line-strong bg-white/[0.02] p-4">
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">Income</div>
          <div className="mt-2 font-mono text-xl text-gold">${report.total_income.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-line-strong bg-white/[0.02] p-4">
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">Spent</div>
          <div className="mt-2 font-mono text-xl text-rust">${report.total_expenses.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-line-strong bg-white/[0.02] p-4">
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">Net saved</div>
          <div className={`mt-2 font-mono text-xl ${report.net_saved >= 0 ? "text-sage" : "text-rust"}`}>
            {report.net_saved >= 0 ? "+" : "-"}${Math.abs(report.net_saved).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line-strong bg-inset px-4 py-4 text-[13.5px] leading-relaxed">
        <div className="mb-2 text-paper/80">A few places to look, based on this month's pattern:</div>
        <ul className="list-disc space-y-2 pl-5 text-paper/70">
          {report.notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
