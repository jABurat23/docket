// Shared types, mirroring the database schema in supabase/migrations/0001_init.sql.
// Keeping these in one place means a schema change only needs updating here,
// not hunted down across every component that touches the data.

export type PipelineType = "freelance" | "client_work" | "audit" | "financial";
export type PipelineStatus = "sent" | "progress" | "won" | "rejected";
export type TransactionSource = "manual" | "imported" | "pipeline";
export type BudgetRange = "day" | "week" | "month";
export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface PipelineEntry {
  id: string;
  user_id: string;
  title: string;
  type: PipelineType;
  status: PipelineStatus;
  amount: number;
  sent_on: string; // ISO date
  next_event_on: string | null;
  next_event_note: string | null;
  created_at: string;
  updated_at: string;
}

export type BudgetCategory =
  | "uncategorized"
  | "income"
  | "housing"
  | "food"
  | "transport"
  | "utilities"
  | "insurance"
  | "health"
  | "travel"
  | "software"
  | "subscriptions"
  | "taxes"
  | "marketing"
  | "other";

export interface BudgetTransaction {
  id: string;
  user_id: string;
  description: string;
  amount: number; // positive = income, negative = expense
  occurred_on: string; // ISO date
  category: BudgetCategory;
  source: TransactionSource;
  pipeline_entry_id: string | null;
  created_at: string;
  is_recurring: boolean;
  recurring_frequency: RecurringFrequency | null;
  recurring_next_on: string | null;
}

export interface BudgetLimit {
  id: string;
  user_id: string;
  category: BudgetCategory;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyReport {
  id: string;
  user_id: string;
  month: string; // ISO date, first of month
  total_income: number;
  total_expenses: number;
  net_saved: number;
  notes: string[];
  generated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number | null;
  current_amount: number;
  target_date: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}
