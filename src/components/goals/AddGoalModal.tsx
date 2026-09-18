"use client";

import { useState } from "react";
import type { Goal } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

export function AddGoalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (goal: Goal) => void;
}) {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("A goal title is required.");
      return;
    }

    const current = Number(currentAmount);
    if (!Number.isFinite(current) || current < 0) {
      setError("Current amount must be a valid number.");
      return;
    }

    const target = targetAmount === "" ? null : Number(targetAmount);
    if (target !== null && (!Number.isFinite(target) || target <= 0)) {
      setError("Target amount must be a positive number.");
      return;
    }

    if (targetDate && Number.isNaN(Date.parse(targetDate))) {
      setError("Target date must be a valid date.");
      return;
    }

    setSaving(true);
    setError(null);

    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: trimmed,
        target_amount: target,
        current_amount: current,
        target_date: targetDate || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong.");
      return;
    }

    const { goal } = await res.json();
    onCreated(goal);
    onClose();
  }

  return (
    <Modal title="Add goal" onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Emergency fund"
            className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper"
          />
        </label>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
            Current amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
            Target amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="Optional"
              className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
          Target date
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper"
          />
        </label>

        {error && <p className="text-[12.5px] text-rust">{error}</p>}

        <div className="flex justify-end gap-2.5 mt-2">
          <button onClick={onClose} className="border border-line-strong rounded-sm px-4 py-2 text-[13px] text-paper/60">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="bg-gold border border-gold rounded-sm px-4 py-2 text-[13px] font-medium text-ink disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save goal"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
