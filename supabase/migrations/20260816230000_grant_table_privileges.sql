-- Table privileges for API roles.
-- RLS still enforces row access; without GRANT, PostgREST returns "permission denied".

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.profiles to anon;

grant select, insert, update, delete on table public.homes to authenticated;
grant select, insert, update, delete on table public.home_members to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;

grant usage, select on all sequences in schema public to authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to authenticated;
