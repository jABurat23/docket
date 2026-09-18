import { createClient } from "@/lib/supabase/server";
import { GoalsBoard } from "@/components/goals/GoalsBoard";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function GoalsPage() {
  const context = await getActiveWorkspace();
  const supabase = context?.supabase ?? createClient();
  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("workspace_id", context?.workspace.id)
    .order("created_at", { ascending: false });

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-[28px] tracking-[-0.04em]">Goals</h2>
        <p className="mt-1 text-[13px] text-paper/60">Track your savings and milestone targets.</p>
      </div>
      <GoalsBoard initialGoals={goals ?? []} />
    </section>
  );
}
