import { type BiaState } from "./engine"
import { type LeadRecord } from "./leadRecord"

const SESSION_KEY = "bioghaia_bia_session"
const LEAD_ENDPOINT = "/api/bia-lead"

function safeStorage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

// Persist the whole conversation state so a reload restores the exact journey.
export function saveSession(state: BiaState): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // Quota or serialization failure is non-fatal; the session simply won't restore.
  }
}

export function loadSession(locale: BiaState["locale"]): BiaState | null {
  const storage = safeStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BiaState>
    if (!parsed || typeof parsed !== "object") return null
    if (!parsed.currentNodeId || !Array.isArray(parsed.transcript)) return null
    // Restore preserves the stored locale but respects an explicit locale switch.
    return { ...(parsed as BiaState), locale }
  } catch {
    return null
  }
}

export function clearSession(): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

// POST the lead to the serverless endpoint (which holds the Supabase
// service_role key). Returns ok:false on any failure so the caller can still
// fall back to the WhatsApp handoff without blocking the visitor.
export async function submitLead(record: LeadRecord): Promise<{ ok: boolean }> {
  try {
    if (typeof fetch === "undefined") return { ok: false }
    const response = await fetch(LEAD_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    })
    return { ok: response.ok }
  } catch {
    return { ok: false }
  }
}
