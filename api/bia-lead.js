// Vercel serverless function: persist a Bia lead into the shared Looplijn
// Supabase project via the shared save_assistant_submission(text, jsonb) RPC,
// tagged with the "bioghaia" tenant slug.
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

const TENANT_SLUG = "bioghaia"

function looksLikeEmail(value) {
  return typeof value === "string" && value.includes("@")
}

function buildSubmissionPayload(body) {
  const contactValue = body.contact_value || null
  const email = contactValue && looksLikeEmail(contactValue) ? contactValue : null
  const phone = contactValue && !looksLikeEmail(contactValue) ? contactValue : null

  return {
    session_id: body.session_id,
    locale: body.locale,
    name: body.name,
    email,
    phone,
    city: body.project_city,
    message: body.project_need,
    summary_text: body.summary_text,
    note: body.note,
    timeline_label: body.deadline,
    services: body.selected_service_id ? [body.selected_service_id] : [],
    service_labels: body.selected_service_label ? [body.selected_service_label] : [],
    source: body.source,
    transcript: body.transcript,
    started_at: body.created_at,
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ ok: false, error: "method_not_allowed" })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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

  const payload = buildSubmissionPayload(body)

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/save_assistant_submission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ p_tenant_slug: TENANT_SLUG, p_payload: payload }),
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
