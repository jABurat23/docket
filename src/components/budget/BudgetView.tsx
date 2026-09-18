"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BudgetCategory, BudgetRange, BudgetTransaction } from "@/lib/types";
import { AddBudgetEntryModal } from "@/components/budget/AddBudgetEntryModal";
import { BudgetLimitsPanel } from "@/components/budget/BudgetLimitsPanel";
import { readClientCache, writeClientCache } from "@/lib/client-cache";

function inRange(dateStr: string, range: BudgetRange) {
  const date = new Date(dateStr);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (range === "day") return daysAgo === 0;
  if (range === "week") return daysAgo <= 6;
  return daysAgo <= 30;
}

function money(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function BudgetView({ initialTransactions }: { initialTransactions: BudgetTransaction[] }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [range, setRange] = useState<BudgetRange>("day");
  const [modalOpen, setModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<BudgetCategory | "all">("all");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hydratedCache = useRef(false);

  useEffect(() => {
    const cached = readClientCache<BudgetTransaction[]>("budget-transactions");
    if (cached) setTransactions(cached);
    hydratedCache.current = true;
  }, []);

  useEffect(() => {
    if (hydratedCache.current) writeClientCache("budget-transactions", transactions);
  }, [transactions]);

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions
      .filter((transaction) => inRange(transaction.occurred_on, range))
      .filter((transaction) => categoryFilter === "all" || transaction.category === categoryFilter)
      .filter((transaction) => !normalizedQuery || `${transaction.description} ${transaction.category}`.toLowerCase().includes(normalizedQuery))
      .sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1));
  }, [transactions, range, query, categoryFilter]);

  const income = items.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = items.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  async function importCsv(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setImportError("Please choose a CSV file.");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    setImporting(true);
    setImportError(null);

    const res = await fetch("/api/budget/import", {
      method: "POST",
      body: form,
    });

    setImporting(false);

    if (!res.ok) {
      const body = await res.json();
      setImportError(body.error ?? "Import failed.");
      return;
    }

    const { inserted, skipped } = await res.json();
    const refreshed = await fetch("/api/budget");
    const refreshedBody = await refreshed.json();
    if (refreshedBody.transactions) {
      setTransactions(refreshedBody.transactions);
    }

    if (inputRef.current) inputRef.current.value = "";
    setImportError(null);
    if (inserted === 0) setImportError("No new transactions were imported; duplicate rows were skipped.");
    else if (skipped > 0) setImportError(`${inserted} imported. ${skipped} duplicate row${skipped === 1 ? "" : "s"} skipped.`);
  }

  function exportCsv() {
    const headers = ["date", "description", "amount", "category", "source", "recurring"];
    const rows = items.map((transaction) => [
      transaction.occurred_on,
      transaction.description,
      String(transaction.amount),
      transaction.category,
      transaction.source,
      transaction.is_recurring ? "yes" : "no",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.download = `docket-transactions-${range}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function deleteTransaction(id: string) {
    if (!window.confirm("Delete this transaction?")) return;
    const response = await fetch("/api/budget", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) setTransactions((prev) => prev.filter((transaction) => transaction.id !== id));
  }

  return (
    <div className="panel-surface p-4 soft-hover sm:p-5">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex gap-2 rounded-full border border-line-strong bg-white/[0.02] p-1">
          {(["day", "week", "month"] as BudgetRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                range === r ? "bg-gold text-ink" : "text-paper/60 hover:text-paper"
              }`}
            >
              {r === "day" ? "Today" : r === "week" ? "This week" : "This month"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-sm border border-line-strong bg-white/[0.02] px-3.5 py-2 text-[12.5px] text-paper transition-colors hover:border-gold hover:bg-gold/5"
          >
            + Add entry
          </button>

          <label className="cursor-pointer rounded-sm border border-line-strong bg-white/[0.02] px-3.5 py-2 text-[12.5px] text-paper transition-colors hover:border-gold hover:bg-gold/5">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importCsv(file);
              }}
            />
            {importing ? "Importing…" : "Import from bank (CSV)"}
          </label>
          <button
            onClick={exportCsv}
            disabled={!items.length}
            className="rounded-sm border border-line-strong bg-white/[0.02] px-3.5 py-2 text-[12.5px] text-paper transition-colors hover:border-gold hover:bg-gold/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search descriptions or categories"
          className="bg-input min-w-0 flex-1 rounded-sm border border-line-strong px-3.5 py-2.5 text-[12.5px] text-paper placeholder:text-paper/40"
        />
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value as BudgetCategory | "all")}
          className="bg-input rounded-sm border border-line-strong px-3.5 py-2.5 text-[12.5px] text-paper"
        >
          <option value="all">All categories</option>
          <option value="uncategorized">Uncategorized</option>
          <option value="income">Income</option>
          <option value="housing">Housing</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="utilities">Utilities</option>
          <option value="insurance">Insurance</option>
          <option value="health">Health</option>
          <option value="travel">Travel</option>
          <option value="software">Software</option>
          <option value="subscriptions">Subscriptions</option>
          <option value="taxes">Taxes</option>
          <option value="marketing">Marketing</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-line-strong bg-white/[0.02] p-3.5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">In</div>
          <div className="mt-2 font-mono text-xl text-gold">${money(income)}</div>
        </div>
        <div className="rounded-lg border border-line-strong bg-white/[0.02] p-3.5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">Out</div>
          <div className="mt-2 font-mono text-xl text-rust">${money(expenses)}</div>
        </div>
        <div className="rounded-lg border border-line-strong bg-white/[0.02] p-3.5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-paper/55">Net</div>
          <div className={`mt-2 font-mono text-xl ${income - expenses >= 0 ? "text-sage" : "text-rust"}`}>
            {income - expenses >= 0 ? "+" : "-"}${money(Math.abs(income - expenses))}
          </div>
        </div>
      </div>

      <BudgetLimitsPanel transactions={transactions} />

      {importError && <p className="mb-4 text-[12.5px] text-rust">{importError}</p>}

      <div className="overflow-hidden rounded-xl border border-line-strong bg-inset">
        {items.length === 0 && (
          <div className="px-4 py-5 text-[12.5px] text-paper/60 italic">Nothing logged in this range yet.</div>
        )}
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 text-[13.5px] last:border-b-0"
          >
            <div className="font-mono text-[11px] text-paper/60 w-14 shrink-0">
              {new Date(t.occurred_on).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate">{t.description}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {t.source === "pipeline" && (
                  <span className="rounded-full border border-gold px-1.5 py-0.5 text-[9.5px] text-gold">
                    pipeline
                  </span>
                )}
                {t.category && t.category !== "uncategorized" && (
                  <span className="rounded-full border border-line-strong px-1.5 py-0.5 text-[9.5px] text-paper/60">
                    {t.category}
                  </span>
                )}
                {t.is_recurring && (
                  <span className="rounded-full border border-sage px-1.5 py-0.5 text-[9.5px] text-sage">
                    recurring{t.recurring_frequency ? ` · ${t.recurring_frequency}` : ""}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`font-mono whitespace-nowrap ${t.amount > 0 ? "text-sage" : "text-rust"}`}>
                {t.amount > 0 ? "+" : "-"}${money(Math.abs(t.amount))}
              </div>
              <button onClick={() => deleteTransaction(t.id)} className="text-[11px] text-paper/40 transition-colors hover:text-rust" aria-label={`Delete ${t.description}`}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <AddBudgetEntryModal
          onClose={() => setModalOpen(false)}
          onCreated={(t) => setTransactions((prev) => [t, ...prev])}
        />
      )}
    </div>
  );
}
