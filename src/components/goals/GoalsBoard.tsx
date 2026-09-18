"use client";

import { useEffect, useRef, useState } from "react";
import type { Goal } from "@/lib/types";
import { AddGoalModal } from "@/components/goals/AddGoalModal";
import { readClientCache, writeClientCache } from "@/lib/client-cache";

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function GoalsBoard({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState(initialGoals);
  const [modalOpen, setModalOpen] = useState(false);
  const hydratedCache = useRef(false);

  useEffect(() => {
    const cached = readClientCache<Goal[]>("goals");
    if (cached) setGoals(cached);
    hydratedCache.current = true;
  }, []);

  useEffect(() => {
    if (hydratedCache.current) writeClientCache("goals", goals);
  }, [goals]);

  async function deleteGoal(id: string) {
    if (!window.confirm("Delete this goal?")) return;
    const response = await fetch("/api/goals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-paper/60">Track milestones and savings targets.</p>
        <button
          onClick={() => setModalOpen(true)}
          className="soft-hover rounded-sm border border-line-strong bg-white/[0.02] px-3.5 py-2 text-[12.5px]"
        >
          + Add goal
        </button>
      </div>

      {goals.length === 0 && (
        <div className="border border-dashed border-line-strong rounded-sm p-8.5 text-center text-paper/60 text-[13.5px]">
          No goals set up yet.
        </div>
      )}

      {goals.length > 0 && (
        <div className="space-y-3.5">
          {goals.map((goal) => {
            const hasTarget = typeof goal.target_amount === "number" && goal.target_amount > 0;
            const progress = hasTarget ? Math.min(100, (goal.current_amount / goal.target_amount!) * 100) : 0;
            const targetDate = goal.target_date
              ? new Date(goal.target_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "No target date";

            return (
              <div key={goal.id} className="border border-line-strong rounded-sm p-4.5 bg-white/[0.02]">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <div>
                    <div className="text-[15px] font-medium">{goal.title}</div>
                    <div className="text-[11.5px] text-paper/60 mt-1">Target: {targetDate}</div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="font-mono text-[12px] text-gold">
                      ${money(goal.current_amount)}
                      {hasTarget ? ` / $${money(goal.target_amount!)}` : ""}
                    </div>
                    <button onClick={() => deleteGoal(goal.id)} className="text-[11px] text-paper/40 transition-colors hover:text-rust">
                      Delete
                    </button>
                  </div>
                </div>

                {hasTarget && (
                  <div className="mb-2">
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gold" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-1.5 text-[11px] text-paper/60">{Math.round(progress)}% funded</div>
                  </div>
                )}

                {!hasTarget && (
                  <div className="text-[11.5px] text-paper/60">No dollar target set yet — this is just a milestone to keep in view.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <AddGoalModal
          onClose={() => setModalOpen(false)}
          onCreated={(goal) => setGoals((prev) => [goal, ...prev])}
        />
      )}
    </div>
  );
}
