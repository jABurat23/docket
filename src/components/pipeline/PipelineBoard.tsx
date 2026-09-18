"use client";

import { useEffect, useRef, useState } from "react";
import type { PipelineEntry, PipelineStatus } from "@/lib/types";
import { readClientCache, writeClientCache } from "@/lib/client-cache";

const CYCLE: PipelineStatus[] = ["sent", "progress", "won", "rejected"];
const LABEL: Record<PipelineStatus, string> = {
  sent: "Sent",
  progress: "In progress",
  won: "Won",
  rejected: "Rejected",
};
const COLOR: Record<PipelineStatus, string> = {
  sent: "text-slate border-slate",
  progress: "text-gold border-gold",
  won: "text-sage border-sage",
  rejected: "text-rust border-rust",
};

const COLUMNS: { key: string; label: string; match: (s: PipelineStatus) => boolean }[] = [
  { key: "sent", label: "Sent", match: (s) => s === "sent" },
  { key: "progress", label: "In progress", match: (s) => s === "progress" },
  { key: "closed", label: "Closed", match: (s) => s === "won" || s === "rejected" },
];

export function PipelineBoard({ initialEntries }: { initialEntries: PipelineEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const hydratedCache = useRef(false);

  useEffect(() => {
    const cached = readClientCache<PipelineEntry[]>("pipeline-entries");
    if (cached) setEntries(cached);
    hydratedCache.current = true;
  }, []);

  useEffect(() => {
    if (hydratedCache.current) writeClientCache("pipeline-entries", entries);
  }, [entries]);

  async function cycleStatus(entry: PipelineEntry) {
    const index = CYCLE.indexOf(entry.status);
    if (index === -1) return;

    const next = CYCLE[(index + 1) % CYCLE.length] as PipelineStatus;

    // Optimistic update so the UI feels instant; the API call reconciles after.
    setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: next } : e)));

    const response = await fetch(`/api/pipeline/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!response.ok) {
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? entry : e)));
    }

  }

  async function deleteEntry(id: string) {
    if (!window.confirm("Delete this pipeline entry?")) return;
    const response = await fetch(`/api/pipeline/${id}`, { method: "DELETE" });
    if (response.ok) setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((col) => {
        const items = entries.filter((e) => col.match(e.status));
        return (
          <div key={col.key} className="panel-surface p-3.5 soft-hover">
            <div className="mb-3 flex items-center justify-between border-b border-line pb-2.5 text-[12px] text-paper/60">
              <span>{col.label}</span>
              <span className="rounded-full border border-line-strong bg-white/[0.02] px-1.5 py-0.5 text-[10.5px] text-paper/80">
                {items.length}
              </span>
            </div>

            {items.length === 0 && (
              <div className="rounded-lg border border-dashed border-line-strong px-3 py-6 text-center text-[12.5px] text-paper/50">
                Nothing here yet.
              </div>
            )}

            <div className="space-y-3">
              {items.map((e) => (
                <div key={e.id} className="rounded-xl border border-line-strong bg-white/[0.02] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[14px] font-medium">{e.title}</div>
                    <button onClick={() => deleteEntry(e.id)} className="text-[11px] text-paper/40 transition-colors hover:text-rust">
                      Delete
                    </button>
                    <div className="font-mono text-[10.5px] text-paper/55 whitespace-nowrap">
                      {new Date(e.sent_on).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-paper/60">
                      {e.type}
                      {e.amount > 0 ? ` · $${e.amount.toLocaleString()}` : ""}
                    </div>
                    <button
                      onClick={() => cycleStatus(e)}
                      className={`font-mono text-[10px] px-2 py-1 rounded-full border ${COLOR[e.status]}`}
                    >
                      {LABEL[e.status]}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
