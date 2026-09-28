-- Practical flat info shared on the Home Feed (Wi‑Fi, portal, bins, notes).

alter table public.homes
  add column if not exists wifi_ssid text,
  add column if not exists wifi_password text,
  add column if not exists portal_code text,
  add column if not exists bin_day text,
  add column if not exists notes text;

comment on column public.homes.wifi_ssid is 'Wi‑Fi network name for the flat.';
comment on column public.homes.wifi_password is 'Wi‑Fi password (visible to home members).';
comment on column public.homes.portal_code is 'Building portal / door code.';
comment on column public.homes.bin_day is 'Trash / recycling day or instructions.';
comment on column public.homes.notes is 'Free-form practical notes for roommates.';

-- Any member can update practical info (not name / invite_code).
create or replace function public.update_home_practical_info(
  p_home_id uuid,
  p_wifi_ssid text default null,
  p_wifi_password text default null,
  p_portal_code text default null,
  p_bin_day text default null,
  p_notes text default null
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

  if not public.is_home_member(p_home_id) then
    raise exception 'not a home member';
  end if;

  update public.homes
  set
    wifi_ssid = nullif(trim(coalesce(p_wifi_ssid, '')), ''),
    wifi_password = nullif(trim(coalesce(p_wifi_password, '')), ''),
    portal_code = nullif(trim(coalesce(p_portal_code, '')), ''),
    bin_day = nullif(trim(coalesce(p_bin_day, '')), ''),
    notes = nullif(trim(coalesce(p_notes, '')), ''),
    updated_at = timezone('utc', now())
  where id = p_home_id
  returning * into updated;

  if updated.id is null then
    raise exception 'home not found';
  end if;

  return updated;
end;
$$;

revoke all on function public.update_home_practical_info(uuid, text, text, text, text, text) from public;
grant execute on function public.update_home_practical_info(uuid, text, text, text, text, text) to authenticated;

comment on function public.update_home_practical_info(uuid, text, text, text, text, text) is
  'Members update shared flat practical info (Wi‑Fi, portal, bins, notes).';
