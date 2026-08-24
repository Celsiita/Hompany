-- Share settlement workflow: PENDING → REQUESTED → SETTLED (creditor confirms)

create type public.expense_share_settlement_status as enum (
  'PENDING',
  'REQUESTED',
  'SETTLED'
);

alter table public.expense_shares
  add column settlement_status public.expense_share_settlement_status not null default 'PENDING';

update public.expense_shares
set settlement_status = 'SETTLED'
where is_settled = true;

alter table public.expense_shares
  drop column is_settled;

comment on column public.expense_shares.settlement_status is
  'PENDING = deuda abierta; REQUESTED = deudor pidió liquidar; SETTLED = acreedor confirmó.';
