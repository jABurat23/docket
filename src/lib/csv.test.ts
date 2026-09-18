import { describe, expect, it } from "vitest";
import {
  deduplicateImportedRows,
  inferCategory,
  normalizeCsvRows,
  parseCsvLine,
  parseCsvRows,
} from "@/lib/csv";

describe("CSV utilities", () => {
  it("parses quoted commas and escaped quotes", () => {
    expect(parseCsvLine('"Coffee, shop","A ""daily"" stop",12')).toEqual([
      "Coffee, shop",
      'A "daily" stop',
      "12",
    ]);
  });

  it("maps headers and normalizes debit rows", () => {
    const rows = parseCsvRows("date,memo,debit\n2026-09-01,\"Cafe, Central\",12.50");
    expect(normalizeCsvRows(rows)).toEqual([
      { description: "Cafe, Central", amount: -12.5, occurred_on: "2026-09-01" },
    ]);
  });

  it("infers useful categories", () => {
    expect(inferCategory("Monthly Spotify subscription")).toBe("software");
    expect(inferCategory("Client payout")).toBe("income");
    expect(inferCategory("Something unknown")).toBe("uncategorized");
  });

  it("skips existing and duplicate rows", () => {
    const rows = [
      { description: "Coffee", amount: -5, occurred_on: "2026-09-01" },
      { description: "Coffee", amount: -5, occurred_on: "2026-09-01" },
      { description: "Rent", amount: -100, occurred_on: "2026-09-01" },
    ];
    const existing = { description: "Rent", amount: -100, occurred_on: "2026-09-01" };
    expect(deduplicateImportedRows(rows, [existing])).toEqual([rows[0]]);
  });
});
