-- Expense receipts, recurrence, and storage bucket

create type public.expense_recurrence as enum (
  'ONCE',
  'MONTHLY'
);

alter table public.expenses
  add column receipt_image_url text,
  add column recurrence public.expense_recurrence not null default 'ONCE';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'expense-receipts',
  'expense-receipts',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "expense_receipts_select_member"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "expense_receipts_insert_member"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'expense-receipts'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "expense_receipts_update_member"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "expense_receipts_delete_member"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'expense-receipts'
    and public.is_home_member(public.storage_home_id_from_path(name))
  );

create policy "expense_receipts_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'expense-receipts');
