-- PREPARED FOR REVIEW ONLY. Do NOT apply until explicitly approved.
--
-- Multi-tenant RLS authorization layer for the shared Looplijn Supabase project.
-- This migration is Looplijn-wide (not Bioghaia-specific); it lives here per the
-- approved plan because supabase/migrations/0001_bia_leads.sql is the only
-- migrations directory that exists anywhere on disk today.
--
-- Replaces the current tenant-blind public.leads SELECT/UPDATE policies (which
-- grant access to ANY authenticated Supabase user, with no tenant predicate)
-- with a membership-based model, and extends the same model to
-- public.assistant_conversations / public.tenants (currently RLS-enabled with
-- zero policies). public.loopy_conversations and public.page_visits are
-- intentionally left completely untouched.
--
-- The preflight DO block below aborts the entire transaction (raise exception)
-- if the live public.leads policies do not exactly match the reviewed
-- production snapshot captured below. This is a deliberate safety gate: the
-- migration must never drop an unverified policy.

begin;

-- ---------------------------------------------------------------------------
-- 0. Record the migration-executing role. Postflight ownership checks (§8)
--    compare the new tables'/functions' owners directly against this value,
--    not merely against each other.
-- ---------------------------------------------------------------------------

do $$
begin
  perform set_config('bia_migration.owner', current_user, true);
end $$;

-- ---------------------------------------------------------------------------
-- 1. Preflight assertions. Any failure here raises an exception, which rolls
--    back the whole transaction and leaves the database exactly as it was.
-- ---------------------------------------------------------------------------

do $$
declare
  v_count   int;
  v_select  record;
  v_update  record;
begin
  -- 1a. Exactly two policies must exist on public.leads today, matching the
  --     reviewed production snapshot byte-for-byte. No unknown third policy
  --     may be present.
  select count(*) into v_count
    from pg_policies
    where schemaname = 'public' and tablename = 'leads';
  if v_count <> 2 then
    raise exception
      'leads policy count is % (expected exactly 2) — an unknown policy may bypass tenant isolation, aborting',
      v_count;
  end if;

  select * into v_select
    from pg_policies
    where schemaname = 'public' and tablename = 'leads' and cmd = 'SELECT';
  if v_select.policyname is distinct from 'authenticated_select_own_tenant_leads'
     or v_select.permissive is distinct from 'PERMISSIVE'
     or v_select.roles is distinct from '{authenticated}'::name[]
     or v_select.qual is distinct from '(tenant_id = ''a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11''::uuid)'
     or v_select.with_check is not null then
    raise exception
      'leads SELECT policy does not match the reviewed production snapshot — aborting rather than dropping an unverified policy';
  end if;

  select * into v_update
    from pg_policies
    where schemaname = 'public' and tablename = 'leads' and cmd = 'UPDATE';
  if v_update.policyname is distinct from 'authenticated_update_own_tenant_leads'
     or v_update.permissive is distinct from 'PERMISSIVE'
     or v_update.roles is distinct from '{authenticated}'::name[]
     or v_update.qual is distinct from '(tenant_id = ''a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11''::uuid)'
     or v_update.with_check is distinct from '(tenant_id = ''a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11''::uuid)' then
    raise exception
      'leads UPDATE policy does not match the reviewed production snapshot — aborting rather than dropping an unverified policy';
  end if;
end $$;

-- 1b. assistant_conversations / tenants must currently have zero policies.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from pg_policies
    where schemaname = 'public' and tablename in ('assistant_conversations', 'tenants');
  if v_count <> 0 then
    raise exception
      'assistant_conversations/tenants policy count is % (expected 0) — aborting',
      v_count;
  end if;
end $$;

-- 1c. public.leads must already grant authenticated SELECT + UPDATE (no new
--     grant is added for leads in this migration).
do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'leads'
      and grantee = 'authenticated' and privilege_type in ('SELECT', 'UPDATE');
  if v_count <> 2 then
    raise exception
      'authenticated is missing an expected SELECT/UPDATE grant on public.leads (found % of 2) — aborting',
      v_count;
  end if;
end $$;

-- 1d. assistant_conversations/tenants must not already grant authenticated or
--     anon anything (the new grants in this migration must be purely additive).
do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name in ('assistant_conversations', 'tenants')
      and grantee in ('authenticated', 'anon');
  if v_count <> 0 then
    raise exception
      'assistant_conversations/tenants already has % unexpected authenticated/anon grant(s) — aborting',
      v_count;
  end if;
end $$;

-- 1e. The new tables/functions must not already exist.
do $$
begin
  if to_regclass('public.platform_admins') is not null
     or to_regclass('public.memberships') is not null then
    raise exception 'public.platform_admins or public.memberships already exists — aborting';
  end if;

  if to_regprocedure('public.is_platform_admin()') is not null
     or to_regprocedure('public.has_tenant_access(uuid)') is not null then
    raise exception 'public.is_platform_admin() or public.has_tenant_access(uuid) already exists — aborting';
  end if;
end $$;

-- 1e2. RLS must be enabled (and not forced) on every table this migration
--      depends on or touches.
do $$
declare
  v_found_count int;
  v_rec         record;
begin
  select count(*) into v_found_count
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('leads', 'assistant_conversations', 'tenants', 'loopy_conversations');
  if v_found_count <> 4 then
    raise exception
      'one or more of leads/assistant_conversations/tenants/loopy_conversations not found in schema public (found %) — aborting',
      v_found_count;
  end if;

  for v_rec in
    select c.relname, c.relrowsecurity, c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname in ('leads', 'assistant_conversations', 'tenants', 'loopy_conversations')
  loop
    if v_rec.relrowsecurity is distinct from true then
      raise exception 'public.% does not have row level security enabled — aborting', v_rec.relname;
    end if;
    if v_rec.relforcerowsecurity is distinct from false then
      raise exception 'public.% has FORCE ROW LEVEL SECURITY enabled, which this migration does not expect — aborting', v_rec.relname;
    end if;
  end loop;
end $$;

-- 1e3. loopy_conversations must have exactly its four deny-all policies,
--      matching the established production snapshot on every column.
do $$
declare
  v_count int;
  v_pol   record;
begin
  select count(*) into v_count
    from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations';
  if v_count <> 4 then
    raise exception 'loopy_conversations policy count is % (expected exactly 4) — aborting', v_count;
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_select_denied';
  if v_pol.cmd is distinct from 'SELECT'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is distinct from 'false'
     or v_pol.with_check is not null then
    raise exception 'loopy_conversations.public_select_denied does not match the established production snapshot — aborting';
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_insert_denied';
  if v_pol.cmd is distinct from 'INSERT'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is not null
     or v_pol.with_check is distinct from 'false' then
    raise exception 'loopy_conversations.public_insert_denied does not match the established production snapshot — aborting';
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_update_denied';
  if v_pol.cmd is distinct from 'UPDATE'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is distinct from 'false'
     or v_pol.with_check is not null then
    raise exception 'loopy_conversations.public_update_denied does not match the established production snapshot — aborting';
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_delete_denied';
  if v_pol.cmd is distinct from 'DELETE'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is distinct from 'false'
     or v_pol.with_check is not null then
    raise exception 'loopy_conversations.public_delete_denied does not match the established production snapshot — aborting';
  end if;
end $$;

-- 1e4. The known tenant id -> slug mappings must exist. Additional tenants
--      beyond these two are allowed and do not fail this check.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from public.tenants
    where (id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid and slug = 'looplijn')
       or (id = 'b1f7c3d2-4e8a-4c15-9d63-7a2e5f0b8c41'::uuid and slug = 'bioghaia');
  if v_count <> 2 then
    raise exception
      'expected tenants looplijn (a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11) and bioghaia (b1f7c3d2-4e8a-4c15-9d63-7a2e5f0b8c41) not both found — aborting';
  end if;
end $$;

-- 1f. service_role must have BYPASSRLS, and all three roles must have USAGE
--     on schema public (necessary, not sufficient, for anon — which holds no
--     table-level grants on the sensitive tables either before or after this
--     migration).
do $$
declare
  v_bypassrls boolean;
begin
  select rolbypassrls into v_bypassrls from pg_roles where rolname = 'service_role';
  if v_bypassrls is distinct from true then
    raise exception 'service_role does not have BYPASSRLS (got %) — aborting', v_bypassrls;
  end if;

  if not has_schema_privilege('service_role', 'public', 'USAGE')
     or not has_schema_privilege('authenticated', 'public', 'USAGE')
     or not has_schema_privilege('anon', 'public', 'USAGE') then
    raise exception 'one of service_role/authenticated/anon is missing USAGE on schema public — aborting';
  end if;
end $$;

-- 1g. The seeded platform administrator must already exist in auth.users.
do $$
declare
  v_count int;
begin
  select count(*) into v_count
    from auth.users
    where id = '1e210c99-f7d6-417a-b9ed-5e459bbed3d7';
  if v_count <> 1 then
    raise exception
      'expected auth.users row 1e210c99-f7d6-417a-b9ed-5e459bbed3d7 not found — aborting before seeding platform_admins';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. New tables, RLS enable, index. Zero policies on either — access is only
--    ever via the security definer functions below (owner-bypass), never via
--    a direct grant to anon/authenticated.
-- ---------------------------------------------------------------------------

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table if not exists public.memberships (
  user_id   uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  primary key (user_id, tenant_id)
);

create index if not exists memberships_tenant_id_idx on public.memberships (tenant_id);

alter table public.platform_admins enable row level security;
alter table public.memberships enable row level security;

-- ---------------------------------------------------------------------------
-- 3. Explicit revokes (documentation-as-code; nothing was granted by default).
-- ---------------------------------------------------------------------------

revoke all on public.platform_admins from public, anon, authenticated;
revoke all on public.memberships from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. service_role table privileges + schema usage.
-- ---------------------------------------------------------------------------

grant usage on schema public to service_role;
grant select, insert, update, delete on public.platform_admins to service_role;
grant select, insert, update, delete on public.memberships to service_role;

-- ---------------------------------------------------------------------------
-- 5. Helper functions. Both security definer, search_path locked to '' so
--    every schema object reference is fully qualified — no reliance on an
--    attacker-influenced search_path.
-- ---------------------------------------------------------------------------

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  );
$$;

create or replace function public.has_tenant_access(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and (
      public.is_platform_admin()
      or exists (
        select 1
        from public.memberships m
        where m.user_id = auth.uid()
          and m.tenant_id = p_tenant_id
      )
    );
$$;

revoke execute on function public.is_platform_admin() from public, anon;
revoke execute on function public.has_tenant_access(uuid) from public, anon;
grant execute on function public.is_platform_admin() to authenticated, service_role;
grant execute on function public.has_tenant_access(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Seed the platform administrator BEFORE any existing leads policy is
--    touched, so there is no window — even within this transaction — where
--    the admin is covered by neither the old nor the new policy.
-- ---------------------------------------------------------------------------

insert into public.platform_admins (user_id)
values ('1e210c99-f7d6-417a-b9ed-5e459bbed3d7');

-- ---------------------------------------------------------------------------
-- 7. Swap the leads policies; add the two new grants + policies.
-- ---------------------------------------------------------------------------

drop policy authenticated_select_own_tenant_leads on public.leads;
drop policy authenticated_update_own_tenant_leads on public.leads;

create policy leads_tenant_select on public.leads
  for select to authenticated
  using (public.has_tenant_access(tenant_id));

create policy leads_admin_update on public.leads
  for update to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant select on public.assistant_conversations to authenticated;
create policy assistant_conversations_tenant_select on public.assistant_conversations
  for select to authenticated
  using (public.has_tenant_access(tenant_id));

grant select on public.tenants to authenticated;
create policy tenants_tenant_select on public.tenants
  for select to authenticated
  using (public.has_tenant_access(id));

-- ---------------------------------------------------------------------------
-- 8. Postflight in-transaction sanity assertions. Abort instead of committing
--    a broken state.
-- ---------------------------------------------------------------------------

do $$
declare
  v_count int;
  v_pol   record;
  v_owner text;
begin
  v_owner := current_setting('bia_migration.owner');

  -- Exactly the expected policy set: 2 on leads, 1 each on
  -- assistant_conversations/tenants, 0 on the two new tables.
  select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'leads';
  if v_count <> 2 then
    raise exception 'post-migration leads policy count is % (expected 2) — aborting', v_count;
  end if;

  select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'assistant_conversations';
  if v_count <> 1 then
    raise exception 'post-migration assistant_conversations policy count is % (expected 1) — aborting', v_count;
  end if;

  select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename = 'tenants';
  if v_count <> 1 then
    raise exception 'post-migration tenants policy count is % (expected 1) — aborting', v_count;
  end if;

  select count(*) into v_count from pg_policies
    where schemaname = 'public' and tablename in ('platform_admins', 'memberships');
  if v_count <> 0 then
    raise exception 'post-migration platform_admins/memberships policy count is % (expected 0) — aborting', v_count;
  end if;

  -- loopy_conversations must still have exactly its four original deny-all
  -- policies, untouched by this migration, matching the established
  -- production snapshot on every column (not just name/count).
  select count(*) into v_count
    from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations';
  if v_count <> 4 then
    raise exception 'post-migration loopy_conversations policy count is % (expected exactly 4) — aborting', v_count;
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_select_denied';
  if v_pol.cmd is distinct from 'SELECT'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is distinct from 'false'
     or v_pol.with_check is not null then
    raise exception 'post-migration loopy_conversations.public_select_denied no longer matches the established production snapshot — aborting';
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_insert_denied';
  if v_pol.cmd is distinct from 'INSERT'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is not null
     or v_pol.with_check is distinct from 'false' then
    raise exception 'post-migration loopy_conversations.public_insert_denied no longer matches the established production snapshot — aborting';
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_update_denied';
  if v_pol.cmd is distinct from 'UPDATE'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is distinct from 'false'
     or v_pol.with_check is not null then
    raise exception 'post-migration loopy_conversations.public_update_denied no longer matches the established production snapshot — aborting';
  end if;

  select * into v_pol from pg_policies
    where schemaname = 'public' and tablename = 'loopy_conversations' and policyname = 'public_delete_denied';
  if v_pol.cmd is distinct from 'DELETE'
     or v_pol.permissive is distinct from 'PERMISSIVE'
     or v_pol.roles is distinct from '{public}'::name[]
     or v_pol.qual is distinct from 'false'
     or v_pol.with_check is not null then
    raise exception 'post-migration loopy_conversations.public_delete_denied no longer matches the established production snapshot — aborting';
  end if;

  -- Exactly one platform_admins row: the seeded administrator.
  select count(*) into v_count from public.platform_admins
    where user_id = '1e210c99-f7d6-417a-b9ed-5e459bbed3d7';
  if v_count <> 1 then
    raise exception 'platform_admins does not contain exactly the expected seed row — aborting';
  end if;

  select count(*) into v_count from public.platform_admins;
  if v_count <> 1 then
    raise exception 'platform_admins has % rows (expected exactly 1) — aborting', v_count;
  end if;

  -- Ownership: the new tables/functions, scoped to schema public and (for
  -- the functions) their exact signatures, must be owned by current_user as
  -- recorded at the start of this transaction (§0) — not merely by some
  -- single owner matching each other — so the security definer owner-bypass
  -- this design depends on actually holds.
  select count(*) into v_count
    from (
      select c.relowner::regrole::text as owner
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relname in ('memberships', 'platform_admins')
      union all
      select p.proowner::regrole::text as owner
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.oid in (
            to_regprocedure('public.is_platform_admin()'),
            to_regprocedure('public.has_tenant_access(uuid)')
          )
    ) t
    where t.owner is distinct from v_owner;
  if v_count <> 0 then
    raise exception 'new tables/functions are not all owned by % (the migration-executing role) — owner-bypass cannot be trusted, aborting', v_owner;
  end if;

  -- anon/authenticated/PUBLIC must hold zero grants on the two new tables.
  select count(*) into v_count from information_schema.role_table_grants
    where table_schema = 'public' and table_name in ('memberships', 'platform_admins')
      and grantee in ('anon', 'authenticated', 'PUBLIC');
  if v_count <> 0 then
    raise exception 'memberships/platform_admins has % unexpected anon/authenticated/PUBLIC grant(s) — aborting', v_count;
  end if;

  -- anon/PUBLIC must hold zero EXECUTE grants on either helper function.
  select count(*) into v_count from information_schema.routine_privileges
    where routine_schema = 'public'
      and routine_name in ('is_platform_admin', 'has_tenant_access')
      and grantee in ('anon', 'PUBLIC');
  if v_count <> 0 then
    raise exception 'is_platform_admin/has_tenant_access has % unexpected anon/public EXECUTE grant(s) — aborting', v_count;
  end if;
end $$;

commit;
