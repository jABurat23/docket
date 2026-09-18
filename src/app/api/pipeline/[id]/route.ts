// Handles status changes (the "cycle the pill" interaction from the mockup),
// and — the one place business logic lives outside a single table — when an
// entry is marked "won", it also drops a matching income row into the budget.
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const body = await request.json();
  const { status } = body;
  if (!status || !["sent", "progress", "won", "rejected"].includes(status)) {
    return NextResponse.json({ error: "status is invalid" }, { status: 400 });
  }

  const { data: entry, error } = await supabase
    .from("pipeline_entries")
    .update({
      status,
      ...(typeof body.title === "string" && body.title.trim() ? { title: body.title.trim() } : {}),
      ...(typeof body.amount === "number" && Number.isFinite(body.amount) ? { amount: body.amount } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .eq("workspace_id", workspace.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (status === "won" && entry.amount > 0) {
    const { data: existing } = await supabase
      .from("budget_transactions")
      .select("id")
      .eq("pipeline_entry_id", entry.id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("budget_transactions").insert({
        user_id: user.id,
        workspace_id: workspace.id,
        description: `Freelance payout — ${entry.title}`,
        amount: entry.amount,
        source: "pipeline",
        pipeline_entry_id: entry.id,
      });
    }
  }

  return NextResponse.json({ entry });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;
  const { error } = await supabase.from("pipeline_entries").delete().eq("id", params.id).eq("user_id", user.id).eq("workspace_id", workspace.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
