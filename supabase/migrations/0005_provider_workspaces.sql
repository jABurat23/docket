create table if not exists public.docket_workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('google', 'github')),
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.docket_workspaces enable row level security;
create policy "workspaces: crud own" on public.docket_workspaces
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.docket_workspaces (user_id, provider)
select id, coalesce(raw_app_meta_data ->> 'provider', 'google')
from auth.users
on conflict (user_id, provider) do nothing;

alter table public.pipeline_entries add column if not exists workspace_id uuid references public.docket_workspaces (id) on delete cascade;
alter table public.budget_transactions add column if not exists workspace_id uuid references public.docket_workspaces (id) on delete cascade;
alter table public.budget_limits add column if not exists workspace_id uuid references public.docket_workspaces (id) on delete cascade;
alter table public.monthly_reports add column if not exists workspace_id uuid references public.docket_workspaces (id) on delete cascade;
alter table public.goals add column if not exists workspace_id uuid references public.docket_workspaces (id) on delete cascade;

update public.pipeline_entries entry
set workspace_id = workspace.id
from public.docket_workspaces workspace
where entry.workspace_id is null and workspace.user_id = entry.user_id;

update public.budget_transactions entry
set workspace_id = workspace.id
from public.docket_workspaces workspace
where entry.workspace_id is null and workspace.user_id = entry.user_id;

update public.budget_limits entry
set workspace_id = workspace.id
from public.docket_workspaces workspace
where entry.workspace_id is null and workspace.user_id = entry.user_id;

update public.monthly_reports entry
set workspace_id = workspace.id
from public.docket_workspaces workspace
where entry.workspace_id is null and workspace.user_id = entry.user_id;

update public.goals entry
set workspace_id = workspace.id
from public.docket_workspaces workspace
where entry.workspace_id is null and workspace.user_id = entry.user_id;

create index if not exists pipeline_entries_workspace_idx on public.pipeline_entries (workspace_id, status);
create index if not exists budget_transactions_workspace_idx on public.budget_transactions (workspace_id, occurred_on desc);
create index if not exists budget_limits_workspace_idx on public.budget_limits (workspace_id, category);
create index if not exists monthly_reports_workspace_idx on public.monthly_reports (workspace_id, month);
create index if not exists goals_workspace_idx on public.goals (workspace_id, target_date);
