// CRUD for budget transactions. All queries run under the caller's session,
// so Row Level Security (see 0001_init.sql) enforces that a user can only
// ever read or write their own rows — this route never has to check that itself.
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function GET() {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, workspace } = context;
  const { data, error } = await supabase
    .from("budget_transactions")
    .select("*")
    .order("occurred_on", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transactions: data });
}

const VALID_CATEGORIES = [
  "uncategorized",
  "income",
  "housing",
  "food",
  "transport",
  "utilities",
  "insurance",
  "health",
  "travel",
  "software",
  "subscriptions",
  "taxes",
  "marketing",
  "other",
] as const;

export async function POST(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, workspace, user } = context;

  const body = await request.json();
  const { description, amount, occurred_on, source, category, is_recurring, recurring_frequency, recurring_next_on } = body;

  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "amount must be a valid number" }, { status: 400 });
  }

  if (source !== undefined && source !== null && !["manual", "imported", "pipeline"].includes(source)) {
    return NextResponse.json({ error: "source is invalid" }, { status: 400 });
  }

  const effectiveCategory = category && VALID_CATEGORIES.includes(category) ? category : "uncategorized";

  const isoDate = occurred_on && typeof occurred_on === "string" ? occurred_on : new Date().toISOString().slice(0, 10);
  if (Number.isNaN(Date.parse(isoDate))) {
    return NextResponse.json({ error: "occurred_on must be a valid date" }, { status: 400 });
  }

  if (is_recurring && !["weekly", "monthly", "quarterly", "yearly"].includes(recurring_frequency)) {
    return NextResponse.json({ error: "recurring_frequency is required for recurring entries" }, { status: 400 });
  }
  if (recurring_next_on !== undefined && recurring_next_on !== null && Number.isNaN(Date.parse(recurring_next_on))) {
    return NextResponse.json({ error: "recurring_next_on must be a valid date" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budget_transactions")
    .insert({
      user_id: user.id,
      workspace_id: workspace.id,
      description: description.trim(),
      amount,
      occurred_on: isoDate,
      category: effectiveCategory,
      source: source ?? "manual",
      is_recurring: Boolean(is_recurring),
      recurring_frequency: is_recurring ? recurring_frequency : null,
      recurring_next_on: is_recurring ? recurring_next_on ?? null : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transaction: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.description === "string" && body.description.trim()) updates.description = body.description.trim();
  if (typeof body.amount === "number" && Number.isFinite(body.amount)) updates.amount = body.amount;
  if (typeof body.occurred_on === "string" && !Number.isNaN(Date.parse(body.occurred_on))) updates.occurred_on = body.occurred_on;
  if (typeof body.category === "string" && VALID_CATEGORIES.includes(body.category)) updates.category = body.category;
  if (typeof body.is_recurring === "boolean") updates.is_recurring = body.is_recurring;
  if (body.recurring_frequency === null || ["weekly", "monthly", "quarterly", "yearly"].includes(body.recurring_frequency)) {
    updates.recurring_frequency = body.recurring_frequency;
  }
  if (body.recurring_next_on === null || (typeof body.recurring_next_on === "string" && !Number.isNaN(Date.parse(body.recurring_next_on)))) {
    updates.recurring_next_on = body.recurring_next_on;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("budget_transactions")
    .update(updates)
    .eq("id", body.id)
    .eq("user_id", user.id)
    .eq("workspace_id", workspace.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ transaction: data });
}

export async function DELETE(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;
  const { id } = await request.json();
  if (typeof id !== "string" || !id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await supabase.from("budget_transactions").delete().eq("id", id).eq("user_id", user.id).eq("workspace_id", workspace.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
