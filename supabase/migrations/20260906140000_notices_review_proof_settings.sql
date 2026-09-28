-- Proof settings, review comments, floor notices (feed + agenda).

-- ---------------------------------------------------------------------------
-- Homes: proof policy for the whole flat
-- ---------------------------------------------------------------------------

alter table public.homes
  add column if not exists proof_mode text not null default 'OPTIONAL'
    check (proof_mode in ('OPTIONAL', 'REQUIRED')),
  add column if not exists proof_capture text not null default 'CAMERA_OR_GALLERY'
    check (proof_capture in ('CAMERA_OR_GALLERY', 'CAMERA_ONLY'));

comment on column public.homes.proof_mode is 'OPTIONAL = skip allowed; REQUIRED = photo mandatory.';
comment on column public.homes.proof_capture is 'CAMERA_ONLY = no gallery; CAMERA_OR_GALLERY = either.';

create or replace function public.update_home_proof_settings(
  p_home_id uuid,
  p_proof_mode text,
  p_proof_capture text
)
returns public.homes
language plpgsql
security definer
set search_path = public
as $$
declare
  updated public.homes;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.is_home_admin(p_home_id) then
    raise exception 'admin required';
  end if;
  if p_proof_mode not in ('OPTIONAL', 'REQUIRED') then
    raise exception 'invalid proof_mode';
  end if;
  if p_proof_capture not in ('CAMERA_OR_GALLERY', 'CAMERA_ONLY') then
    raise exception 'invalid proof_capture';
  end if;

  update public.homes
  set
    proof_mode = p_proof_mode,
    proof_capture = p_proof_capture,
    updated_at = timezone('utc', now())
  where id = p_home_id
  returning * into updated;

  if updated.id is null then
    raise exception 'home not found';
  end if;
  return updated;
end;
$$;

revoke all on function public.update_home_proof_settings(uuid, text, text) from public;
grant execute on function public.update_home_proof_settings(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Task review comments + echo on task for assignee banner
-- ---------------------------------------------------------------------------

alter table public.task_reviews
  add column if not exists comment text;

alter table public.tasks
  add column if not exists review_note text,
  add column if not exists review_note_kind text
    check (review_note_kind is null or review_note_kind in ('DISPUTE', 'APPROVE'));

comment on column public.tasks.review_note is 'Latest peer review comment shown to assignee.';
comment on column public.tasks.review_note_kind is 'DISPUTE requires fix; APPROVE is a suggestion.';

-- ---------------------------------------------------------------------------
-- Home notices: rules/complaints (feed) + visits/repairs/events (agenda)
-- ---------------------------------------------------------------------------

create type public.home_notice_kind as enum (
  'RULE',
  'COMPLAINT',
  'VISIT',
  'REPAIR',
  'EVENT'
);

create table public.home_notices (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  kind public.home_notice_kind not null,
  title text not null check (char_length(trim(title)) > 0),
  body text,
  is_anonymous boolean not null default false,
  author_id uuid references public.profiles (id) on delete set null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint home_notices_date_order check (
    starts_on is null or ends_on is null or ends_on >= starts_on
  ),
  constraint home_notices_calendar_dates check (
    kind in ('RULE', 'COMPLAINT')
    or (starts_on is not null and ends_on is not null)
  )
);

create index home_notices_home_id_idx on public.home_notices (home_id, created_at desc);
create index home_notices_home_dates_idx on public.home_notices (home_id, starts_on, ends_on)
  where starts_on is not null;

create trigger home_notices_set_updated_at
  before update on public.home_notices
  for each row execute function public.set_updated_at();

alter table public.home_notices enable row level security;

create policy "home_notices_select_member"
  on public.home_notices for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "home_notices_insert_member"
  on public.home_notices for insert
  to authenticated
  with check (
    public.is_home_member(home_id)
    and (author_id = auth.uid() or author_id is null)
  );

create policy "home_notices_update_author_or_admin"
  on public.home_notices for update
  to authenticated
  using (
    public.is_home_member(home_id)
    and (author_id = auth.uid() or public.is_home_admin(home_id))
  )
  with check (
    public.is_home_member(home_id)
    and (author_id = auth.uid() or public.is_home_admin(home_id))
  );

create policy "home_notices_delete_author_or_admin"
  on public.home_notices for delete
  to authenticated
  using (
    public.is_home_member(home_id)
    and (author_id = auth.uid() or public.is_home_admin(home_id))
  );

grant select, insert, update, delete on table public.home_notices to authenticated;
