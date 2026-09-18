import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

const VALID_CATEGORIES = [
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

export async function GET() {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, workspace } = context;

  const { data, error } = await supabase
    .from("budget_limits")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ limits: data });
}

export async function POST(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const body = await request.json();
  const { category, monthly_limit } = body;
  const amount = Number(monthly_limit);

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "category is invalid" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "monthly_limit must be a positive number" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("budget_limits")
    .upsert(
      {
        user_id: user.id,
        workspace_id: workspace.id,
        category,
        monthly_limit: amount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,category" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ limit: data });
}

export async function DELETE(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const { id } = await request.json();
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("budget_limits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("workspace_id", workspace.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
