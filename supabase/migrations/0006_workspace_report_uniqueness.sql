alter table public.monthly_reports
  drop constraint if exists monthly_reports_user_id_month_key;

alter table public.monthly_reports
  add constraint monthly_reports_workspace_month_key unique (workspace_id, month);
