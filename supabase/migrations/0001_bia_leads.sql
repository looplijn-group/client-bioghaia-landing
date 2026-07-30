-- PREPARED FOR REVIEW ONLY. Do NOT apply until explicitly approved.
--
-- Table for Bia leads captured from the Bioghaia landing page. Designed to also
-- serve the authorized Bioghaia dashboard later. Writes happen exclusively from
-- the serverless function api/bia-lead.js using the service_role key. The anon
-- role has NO access, so browsers can never read or write this table directly.

create table if not exists public.bia_leads (
  lead_id                 uuid primary key,
  session_id              uuid not null,
  created_at              timestamptz not null default now(),
  locale                  text not null check (locale in ('pt', 'en')),
  client_type             text,
  name                    text,
  selected_service_id     text,
  selected_service_label  text,
  contact_method          text,
  contact_value           text,
  project_city            text,
  project_need            text,
  project_stage           text,
  deadline                text,
  note                    text,
  consent_status          boolean,
  consent_at              timestamptz,
  source                  text not null default 'bioghaia_landing_bia',
  submission_state        text,
  whatsapp_state          text,
  summary_text            text,
  transcript              jsonb not null default '[]'::jsonb,
  inserted_at             timestamptz not null default now()
);

create index if not exists bia_leads_session_id_idx on public.bia_leads (session_id);
create index if not exists bia_leads_created_at_idx on public.bia_leads (created_at desc);

-- Enable RLS and grant NO policies to anon/authenticated. Only the service_role
-- (used server-side by api/bia-lead.js) bypasses RLS. This preserves tenant
-- isolation: the public web client cannot touch leads.
alter table public.bia_leads enable row level security;

-- Storage is gated on consent at the application layer (api/bia-lead.js rejects
-- rows without consent_status = true). This DB-level check enforces the same rule.
alter table public.bia_leads
  add constraint bia_leads_requires_consent check (consent_status is true);

-- No policies are created intentionally: with RLS enabled and no policy, anon
-- and authenticated roles are denied all access. When the dashboard is built,
-- add explicit tenant-scoped SELECT policies for authenticated staff only.
