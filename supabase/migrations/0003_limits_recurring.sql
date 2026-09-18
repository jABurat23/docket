alter table public.budget_transactions
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurring_frequency text,
  add column if not exists recurring_next_on date;

alter table public.budget_transactions
  add constraint budget_transactions_recurring_frequency_check
  check (recurring_frequency is null or recurring_frequency in ('weekly', 'monthly', 'quarterly', 'yearly'));

create table if not exists public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  monthly_limit numeric(12, 2) not null check (monthly_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

alter table public.budget_limits enable row level security;

create policy "budget limits: crud own" on public.budget_limits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists budget_limits_user_category_idx
  on public.budget_limits (user_id, category);
