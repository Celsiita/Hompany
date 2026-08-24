-- Local development seed for HOMPANY.
-- Applied after migrations on `supabase db reset` / `supabase start`.
-- Test users: password for all is `password123`

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Auth users (Supabase local)
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'ana@hompany.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Ana"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'bruno@hompany.local',
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Bruno"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

-- Identities required for email login in GoTrue
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    format('{"sub":"%s","email":"ana@hompany.local"}', '11111111-1111-1111-1111-111111111111')::jsonb,
    'email',
    '11111111-1111-1111-1111-111111111111',
    now(),
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    format('{"sub":"%s","email":"bruno@hompany.local"}', '22222222-2222-2222-2222-222222222222')::jsonb,
    'email',
    '22222222-2222-2222-2222-222222222222',
    now(),
    now(),
    now()
  );

-- Profiles are created by trigger on auth.users insert.
-- Ensure display names are set (idempotent if trigger already ran).
update public.profiles
set display_name = 'Ana'
where id = '11111111-1111-1111-1111-111111111111';

update public.profiles
set display_name = 'Bruno'
where id = '22222222-2222-2222-2222-222222222222';

-- ---------------------------------------------------------------------------
-- Demo home + memberships
-- ---------------------------------------------------------------------------

insert into public.homes (id, name, invite_code, created_by)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Piso Demo',
  'DEMO2026',
  '11111111-1111-1111-1111-111111111111'
);

insert into public.home_members (home_id, user_id, role, reputation_points)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'owner',
    118
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '22222222-2222-2222-2222-222222222222',
    'member',
    92
  );

-- ---------------------------------------------------------------------------
-- Demo tasks (default seed + assignees)
-- ---------------------------------------------------------------------------

select public.seed_default_home_tasks('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
select public.seed_default_home_expenses('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Assign demo members to a couple of tasks
insert into public.task_assignees (home_id, task_id, user_id)
select t.home_id, t.id, '11111111-1111-1111-1111-111111111111'
from public.tasks t
where t.home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and t.title in ('Cocina', 'Bajar la Basura')
on conflict do nothing;

insert into public.task_assignees (home_id, task_id, user_id)
select t.home_id, t.id, '22222222-2222-2222-2222-222222222222'
from public.tasks t
where t.home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and t.title in ('Baño', 'Reponer Papel Higiénico')
on conflict do nothing;

insert into public.task_template_assignees (home_id, template_id, user_id)
select t.home_id, t.template_id, ta.user_id
from public.task_assignees ta
join public.tasks t on t.id = ta.task_id
where t.home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and t.template_id is not null
on conflict do nothing;

update public.tasks
set
  assigned_to = '22222222-2222-2222-2222-222222222222',
  status = 'SUBMITTED',
  proof_image_url = null
where home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and title = 'Baño';

-- Demo money: filled amounts so balances are visible
update public.expenses
set amount = 18.40, paid_by = '11111111-1111-1111-1111-111111111111'
where home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and title = 'Comprar productos de limpieza comunes';

update public.expenses
set amount = 800.00, paid_by = '11111111-1111-1111-1111-111111111111'
where home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and title = 'Alquiler';

update public.expenses
set amount = 42.00, paid_by = '22222222-2222-2222-2222-222222222222'
where home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and title = 'Agua / luz';

update public.expense_shares es
set share_amount = round(e.amount / 2.0, 2)
from public.expenses e
where es.expense_id = e.id
  and e.home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

insert into public.expenses (home_id, title, description, kind, amount, paid_by, status)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Cena del viernes',
  'Bruno, me debes tu parte.',
  'PEER',
  14.00,
  '11111111-1111-1111-1111-111111111111',
  'OPEN'
);

insert into public.expense_shares (home_id, expense_id, user_id, share_amount)
select e.home_id, e.id, '22222222-2222-2222-2222-222222222222', e.amount
from public.expenses e
where e.home_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  and e.title = 'Cena del viernes'
on conflict do nothing;
