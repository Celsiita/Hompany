-- Fix create/join RPCs to return JSON (reliable over PostgREST).
-- Must DROP first: Postgres cannot change a function's return type in place.

drop function if exists public.create_home(text);
drop function if exists public.join_home_by_invite_code(text);

create function public.create_home(p_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home public.homes;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception 'Home name is required';
  end if;

  insert into public.homes (name, invite_code, created_by)
  values (trim(p_name), public.generate_invite_code(), v_user_id)
  returning * into v_home;

  insert into public.home_members (home_id, user_id, role, reputation_points)
  values (v_home.id, v_user_id, 'owner', 100);

  return row_to_json(v_home);
end;
$$;

create function public.join_home_by_invite_code(p_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_home public.homes;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_home
  from public.homes h
  where upper(h.invite_code) = upper(trim(p_code))
  limit 1;

  if v_home.id is null then
    raise exception 'Invalid invite code';
  end if;

  insert into public.home_members (home_id, user_id, role, reputation_points)
  values (v_home.id, v_user_id, 'member', 100)
  on conflict (home_id, user_id) do nothing;

  return row_to_json(v_home);
end;
$$;

grant execute on function public.create_home(text) to authenticated;
grant execute on function public.join_home_by_invite_code(text) to authenticated;
grant execute on function public.get_home_by_invite_code(text) to authenticated;
