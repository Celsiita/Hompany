-- Account deletion, leave home, kick member (admin).

create or replace function public.leave_home(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_role public.home_member_role;
  v_owner_count integer;
  v_member_count integer;
  v_successor uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select role into v_role
  from public.home_members
  where home_id = p_home_id and user_id = v_user;

  if v_role is null then
    raise exception 'Not a member of this home';
  end if;

  if v_role = 'owner' then
    select count(*) into v_owner_count
    from public.home_members
    where home_id = p_home_id and role = 'owner';

    if v_owner_count <= 1 then
      select user_id into v_successor
      from public.home_members
      where home_id = p_home_id
        and user_id <> v_user
      order by case when role = 'admin' then 0 else 1 end, joined_at
      limit 1;

      if v_successor is not null then
        update public.home_members
        set role = 'owner'
        where home_id = p_home_id and user_id = v_successor;

        update public.homes
        set created_by = v_successor
        where id = p_home_id;
      end if;
    end if;
  end if;

  delete from public.home_members
  where home_id = p_home_id and user_id = v_user;

  select count(*) into v_member_count
  from public.home_members
  where home_id = p_home_id;

  if v_member_count = 0 then
    delete from public.homes where id = p_home_id;
    return;
  end if;

  insert into public.home_activity_events (
    home_id, actor_id, action, entity_type, entity_id, summary, payload
  )
  values (
    p_home_id,
    v_user,
    'MEMBER_LEAVE',
    'member',
    null,
    'Abandonó el piso',
    jsonb_build_object('user_id', v_user)
  );
end;
$$;

create or replace function public.kick_home_member(p_home_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.home_members;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_home_admin(p_home_id) then
    raise exception 'Only admins can remove members';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'Use leave_home to leave yourself';
  end if;

  select * into v_target
  from public.home_members
  where home_id = p_home_id and user_id = p_user_id;

  if v_target.id is null then
    raise exception 'Member not found';
  end if;

  if v_target.role = 'owner' then
    raise exception 'Cannot remove the home creator';
  end if;

  delete from public.home_members
  where home_id = p_home_id and user_id = p_user_id;

  insert into public.home_activity_events (
    home_id, actor_id, action, entity_type, entity_id, summary, payload
  )
  values (
    p_home_id,
    auth.uid(),
    'ADMIN_KICK',
    'member',
    v_target.id,
    'Expulsó a un compañero del piso',
    jsonb_build_object('user_id', p_user_id)
  );
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user uuid := auth.uid();
  v_home uuid;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  for v_home in
    select home_id from public.home_members where user_id = v_user
  loop
    perform public.leave_home(v_home);
  end loop;

  delete from public.profiles where id = v_user;
  delete from auth.users where id = v_user;
end;
$$;

grant execute on function public.leave_home(uuid) to authenticated;
grant execute on function public.kick_home_member(uuid, uuid) to authenticated;
grant execute on function public.delete_own_account() to authenticated;
