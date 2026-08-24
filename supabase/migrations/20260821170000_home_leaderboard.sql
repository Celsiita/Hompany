-- Home leaderboard: one round-trip aggregate of reputation + per-member task metrics.

create or replace function public.get_home_leaderboard(p_home_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  reputation_points integer,
  rank bigint,
  tasks_pending integer,
  tasks_submitted integer,
  tasks_completed integer,
  tasks_overdue integer,
  task_points_earned integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.is_home_member(p_home_id) then
    raise exception 'not a home member';
  end if;

  return query
  with members as (
    select
      hm.user_id,
      hm.reputation_points,
      coalesce(nullif(trim(p.display_name), ''), 'Compañero') as display_name,
      p.avatar_url
    from public.home_members hm
    join public.profiles p on p.id = hm.user_id
    where hm.home_id = p_home_id
  ),
  assigned as (
    select
      t.assigned_to as user_id,
      count(*) filter (where t.status = 'PENDING')::integer as tasks_pending,
      count(*) filter (where t.status = 'SUBMITTED')::integer as tasks_submitted,
      count(*) filter (where t.status = 'OVERDUE')::integer as tasks_overdue
    from public.tasks t
    where t.home_id = p_home_id
      and t.assigned_to is not null
    group by t.assigned_to
  ),
  completed as (
    select
      t.completed_by as user_id,
      count(*)::integer as tasks_completed,
      coalesce(sum(t.points_value), 0)::integer as task_points_earned
    from public.tasks t
    where t.home_id = p_home_id
      and t.completed_by is not null
      and t.status in ('COMPLETED', 'RESOLVED_LATE', 'RESOLVED_BY_PEER')
    group by t.completed_by
  ),
  ranked as (
    select
      m.user_id,
      m.display_name,
      m.avatar_url,
      m.reputation_points,
      coalesce(a.tasks_pending, 0) as tasks_pending,
      coalesce(a.tasks_submitted, 0) as tasks_submitted,
      coalesce(c.tasks_completed, 0) as tasks_completed,
      coalesce(a.tasks_overdue, 0) as tasks_overdue,
      coalesce(c.task_points_earned, 0) as task_points_earned,
      rank() over (
        order by
          m.reputation_points desc,
          coalesce(c.task_points_earned, 0) desc,
          coalesce(c.tasks_completed, 0) desc,
          m.display_name asc
      ) as rank
    from members m
    left join assigned a on a.user_id = m.user_id
    left join completed c on c.user_id = m.user_id
  )
  select
    r.user_id,
    r.display_name,
    r.avatar_url,
    r.reputation_points,
    r.rank,
    r.tasks_pending,
    r.tasks_submitted,
    r.tasks_completed,
    r.tasks_overdue,
    r.task_points_earned
  from ranked r
  order by r.rank asc, r.display_name asc;
end;
$$;

revoke all on function public.get_home_leaderboard(uuid) from public;
grant execute on function public.get_home_leaderboard(uuid) to authenticated;

comment on function public.get_home_leaderboard(uuid) is
  'Returns home members ranked by reputation_points, with assigned/completed task aggregates.';
