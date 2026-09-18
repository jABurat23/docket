import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

function isValidDateString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !Number.isNaN(Date.parse(value));
}

export async function GET() {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, workspace } = context;
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ goals: data });
}

export async function POST(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const body = await request.json();
  const { title, target_amount, current_amount, target_date } = body;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const parsedCurrent = Number(current_amount ?? 0);
  if (!Number.isFinite(parsedCurrent) || parsedCurrent < 0) {
    return NextResponse.json({ error: "current_amount must be a valid non-negative number" }, { status: 400 });
  }

  const parsedTarget = target_amount === null || target_amount === undefined ? null : Number(target_amount);
  if (parsedTarget !== null && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
    return NextResponse.json({ error: "target_amount must be a positive number when provided" }, { status: 400 });
  }

  if (target_date !== null && target_date !== undefined && !isValidDateString(target_date)) {
    return NextResponse.json({ error: "target_date must be a valid ISO date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      user_id: user.id,
      workspace_id: workspace.id,
      title: title.trim(),
      target_amount: parsedTarget,
      current_amount: parsedCurrent,
      target_date: target_date ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ goal: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
  if (body.target_amount === null || (body.target_amount !== undefined && Number.isFinite(Number(body.target_amount)))) {
    updates.target_amount = body.target_amount === null ? null : Number(body.target_amount);
  }
  if (body.current_amount !== undefined && Number.isFinite(Number(body.current_amount))) updates.current_amount = Number(body.current_amount);
  if (body.target_date === null || (typeof body.target_date === "string" && !Number.isNaN(Date.parse(body.target_date)))) {
    updates.target_date = body.target_date;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  const { data, error } = await supabase.from("goals").update(updates).eq("id", body.id).eq("user_id", user.id).eq("workspace_id", workspace.id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ goal: data });
}

export async function DELETE(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;
  const { id } = await request.json();
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabase.from("goals").delete().eq("id", id).eq("user_id", user.id).eq("workspace_id", workspace.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
