-- Docket: initial schema
-- Every table is scoped to a single user via user_id + Row Level Security,
-- so the database itself refuses to leak rows across users — the app code
-- never has to remember to filter by user_id manually.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
-- One row per authenticated user. Populated automatically on signup (see trigger below).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up (via OAuth).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- pipeline_entries ----------
create table if not exists public.pipeline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  type text not null check (type in ('freelance', 'client_work', 'audit', 'financial')),
  status text not null default 'sent' check (status in ('sent', 'progress', 'won', 'rejected')),
  amount numeric(12, 2) not null default 0,
  sent_on date not null default current_date,
  next_event_on date,
  next_event_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pipeline_entries enable row level security;

create policy "pipeline: crud own" on public.pipeline_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists pipeline_entries_user_status_idx
  on public.pipeline_entries (user_id, status);

-- ---------- budget_transactions ----------
create table if not exists public.budget_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  description text not null,
  amount numeric(12, 2) not null, -- positive = income, negative = expense
  occurred_on date not null default current_date,
  source text not null default 'manual' check (source in ('manual', 'imported', 'pipeline')),
  pipeline_entry_id uuid references public.pipeline_entries (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.budget_transactions enable row level security;

create policy "budget: crud own" on public.budget_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists budget_transactions_user_date_idx
  on public.budget_transactions (user_id, occurred_on desc);

-- ---------- monthly_reports ----------
-- Cached output of the auto-generated report, one row per user per month,
-- so the report only needs to be computed once and re-read after that.
create table if not exists public.monthly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  month date not null, -- always the 1st of the month
  total_income numeric(12, 2) not null,
  total_expenses numeric(12, 2) not null,
  net_saved numeric(12, 2) not null,
  notes jsonb not null default '[]',
  generated_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.monthly_reports enable row level security;

create policy "reports: crud own" on public.monthly_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- goals ----------
-- Schema is ready even though the UI is a placeholder for now.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  target_amount numeric(12, 2),
  current_amount numeric(12, 2) not null default 0,
  target_date date,
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "goals: crud own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
