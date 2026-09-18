"use client";

import { useState } from "react";
import type { BudgetCategory, BudgetTransaction, RecurringFrequency } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";

const CATEGORY_OPTIONS: { value: BudgetCategory; label: string }[] = [
  { value: "uncategorized", label: "Uncategorized" },
  { value: "income", label: "Income" },
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

export function AddBudgetEntryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (t: BudgetTransaction) => void;
}) {
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState<BudgetCategory>("uncategorized");
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextOn, setNextOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = description.trim();
    if (!trimmed) {
      setError("Description is required.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    setSaving(true);
    setError(null);

    const signedAmount = kind === "expense" ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
    const effectiveCategory = kind === "income" ? "income" : category;

    const res = await fetch("/api/budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: trimmed,
        amount: signedAmount,
        category: effectiveCategory,
        is_recurring: recurring,
        recurring_frequency: recurring ? frequency : null,
        recurring_next_on: recurring ? nextOn || null : null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Something went wrong.");
      return;
    }

    const { transaction } = await res.json();
    onCreated(transaction);
    onClose();
  }

  return (
    <Modal title="Add budget entry" onClose={onClose}>
      <div className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
          Description
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries, client payout"
            className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper"
          />
        </label>
        <div className="rounded-lg border border-line-strong bg-subtle p-3">
          <label className="flex items-center gap-2 text-[12px] text-paper/70">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Recurring transaction
          </label>
          {recurring && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className="bg-input border border-line-strong rounded-sm px-2.5 py-2 text-[13px] text-paper"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="date"
                value={nextOn}
                onChange={(e) => setNextOn(e.target.value)}
                className="bg-input border border-line-strong rounded-sm px-2.5 py-2 text-[13px] text-paper"
              />
            </div>
          )}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
            Type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "income" | "expense")}
              className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetCategory)}
              disabled={kind === "income"}
              className="bg-ink border border-line-strong rounded-sm px-2.5 py-2 text-[13.5px] text-paper disabled:opacity-50"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-[12px] text-paper/60">
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
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
            {saving ? "Adding…" : "Add entry"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
