import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, workspace } = context;
  const { data, error } = await supabase
    .from("pipeline_entries")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("sent_on", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entries: data });
}

export async function POST(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const body = await request.json();
  const { title, type, amount, next_event_on, next_event_note } = body;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (!type || !["freelance", "client_work", "audit", "financial"].includes(type)) {
    return NextResponse.json({ error: "type is invalid" }, { status: 400 });
  }

  const parsedAmount = typeof amount === "number" ? amount : Number(amount ?? 0);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ error: "amount must be a valid non-negative number" }, { status: 400 });
  }

  if (next_event_on !== undefined && next_event_on !== null && (typeof next_event_on !== "string" || Number.isNaN(Date.parse(next_event_on)))) {
    return NextResponse.json({ error: "next_event_on must be a valid date when provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pipeline_entries")
    .insert({
      user_id: user.id,
      workspace_id: workspace.id,
      title: title.trim(),
      type,
      amount: parsedAmount,
      next_event_on: next_event_on ?? null,
      next_event_note: typeof next_event_note === "string" ? next_event_note : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ entry: data }, { status: 201 });
}
