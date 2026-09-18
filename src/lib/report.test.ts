import { describe, expect, it } from "vitest";
import type { BudgetTransaction } from "@/lib/types";
import { computeReport } from "@/lib/report";

const transaction = (overrides: Partial<BudgetTransaction>): BudgetTransaction => ({
  id: "id",
  user_id: "user",
  description: "Transaction",
  amount: -10,
  occurred_on: "2026-09-10",
  category: "food",
  source: "manual",
  pipeline_entry_id: null,
  created_at: "2026-09-10T00:00:00.000Z",
  is_recurring: false,
  recurring_frequency: null,
  recurring_next_on: null,
  ...overrides,
});

describe("computeReport", () => {
  it("calculates income, expenses, savings, and category notes", () => {
    const result = computeReport(
      [
        transaction({ amount: 3000, category: "income" }),
        transaction({ amount: -500, category: "housing" }),
        transaction({ amount: -250, category: "food" }),
      ],
      new Date(2026, 8, 1),
    );

    expect(result.total_income).toBe(3000);
    expect(result.total_expenses).toBe(750);
    expect(result.net_saved).toBe(2250);
    expect(result.notes[0]).toContain("housing");
  });

  it("excludes transactions outside the requested month", () => {
    const result = computeReport(
      [transaction({ amount: 999, occurred_on: "2026-10-01" })],
      new Date(2026, 8, 1),
    );

    expect(result.total_income).toBe(0);
    expect(result.total_expenses).toBe(0);
    expect(result.net_saved).toBe(0);
    expect(result.notes[0]).toContain("balanced");
  });
});
