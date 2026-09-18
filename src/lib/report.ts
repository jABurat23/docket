// Report generation logic, kept separate from the route handler so it can
// also be called from a scheduled job later (see README > Potential improvements).
import type { BudgetTransaction } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  income: "income",
  housing: "housing",
  food: "food",
  transport: "transport",
  utilities: "utilities",
  insurance: "insurance",
  health: "health",
  travel: "travel",
  software: "software",
  subscriptions: "subscriptions",
  taxes: "taxes",
  marketing: "marketing",
  other: "other",
  uncategorized: "uncategorized",
};

export function computeReport(transactions: BudgetTransaction[], monthStart: Date) {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const inMonth = transactions.filter((t) => {
    const d = new Date(t.occurred_on);
    return d >= monthStart && d < monthEnd;
  });

  const total_income = inMonth.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const total_expenses = inMonth.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const net_saved = total_income - total_expenses;

  const expensesByCategory = new Map<string, number>();
  for (const tr of inMonth) {
    if (tr.amount >= 0) continue;
    const category = CATEGORY_LABELS[tr.category] ?? "uncategorized";
    expensesByCategory.set(category, (expensesByCategory.get(category) ?? 0) + Math.abs(tr.amount));
  }

  const topCategory = [...expensesByCategory.entries()].sort((a, b) => b[1] - a[1])[0];

  const notes: string[] = [];
  if (topCategory) {
    notes.push(`Your biggest expense category this month was ${topCategory[0]}, at $${topCategory[1].toLocaleString()}.`);
  }

  if (total_income > 0) {
    notes.push("Consider moving a fixed share of new income straight into savings before discretionary spending.");
  }

  if (total_expenses > 0) {
    notes.push("Review recurring payments and see whether any subscriptions or services can be trimmed.");
  }

  if (net_saved < 0) {
    notes.push("Spending outpaced income this month — worth a closer look at the highest-volume categories.");
  }

  if (notes.length === 0) {
    notes.push("Your tracked cash flow is balanced this month — keep the habit going.");
  }

  return { total_income, total_expenses, net_saved, notes };
}
