import { createClient } from "@/lib/supabase/server";
import { BudgetView } from "@/components/budget/BudgetView";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function BudgetPage() {
  const context = await getActiveWorkspace();
  const supabase = context?.supabase ?? createClient();
  const { data: transactions } = await supabase
    .from("budget_transactions")
    .select("*")
    .eq("workspace_id", context?.workspace.id)
    .order("occurred_on", { ascending: false });

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-[28px] tracking-[-0.04em]">Budget</h2>
        <p className="mt-1 text-[13px] text-paper/60">
          Day, week, or month — a mix of what you log yourself and what gets imported.
        </p>
      </div>
      <BudgetView initialTransactions={transactions ?? []} />
    </section>
  );
}
