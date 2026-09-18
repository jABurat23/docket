"use client";

import { useEffect, useMemo, useState } from "react";
import type { BudgetCategory, BudgetLimit, BudgetTransaction } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

const CATEGORIES: { value: Exclude<BudgetCategory, "income" | "uncategorized">; label: string }[] = [
  { value: "housing", label: "Housing" },
  { value: "food", label: "Food" },
  { value: "transport", label: "Transport" },
  { value: "utilities", label: "Utilities" },
  { value: "insurance", label: "Insurance" },
  { value: "health", label: "Health" },
  { value: "travel", label: "Travel" },
  { value: "software", label: "Software" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "taxes", label: "Taxes" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

function money(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function BudgetLimitsPanel({ transactions }: { transactions: BudgetTransaction[] }) {
  const { showToast } = useToast();
  const [limits, setLimits] = useState<BudgetLimit[]>([]);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("food");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/budget/limits")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load budget limits.");
        return response.json();
      })
      .then((body) => setLimits(body.limits ?? []))
      .catch(() => showToast({ title: "Budget limits unavailable", description: "Apply migration 0003, then try again.", tone: "warning" }))
      .finally(() => setLoading(false));
  }, [showToast]);

  const spending = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return transactions.reduce<Record<string, number>>((totals, transaction) => {
      const date = new Date(transaction.occurred_on);
      if (date.getMonth() !== month || date.getFullYear() !== year || transaction.amount >= 0) return totals;
      const key = transaction.category ?? "other";
      totals[key] = (totals[key] ?? 0) + Math.abs(transaction.amount);
      return totals;
    }, {});
  }, [transactions]);

  async function saveLimit() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      showToast({ title: "Enter a valid limit", description: "The monthly limit must be greater than zero.", tone: "warning" });
      return;
    }

    setSaving(true);
    const response = await fetch("/api/budget/limits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, monthly_limit: parsed }),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok) {
      showToast({ title: "Could not save limit", description: body.error ?? "Try again.", tone: "warning" });
      return;
    }

    setLimits((current) => [...current.filter((limit) => limit.category !== category), body.limit]);
    setAmount("");
    showToast({ title: "Budget limit saved", description: `${category} is now capped at $${money(parsed)} per month.`, tone: "success" });
  }

  async function removeLimit(limit: BudgetLimit) {
    const response = await fetch("/api/budget/limits", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: limit.id }),
    });
    if (!response.ok) return;
    setLimits((current) => current.filter((item) => item.id !== limit.id));
    showToast({ title: "Budget limit removed", description: `${limit.category} no longer has a monthly cap.` });
  }

  return (
    <div className="mb-5 rounded-xl border border-line-strong bg-subtle p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">Monthly limits</div>
          <p className="mt-1 text-[12.5px] text-paper/60">Set guardrails for the categories that matter most.</p>
        </div>
        <div className="flex gap-2">
          <select value={category} onChange={(event) => setCategory(event.target.value as typeof category)} className="bg-input rounded-sm border border-line-strong px-2.5 py-2 text-[12px] text-paper">
            {CATEGORIES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" step="0.01" placeholder="$ limit" className="bg-input w-24 rounded-sm border border-line-strong px-2.5 py-2 text-[12px] text-paper" />
          <button onClick={saveLimit} disabled={saving} className="rounded-sm border border-gold bg-gold px-3 py-2 text-[12px] font-medium text-ink disabled:opacity-60">
            {saving ? "Saving…" : "Set"}
          </button>
        </div>
      </div>

      {loading && <div className="skeleton h-12 w-full" />}
      {!loading && limits.length === 0 && <div className="rounded-lg border border-dashed border-line-strong px-3 py-4 text-[12px] text-paper/50">No limits set yet.</div>}
      <div className="space-y-3">
        {limits.map((limit) => {
          const spent = spending[limit.category] ?? 0;
          const ratio = spent / limit.monthly_limit;
          const percent = Math.min(100, ratio * 100);
          const tone = ratio >= 1 ? "text-rust" : ratio >= 0.7 ? "text-gold" : "text-sage";
          return (
            <div key={limit.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[12px]">
                <div className="capitalize text-paper">{limit.category}</div>
                <div className={`font-mono ${tone}`}>${money(spent)} / ${money(limit.monthly_limit)}</div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper/10">
                <div className={`h-full ${ratio >= 1 ? "bg-rust" : ratio >= 0.7 ? "bg-gold" : "bg-sage"}`} style={{ width: `${percent}%` }} />
              </div>
              <div className="mt-1 flex items-center justify-between text-[10.5px] text-paper/45">
                <span>{ratio >= 1 ? "Over limit" : ratio >= 0.9 ? "Almost at limit" : ratio >= 0.7 ? "Watch spending" : "On track"}</span>
                <button onClick={() => removeLimit(limit)} className="hover:text-rust">Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
