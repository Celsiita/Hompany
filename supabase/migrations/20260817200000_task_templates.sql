-- Reusable task templates (library) + link from live instances

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------

create table public.task_templates (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  title text not null,
  description text,
  category public.task_category not null default 'QUICK',
  icon text not null default 'checklist',
  recurrence public.task_recurrence not null default 'ONCE',
  points_value integer not null default 10,
  -- DAILY/WEEKLY auto-spawn while true. ONCE ignores this and always lives in the library.
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_templates_home_id_idx on public.task_templates (home_id);
create index task_templates_home_id_active_idx on public.task_templates (home_id, is_active);

create trigger task_templates_set_updated_at
  before update on public.task_templates
  for each row execute function public.set_updated_at();

alter table public.task_templates enable row level security;

create policy "task_templates_select_member"
  on public.task_templates for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "task_templates_insert_member"
  on public.task_templates for insert
  to authenticated
  with check (public.is_home_member(home_id));

create policy "task_templates_update_member"
  on public.task_templates for update
  to authenticated
  using (public.is_home_member(home_id))
  with check (public.is_home_member(home_id));

create policy "task_templates_delete_member"
  on public.task_templates for delete
  to authenticated
  using (public.is_home_member(home_id));

grant select, insert, update, delete on table public.task_templates to authenticated;

-- ---------------------------------------------------------------------------
-- Template assignees
-- ---------------------------------------------------------------------------

create table public.task_template_assignees (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes (id) on delete cascade,
  template_id uuid not null references public.task_templates (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (template_id, user_id)
);

create index task_template_assignees_home_id_idx on public.task_template_assignees (home_id);
create index task_template_assignees_template_id_idx on public.task_template_assignees (template_id);

alter table public.task_template_assignees enable row level security;

create policy "task_template_assignees_select_member"
  on public.task_template_assignees for select
  to authenticated
  using (public.is_home_member(home_id));

create policy "task_template_assignees_insert_member"
  on public.task_template_assignees for insert
  to authenticated
  with check (public.is_home_member(home_id));

create policy "task_template_assignees_delete_member"
  on public.task_template_assignees for delete
  to authenticated
  using (public.is_home_member(home_id));

grant select, insert, update, delete on table public.task_template_assignees to authenticated;

-- ---------------------------------------------------------------------------
-- Link instances → templates
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column template_id uuid references public.task_templates (id) on delete set null;

create index tasks_home_id_template_id_idx on public.tasks (home_id, template_id);

create unique index tasks_one_open_instance_per_template_idx
  on public.tasks (template_id)
  where template_id is not null
    and status in ('PENDING', 'SUBMITTED', 'OVERDUE');

-- Backfill one template per existing instance
do $$
declare
  t record;
  v_template_id uuid;
begin
  for t in
    select *
    from public.tasks
    where template_id is null
  loop
    insert into public.task_templates (
      home_id,
      title,
      description,
      category,
      icon,
      recurrence,
      points_value,
      is_active
    )
    values (
      t.home_id,
      t.title,
      t.description,
      t.category,
      t.icon,
      t.recurrence,
      t.points_value,
      t.recurrence in ('DAILY', 'WEEKLY')
        and t.status in ('PENDING', 'SUBMITTED', 'OVERDUE')
    )
    returning id into v_template_id;

    update public.tasks
    set
      template_id = v_template_id,
      is_template = false
    where id = t.id;
  end loop;
end $$;

insert into public.task_template_assignees (home_id, template_id, user_id)
select t.home_id, t.template_id, ta.user_id
from public.task_assignees ta
join public.tasks t on t.id = ta.task_id
where t.template_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Default seed: templates + first board instance
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_home_tasks(p_home_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_template_id uuid;
begin
  if exists (select 1 from public.task_templates tt where tt.home_id = p_home_id)
     or exists (select 1 from public.tasks t where t.home_id = p_home_id) then
    return;
  end if;

  for r in
    select *
    from (
      values
        ('Cocina', 'Mantener la cocina limpia y ordenada.', 'ZONE'::public.task_category, 'fork.knife', 15, 'WEEKLY'::public.task_recurrence, interval '2 days'),
        ('Baño', 'Limpiar baño y reponer lo básico.', 'ZONE'::public.task_category, 'shower', 15, 'WEEKLY'::public.task_recurrence, interval '2 days'),
        ('Salón', 'Ordenar y aspirar el salón.', 'ZONE'::public.task_category, 'sofa', 15, 'WEEKLY'::public.task_recurrence, interval '3 days'),
        ('Bajar la Basura', 'Sacar la basura de todas las papeleras.', 'QUICK'::public.task_category, 'trash', 10, 'DAILY'::public.task_recurrence, interval '1 day'),
        ('Reponer Papel Higiénico', 'Dejar al menos un rollo de reserva.', 'QUICK'::public.task_category, 'roll', 5, 'WEEKLY'::public.task_recurrence, interval '2 days')
    ) as v(title, description, category, icon, points_value, recurrence, due_offset)
  loop
    insert into public.task_templates (
      home_id, title, description, category, icon, recurrence, points_value, is_active
    )
    values (
      p_home_id, r.title, r.description, r.category, r.icon, r.recurrence, r.points_value, true
    )
    returning id into v_template_id;

    insert into public.tasks (
      home_id,
      title,
      description,
      category,
      icon,
      status,
      due_at,
      points_value,
      recurrence,
      is_template,
      template_id
    )
    values (
      p_home_id,
      r.title,
      r.description,
      r.category,
      r.icon,
      'PENDING',
      now() + r.due_offset,
      r.points_value,
      r.recurrence,
      false,
      v_template_id
    );
  end loop;
end;
$$;
