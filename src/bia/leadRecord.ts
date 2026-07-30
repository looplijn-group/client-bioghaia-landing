import { type BiaLocaleContent } from "./content"
import { buildLeadSummary, displayFieldValue, type BiaState } from "./engine"

// Supabase-ready lead record. snake_case, backend-agnostic. Mirrors the parent
// Looplijn `loopy_conversations` / `leads` conventions so it can later serve the
// authorized Bioghaia dashboard. Only collected fields are populated.
export type LeadRecord = {
  lead_id: string
  session_id: string
  created_at: string
  locale: "pt" | "en"
  client_type: string | null
  name: string | null
  selected_service_id: string | null
  selected_service_label: string | null
  contact_method: string | null
  contact_value: string | null
  project_city: string | null
  project_need: string | null
  project_stage: string | null
  deadline: string | null
  note: string | null
  consent_status: boolean | null
  consent_at: string | null
  source: string
  submission_state: BiaState["submissionState"]
  whatsapp_state: BiaState["whatsappState"]
  summary_text: string
  transcript: Array<{ role: "assistant" | "user"; node_id: string; text: string }>
}

function orNull(value: string | undefined | null): string | null {
  return value && value.trim() ? value : null
}

export function toLeadRecord(state: BiaState, content: BiaLocaleContent, leadId: string): LeadRecord {
  const service = state.selectedServiceId
    ? content.services.find((item) => item.id === state.selectedServiceId)
    : undefined

  const collected = state.collected
  return {
    lead_id: leadId,
    session_id: state.sessionId,
    created_at: state.createdAt,
    locale: state.locale,
    client_type: orNull(collected.clientType),
    name: orNull(collected.name),
    selected_service_id: state.selectedServiceId,
    selected_service_label: service ? service.name : null,
    contact_method: collected.contactMethod ? displayFieldValue(content, "contactMethod", collected.contactMethod) : null,
    contact_value: orNull(collected.contactValue),
    project_city: orNull(collected.city),
    project_need: orNull(collected.objective),
    project_stage: collected.projectStage ? displayFieldValue(content, "projectStage", collected.projectStage) : null,
    deadline: collected.deadline ? displayFieldValue(content, "deadline", collected.deadline) : null,
    note: orNull(collected.note),
    consent_status: state.consent.status,
    consent_at: state.consent.at,
    source: "bioghaia_landing_bia",
    submission_state: state.submissionState,
    whatsapp_state: state.whatsappState,
    summary_text: buildLeadSummary(content, state),
    transcript: state.transcript
      .filter((entry) => entry.text && entry.text.trim())
      .map((entry) => ({ role: entry.role, node_id: entry.nodeId, text: entry.text })),
  }
}

// Only forward a stored lead when the visitor has explicitly consented.
export function canPersistLead(state: BiaState): boolean {
  return state.consent.status === true
}
