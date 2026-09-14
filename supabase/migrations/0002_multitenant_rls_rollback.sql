-- PREPARED FOR REVIEW ONLY. Do NOT apply until explicitly approved.
--
-- Emergency rollback for 0002_multitenant_rls.sql — fail-closed, NOT a
-- restore of the pre-migration state.
--
-- This script is only for use if a problem is discovered AFTER
-- 0002_multitenant_rls.sql has already been committed. It is not needed for a
-- failure DURING that migration: any raise exception in its own preflight/
-- postflight DO blocks already rolls back the whole transaction automatically,
-- leaving the database exactly as it was pre-migration with no manual action.
--
-- What this script does: it removes the new tenant-scoped policies/grants on
-- leads, assistant_conversations, and tenants. Because public.leads is left
-- with RLS enabled and zero policies, it becomes deny-all to `authenticated`
-- (RLS enabled + zero policies is always deny-all, regardless of table
-- grants) — the Looplijn dashboard temporarily loses read access to leads
-- until a corrected migration ships. This is a deliberate availability cost,
-- paid in exchange for certainty that no tenant's data is exposed.
--
-- What this script deliberately does NOT do: it does NOT recreate the
-- original tenant-blind authenticated_select_own_tenant_leads /
-- authenticated_update_own_tenant_leads policies. Restoring broad,
-- tenant-blind admin read access is never an automated rollback step — if
-- ever judged necessary as a stopgap, that is a distinct, explicit
-- security-risk-acceptance decision requiring a named sign-off at the time,
-- not something pre-written here.
--
-- public.loopy_conversations and public.page_visits are not touched by
-- 0002_multitenant_rls.sql and are not touched here either.
--
-- The new public.platform_admins / public.memberships tables and the
-- public.is_platform_admin() / public.has_tenant_access(uuid) functions are
-- intentionally left in place by this script (harmless while unused — no
-- grant to anon/authenticated exists on either table, and the functions have
-- no anon/public EXECUTE grant). If a full revert to the pre-migration schema
-- is wanted, drop them in a separate, explicit follow-up step:
--   drop function if exists public.has_tenant_access(uuid);
--   drop function if exists public.is_platform_admin();
--   drop table if exists public.memberships;
--   drop table if exists public.platform_admins;

begin;

drop policy if exists leads_tenant_select on public.leads;
drop policy if exists leads_admin_update on public.leads;
drop policy if exists assistant_conversations_tenant_select on public.assistant_conversations;
drop policy if exists tenants_tenant_select on public.tenants;

revoke select on public.assistant_conversations from authenticated;
revoke select on public.tenants from authenticated;

commit;
