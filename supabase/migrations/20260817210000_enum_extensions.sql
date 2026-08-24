-- Extend enums used by recurrence, roles and expense status.
-- New values are consumed in the following migration (same-transaction ADD VALUE limitation).

alter type public.home_member_role add value if not exists 'admin';
alter type public.task_recurrence add value if not exists 'MONTHLY';
alter type public.expense_recurrence add value if not exists 'DAILY';
alter type public.expense_recurrence add value if not exists 'WEEKLY';
alter type public.expense_status add value if not exists 'ARCHIVED';
