import type { BudgetCategory } from "@/lib/types";

export type NormalizedCsvTransaction = {
  description: string;
  amount: number;
  occurred_on: string;
};

const VALID_CATEGORIES: BudgetCategory[] = [
  "uncategorized",
  "income",
  "housing",
  "food",
  "transport",
  "utilities",
  "insurance",
  "health",
  "travel",
  "software",
  "subscriptions",
  "taxes",
  "marketing",
  "other",
];

export function inferCategory(description: string): BudgetCategory {
  const text = description.toLowerCase();

  if (/(rent|mortgage|apartment|lease|property)/.test(text)) return "housing";
  if (/(grocery|groceries|food|coffee|restaurant|eatery|dinner|lunch|breakfast|milk|produce)/.test(text)) return "food";
  if (/(uber|lyft|fuel|gas|train|bus|metro|parking|transport)/.test(text)) return "transport";
  if (/(electric|water|internet|phone|utility|gas bill|power)/.test(text)) return "utilities";
  if (/(insurance|premier|policy)/.test(text)) return "insurance";
  if (/(pharmacy|doctor|clinic|medical|health)/.test(text)) return "health";
  if (/(flight|hotel|airbnb|travel|trip)/.test(text)) return "travel";
  if (/(notion|slack|github|figma|vscode|software|subscription|saas)/.test(text)) return "software";
  if (/(subscription|membership|streaming|spotify|netflix|youtube)/.test(text)) return "subscriptions";
  if (/(tax|irs|vat|federal)/.test(text)) return "taxes";
  if (/(ad|ads|marketing|campaign|seo|social)/.test(text)) return "marketing";
  if (/(paycheck|salary|invoice|client payout|payout|revenue|income)/.test(text)) return "income";

  return "uncategorized";
}

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }

  cells.push(cell.trim());
  return cells;
}

export function parseCsvRows(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0] ?? "").map((header) => header.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = cells[index] ?? "";
      return row;
    }, {});
  });
}

export function normalizeCsvRows(rows: Record<string, string>[], today = new Date().toISOString().slice(0, 10)) {
  return rows
    .map((row): NormalizedCsvTransaction | null => {
      const descriptionValue = row.description ?? row.memo ?? row.name ?? row.payee ?? row.vendor ?? row.details ?? "Imported transaction";
      const amountCandidate = row.amount ?? row.total ?? row.debit ?? row.credit ?? "0";
      const dateValue = row.date ?? row.occurred_on ?? row.transaction_date ?? today;
      const amountText = String(amountCandidate).replace(/[$,]/g, "");
      const parsedAmount = Number(amountText);
      const description = String(descriptionValue).trim() || "Imported transaction";

      if (!Number.isFinite(parsedAmount)) return null;
      return {
        description,
        amount: row.debit && !row.amount && !row.total ? -Math.abs(parsedAmount) : parsedAmount,
        occurred_on: String(dateValue).trim() || today,
      };
    })
    .filter((row): row is NormalizedCsvTransaction => row !== null);
}

export function deduplicateImportedRows(
  rows: NormalizedCsvTransaction[],
  existingRows: NormalizedCsvTransaction[],
) {
  const existingKeys = new Set(existingRows.map((row) => `${row.occurred_on}|${row.amount}|${row.description.trim().toLowerCase()}`));
  const seenKeys = new Set<string>();

  return rows.filter((row) => {
    const key = `${row.occurred_on}|${row.amount}|${row.description.trim().toLowerCase()}`;
    if (existingKeys.has(key) || seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

export function isBudgetCategory(value: string): value is BudgetCategory {
  return VALID_CATEGORIES.includes(value as BudgetCategory);
}
