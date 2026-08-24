-- Paso 3: RPCs for create/join home (invite flow bypasses member-only SELECT)

create or replace function public.create_home(p_name text)
returns public.homes
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

  return v_home;
end;
$$;

create or replace function public.get_home_by_invite_code(p_code text)
returns table (
  id uuid,
  name text,
  invite_code text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select h.id, h.name, h.invite_code
  from public.homes h
  where upper(h.invite_code) = upper(trim(p_code))
  limit 1;
end;
$$;

create or replace function public.join_home_by_invite_code(p_code text)
returns public.homes
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

  return v_home;
end;
$$;

grant execute on function public.create_home(text) to authenticated;
grant execute on function public.get_home_by_invite_code(text) to authenticated;
grant execute on function public.join_home_by_invite_code(text) to authenticated;
