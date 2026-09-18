import { createClient } from "@/lib/supabase/server";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { getActiveWorkspace } from "@/lib/workspace";

export default async function PipelinePage() {
  const context = await getActiveWorkspace();
  const supabase = context?.supabase ?? createClient();
  const { data: entries } = await supabase
    .from("pipeline_entries")
    .select("*")
    .eq("workspace_id", context?.workspace.id)
    .order("sent_on", { ascending: false });

  return (
    <section>
      <div className="mb-4">
        <h2 className="font-display text-[28px] tracking-[-0.04em]">Pipeline</h2>
        <p className="mt-1 text-[13px] text-paper/60">
          Everything sent, in motion, or closed. Click a status to move it forward.
        </p>
      </div>
      <PipelineBoard initialEntries={entries ?? []} />
    </section>
  );
}
