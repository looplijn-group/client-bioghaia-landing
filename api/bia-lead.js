// Vercel serverless function: persist a Bia lead to Supabase.
//
// SECURITY: this runs server-side only. The Supabase service_role key is read
// from process.env and never exposed to the browser. The frontend posts the
// lead here; it never holds a privileged key. If the Supabase env vars are not
// configured, the function returns 501 and the client falls back to the
// WhatsApp handoff without blocking the visitor.
//
// Required Vercel env vars (Project Settings > Environment Variables):
//   SUPABASE_URL                 e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    service_role key (server-only, never VITE_*)
//   BIA_LEADS_TABLE              optional, defaults to "bia_leads"

const ALLOWED_FIELDS = [
  "lead_id",
  "session_id",
  "created_at",
  "locale",
  "client_type",
  "name",
  "selected_service_id",
  "selected_service_label",
  "contact_method",
  "contact_value",
  "project_city",
  "project_need",
  "project_stage",
  "deadline",
  "note",
  "consent_status",
  "consent_at",
  "source",
  "submission_state",
  "whatsapp_state",
  "summary_text",
  "transcript",
]

function pickAllowed(body) {
  const row = {}
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) row[key] = body[key]
  }
  return row
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ ok: false, error: "method_not_allowed" })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const table = process.env.BIA_LEADS_TABLE || "bia_leads"

  if (!supabaseUrl || !serviceKey) {
    // Not configured yet: tell the client so it can rely on WhatsApp instead.
    return res.status(501).json({ ok: false, error: "persistence_not_configured" })
  }

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return res.status(400).json({ ok: false, error: "invalid_json" })
    }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ ok: false, error: "invalid_body" })
  }

  // Consent is mandatory for storage.
  if (body.consent_status !== true) {
    return res.status(403).json({ ok: false, error: "consent_required" })
  }
  if (!body.session_id) {
    return res.status(400).json({ ok: false, error: "missing_session_id" })
  }

  const row = pickAllowed(body)

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      return res.status(502).json({ ok: false, error: "supabase_insert_failed", status: response.status, detail: detail.slice(0, 500) })
    }

    return res.status(200).json({ ok: true })
  } catch {
    return res.status(502).json({ ok: false, error: "supabase_unreachable" })
  }
}
