-- Member absences: date ranges when a flatmate is unavailable for task rotation.

create table public.member_absences (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_absences_dates_valid check (end_date >= start_date)
);

create index member_absences_home_id_idx on public.member_absences (home_id);
create index member_absences_user_dates_idx on public.member_absences (home_id, user_id, start_date, end_date);

alter table public.member_absences enable row level security;

create policy member_absences_select on public.member_absences
  for select
  using (public.is_home_member(home_id));

create policy member_absences_insert on public.member_absences
  for insert
  with check (
    public.is_home_member(home_id)
    and user_id = auth.uid()
  );

create policy member_absences_update on public.member_absences
  for update
  using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );

create policy member_absences_delete on public.member_absences
  for delete
  using (
    public.is_home_member(home_id)
    and (user_id = auth.uid() or public.is_home_admin(home_id))
  );
