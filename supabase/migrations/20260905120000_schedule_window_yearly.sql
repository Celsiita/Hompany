-- Schedule window (starts_at + due_at) and yearly recurrence + all-day flag.

alter type public.task_recurrence add value if not exists 'YEARLY';
alter type public.expense_recurrence add value if not exists 'YEARLY';

alter table public.tasks
  add column if not exists starts_at timestamptz,
  add column if not exists all_day boolean not null default false;

alter table public.expenses
  add column if not exists starts_at timestamptz,
  add column if not exists all_day boolean not null default false;

alter table public.task_templates
  add column if not exists starts_at timestamptz,
  add column if not exists all_day boolean not null default false;

-- Backfill: window starts at local midnight of due day for DEADLINE,
-- or at due_at for EXECUTION (single-point legacy).
update public.tasks
set starts_at = case
  when due_mode = 'EXECUTION' then due_at
  else date_trunc('day', due_at at time zone 'UTC') at time zone 'UTC'
end
where starts_at is null and due_at is not null;

update public.expenses
set starts_at = case
  when due_mode = 'EXECUTION' then due_at
  else date_trunc('day', due_at at time zone 'UTC') at time zone 'UTC'
end
where starts_at is null and due_at is not null;

update public.task_templates
set starts_at = coalesce(starts_at, now())
where starts_at is null;

alter table public.tasks
  alter column starts_at set default now();

alter table public.expenses
  alter column starts_at set default now();

comment on column public.tasks.starts_at is
  'When the item becomes available to work on (activation).';
comment on column public.tasks.all_day is
  'When true, UI hides clock times; starts_at=00:00 and due_at=23:59 local.';
comment on column public.expenses.starts_at is
  'When the expense becomes available to settle.';
comment on column public.expenses.all_day is
  'When true, UI hides clock times; starts_at=00:00 and due_at=23:59 local.';
