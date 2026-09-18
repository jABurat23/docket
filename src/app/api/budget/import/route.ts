import { createClient } from "@/lib/supabase/server";
import { deduplicateImportedRows, inferCategory, normalizeCsvRows, parseCsvRows } from "@/lib/csv";
import { NextResponse } from "next/server";
import { getActiveWorkspace } from "@/lib/workspace";

export async function POST(request: Request) {
  const context = await getActiveWorkspace();
  if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { supabase, user, workspace } = context;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  const rows = parseCsvRows(await file.text());
  if (!rows.length) return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 });

  const normalizedRows = normalizeCsvRows(rows);
  if (!normalizedRows.length) return NextResponse.json({ error: "No valid rows found in the CSV" }, { status: 400 });

  const existingQuery = await supabase
    .from("budget_transactions")
    .select("description, amount, occurred_on")
    .eq("user_id", user.id)
    .eq("workspace_id", workspace.id)
    .eq("source", "imported");
  if (existingQuery.error) return NextResponse.json({ error: existingQuery.error.message }, { status: 400 });

  const newRows = deduplicateImportedRows(normalizedRows, existingQuery.data ?? []);
  if (!newRows.length) return NextResponse.json({ inserted: 0, skipped: normalizedRows.length });

  const transactions = newRows.map((row) => ({
    user_id: user.id,
    workspace_id: workspace.id,
    description: row.description,
    amount: row.amount,
    occurred_on: row.occurred_on,
    category: inferCategory(row.description),
    source: "imported",
  }));

  const { error } = await supabase.from("budget_transactions").insert(transactions);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ inserted: transactions.length, skipped: normalizedRows.length - transactions.length });
}
