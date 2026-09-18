import { createClient } from "@/lib/supabase/server";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function OverviewPage() {
  const context = await getActiveWorkspace();
  const supabase = context?.supabase ?? createClient();
  const workspaceId = context?.workspace.id;

  const { data: pipeline } = await supabase.from("pipeline_entries").select("status, next_event_on").eq("workspace_id", workspaceId);
  const { data: wonThisMonth } = await supabase
    .from("budget_transactions")
    .select("amount")
    .eq("source", "pipeline")
    .eq("workspace_id", workspaceId)
    .gte("occurred_on", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10));

  const active = (pipeline ?? []).filter((e) => e.status === "sent" || e.status === "progress").length;
  const upcoming = (pipeline ?? []).filter((e) => e.next_event_on).length;
  const revenue = (wonThisMonth ?? []).reduce((s, t) => s + t.amount, 0);

  const stats = [
    { label: "Active in pipeline", value: String(active) },
    { label: "Won, this stretch", value: `$${revenue.toLocaleString()}` },
    { label: "Upcoming dates", value: String(upcoming) },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-line-strong bg-white/[0.02] px-5 py-4 shadow-[0_0_0_1px_rgba(255,255,255,0.015)]"
        >
          <div className="font-mono text-2xl text-gold sm:text-[28px]">{s.value}</div>
          <div className="mt-2 text-[12px] uppercase tracking-[0.12em] text-paper/55">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
