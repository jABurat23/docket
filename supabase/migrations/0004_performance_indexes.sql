create index if not exists budget_transactions_user_source_date_idx
  on public.budget_transactions (user_id, source, occurred_on desc);

create index if not exists budget_transactions_user_recurring_idx
  on public.budget_transactions (user_id, is_recurring, recurring_next_on);

create index if not exists goals_user_target_date_idx
  on public.goals (user_id, target_date);

create index if not exists pipeline_entries_user_event_idx
  on public.pipeline_entries (user_id, next_event_on);
