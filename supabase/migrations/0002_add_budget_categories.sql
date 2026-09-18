alter table public.budget_transactions
  add column if not exists category text not null default 'uncategorized';

alter table public.budget_transactions
  add constraint budget_transactions_category_check
  check (category in (
    'uncategorized',
    'income',
    'housing',
    'food',
    'transport',
    'utilities',
    'insurance',
    'health',
    'travel',
    'software',
    'subscriptions',
    'taxes',
    'marketing',
    'other'
  ));

create index if not exists budget_transactions_user_category_idx
  on public.budget_transactions (user_id, category);
