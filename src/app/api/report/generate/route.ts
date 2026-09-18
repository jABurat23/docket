// Generates (or returns the cached) report for the current month.
// Called on page load rather than a cron job for now — see README for the
// Supabase Edge Function + pg_cron alternative that would run this automatically.
import { createClient } from "@/lib/supabase/server";
import { computeReport } from "@/lib/report";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthKey = monthStart.toISOString().slice(0, 10);

  const { data: existing } = await supabase
    .from("monthly_reports")
    .select("*")
    .eq("month", monthKey)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (existing) return NextResponse.json({ report: existing });

  const { data: transactions } = await supabase.from("budget_transactions").select("*").eq("workspace_id", workspace.id);
  const computed = computeReport(transactions ?? [], monthStart);

  const { data: report, error } = await supabase
    .from("monthly_reports")
    .insert({
      user_id: user.id,
      workspace_id: workspace.id,
      month: monthKey,
      total_income: computed.total_income,
      total_expenses: computed.total_expenses,
      net_saved: computed.net_saved,
      notes: computed.notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ report });
}
