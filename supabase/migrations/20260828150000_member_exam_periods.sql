-- Exam / intensive study periods (silence mode — tasks still rotate normally).

create table public.member_exam_periods (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_exam_periods_dates_valid check (end_date >= start_date),
  constraint member_exam_periods_label_len check (char_length(trim(label)) >= 1)
);

create index member_exam_periods_home_id_idx on public.member_exam_periods (home_id);
create index member_exam_periods_user_dates_idx on public.member_exam_periods (home_id, user_id, start_date, end_date);

alter table public.member_exam_periods enable row level security;

create policy member_exam_periods_select on public.member_exam_periods
  for select
  using (public.is_home_member(home_id));

create policy member_exam_periods_insert on public.member_exam_periods
  for insert
  with check (
    public.is_home_member(home_id)
    and user_id = auth.uid()
  );

create policy member_exam_periods_update on public.member_exam_periods
  for update
  using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );

create policy member_exam_periods_delete on public.member_exam_periods
  for delete
  using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );
