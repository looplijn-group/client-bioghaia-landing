import { describe, expect, it } from "vitest"
import {
  buildWhatsAppUrl,
  createInitialState,
  getContent,
  nextRequiredField,
  optionsForNode,
  reduce,
  validateConversationGraph,
  WHATSAPP_NUMBER,
  type BiaAction,
  type BiaState,
} from "./engine"
import { canPersistLead, toLeadRecord } from "./leadRecord"
import { businessHours, isWithinBusinessHours } from "./businessHours"
import { getValidationReport, validateOptionParity } from "./validation"
import { type Lang } from "./content"
import { loadSession, saveSession } from "./persistence"

const sel = (optionId: string): BiaAction => ({ kind: "select", optionId })
const inp = (text: string): BiaAction => ({ kind: "input", text })

type RunResult = {
  state: BiaState
  effects: ReturnType<typeof reduce>["effect"][]
  texts: string[]
  assistantTexts: string[]
}

function run(locale: Lang, actions: BiaAction[]): RunResult {
  let state = createInitialState(locale, { sessionId: "session-test", createdAt: "2020-01-01T00:00:00.000Z" })
  const effects: RunResult["effects"] = []
  for (const action of actions) {
    const res = reduce(state, action, getContent(state.locale))
    state = res.state
    effects.push(res.effect)
  }
  return {
    state,
    effects,
    texts: state.transcript.map((entry) => entry.text),
    assistantTexts: state.transcript.filter((entry) => entry.role === "assistant").map((entry) => entry.text),
  }
}

const HAPPY_PATH: BiaAction[] = [
  sel("welcome-services"),
  sel("service-topografia"),
  sel("detail-assist"),
  sel("ct-individual"),
  inp("Rafael"),
  sel("cm-email"),
  inp("rafael@example.com"),
  inp("Cruz Alta, RS"),
  inp("Levantamento topografico de uma area rural"),
  sel("ps-planning"),
  inp("Proximo mes"),
]

describe("graph + validation", () => {
  it("validates the conversation graph with no issues", () => {
    expect(validateConversationGraph()).toEqual([])
  })

  it("has identical option ids across locales", () => {
    expect(validateOptionParity()).toEqual([])
  })

  it("reports no validation issues for PT and EN", () => {
    expect(getValidationReport("pt")).toEqual([])
    expect(getValidationReport("en")).toEqual([])
  })
})

describe("opening + exploration", () => {
  it("greets once and offers the approved opening options", () => {
    const state = createInitialState("pt")
    expect(state.transcript.filter((m) => m.text === getContent("pt").assistant.intro).length).toBe(1)
    const ids = optionsForNode(state, getContent("pt")).map((o) => o.id)
    expect(ids).toEqual(["welcome-services", "welcome-project", "welcome-team", "welcome-wa"])
  })

  it("explores two services without repeating the greeting or duplicating cards", () => {
    const { state, assistantTexts } = run("en", [
      sel("welcome-services"),
      sel("service-geoprocessamento"),
      sel("detail-another"),
      sel("service-topografia"),
    ])
    const intro = getContent("en").assistant.intro
    expect(assistantTexts.filter((t) => t === intro).length).toBe(1)
    expect(assistantTexts.filter((t) => t.startsWith("Surveying")).length).toBe(1)
    expect(assistantTexts.filter((t) => t.startsWith("Geoprocessing")).length).toBe(1)
    expect(state.currentNodeId).toBe("serviceDetail")
    expect(state.selectedServiceId).toBe("topografia")
  })
})

describe("qualification", () => {
  it("preserves the selected service and advances field by field with a typed name", () => {
    const { state, assistantTexts } = run("en", [sel("welcome-services"), sel("service-topografia"), sel("detail-assist"), sel("ct-individual"), inp("Rafael")])
    expect(state.selectedServiceId).toBe("topografia")
    expect(state.collected.clientType).toBe("individual")
    expect(state.collected.name).toBe("Rafael")
    expect(state.currentNodeId).toBe("contactMethod")
    expect(assistantTexts.filter((t) => t.startsWith("Surveying")).length).toBe(1)
  })

  it("completes the happy path to a reviewable summary", () => {
    const { state } = run("pt", HAPPY_PATH)
    expect(state.currentNodeId).toBe("summary")
    expect(nextRequiredField(state)).toBeNull()
    expect(state.collected.contactValue).toBe("rafael@example.com")
    expect(state.collected.city).toBe("Cruz Alta, RS")
    expect(state.collected.projectStage).toBe("planning")
  })

  it("validates email and phone without losing the conversation", () => {
    const toContact = [sel("welcome-team"), sel("ct-individual"), inp("Rafael"), sel("cm-email")]
    const bad = run("en", [...toContact, inp("not-an-email")])
    expect(bad.state.currentNodeId).toBe("contactValue")
    expect(bad.state.collected.contactValue).toBeUndefined()
    expect(bad.texts[bad.texts.length - 1]).toBe(getContent("en").validation.invalidEmail)

    const good = run("en", [...toContact, inp("rafael@example.com")])
    expect(good.state.collected.contactValue).toBe("rafael@example.com")
    expect(good.state.currentNodeId).toBe("city")

    const phone = run("en", [sel("welcome-team"), sel("ct-individual"), inp("Rafael"), sel("cm-phone"), inp("(54) 99677-8886")])
    expect(phone.state.collected.contactValue).toBe("(54) 99677-8886")
    expect(phone.state.currentNodeId).toBe("city")
  })

  it("collects information early from a project description", () => {
    const { state } = run("pt", [sel("welcome-project"), inp("Preciso de licenciamento ambiental para propriedade rural")])
    expect(state.collected.objective).toContain("licenciamento")
    expect(state.currentNodeId).toBe("clientType")
    expect(state.journeyMode).toBe("qualification")
  })
})

describe("human handoff", () => {
  it("enters human handoff from the menu, preserving nothing selected", () => {
    const { state } = run("en", [sel("welcome-team")])
    expect(state.journeyMode).toBe("human")
    expect(state.currentNodeId).toBe("clientType")
    expect(state.selectedServiceId).toBeNull()
  })

  it("enters human handoff from a service without replaying the service card", () => {
    const { state, assistantTexts } = run("en", [sel("welcome-services"), sel("service-topografia"), sel("detail-team"), sel("ct-individual"), inp("Rafael")])
    expect(state.journeyMode).toBe("human")
    expect(state.selectedServiceId).toBe("topografia")
    expect(state.collected.name).toBe("Rafael")
    expect(assistantTexts.filter((t) => t.startsWith("Surveying")).length).toBe(1)
  })
})

describe("direct WhatsApp + business hours", () => {
  it("offers WhatsApp with the configured number and no PII before consent", () => {
    const { state, effects } = run("en", [sel("welcome-wa")])
    expect(effects[effects.length - 1]).toEqual({ kind: "openWhatsapp", includeLead: false })
    const url = buildWhatsAppUrl(state, getContent("en"), false)
    expect(url).toContain(`wa.me/${WHATSAPP_NUMBER}`)
    expect(WHATSAPP_NUMBER).toBe("5554996778886")
    expect(decodeURIComponent(url)).toContain(getContent("en").assistant.whatsappGenericPrefill)
    expect(decodeURIComponent(url)).not.toContain("Rafael")
  })

  it("treats Bia as always open when business hours are not configured", () => {
    expect(businessHours.configured).toBe(false)
    expect(isWithinBusinessHours(businessHours, new Date("2020-01-05T03:00:00.000Z"))).toBe(true)
  })
})

describe("FAQ interruption and resume", () => {
  it("answers a question during qualification and resumes without corrupting the field", () => {
    const afterQuestion = run("pt", [sel("welcome-team"), sel("ct-individual"), inp("Quem a Bioghaia atende?")])
    expect(afterQuestion.state.currentNodeId).toBe("faqAnswer")
    expect(afterQuestion.state.resumeNodeId).toBe("name")
    expect(afterQuestion.state.collected.name).toBeUndefined()
    expect(afterQuestion.texts[afterQuestion.texts.length - 1]).toContain("Bioghaia atende")

    const resumed = reduce(afterQuestion.state, sel("faq-resume"), getContent("pt"))
    expect(resumed.state.currentNodeId).toBe("name")
    expect(resumed.state.collected.name).toBeUndefined()
  })
})

describe("unexpected input escalation", () => {
  it("escalates through distinct fallbacks without repeating consecutively", () => {
    const { state, assistantTexts } = run("en", [inp("qwph zzxc"), inp("lkjh mnbv"), inp("poiu asdf")])
    expect(state.currentNodeId).toBe("fallback")
    expect(state.fallbackCount).toBe(3)
    const c = getContent("en").assistant
    const lastThree = assistantTexts.slice(-3)
    expect(lastThree[0]).toBe(c.clarificationBody)
    expect(lastThree[1]).toBe(c.fallbackSimplerBody)
    expect(lastThree[2]).toBe(c.fallbackHumanBody)
    expect(new Set(lastThree).size).toBe(3)
  })
})

describe("navigation: menu, restart, resume", () => {
  it("routes menu-with-progress to confirmation and preserves fields on keep", () => {
    const base = run("en", [sel("welcome-services"), sel("service-topografia"), sel("detail-assist")])
    const menu = reduce(base.state, sel("ct-menu"), getContent("en"))
    expect(menu.state.currentNodeId).toBe("menuConfirm")
    expect(menu.state.resumeNodeId).toBe("clientType")
    const keep = reduce(menu.state, sel("mc-keep"), getContent("en"))
    expect(keep.state.currentNodeId).toBe("welcome")
    expect(keep.state.selectedServiceId).toBe("topografia")
    expect(keep.state.sessionId).toBe("session-test")
    expect(keep.effect).toEqual({ kind: "none" })
    const cont = reduce(menu.state, sel("mc-continue"), getContent("en"))
    expect(cont.state.currentNodeId).toBe("clientType")
  })

  it("restart clears data but preserves locale and session_id before any save", () => {
    const base = run("en", [sel("welcome-services"), sel("service-topografia"), sel("detail-assist")])
    const menu = reduce(base.state, sel("ct-menu"), getContent("en"))
    const restarted = reduce(menu.state, sel("mc-restart"), getContent("en"))
    expect(restarted.state.locale).toBe("en")
    expect(restarted.state.selectedServiceId).toBeNull()
    expect(restarted.state.collected).toEqual({})
    expect(restarted.state.currentNodeId).toBe("welcome")
    expect(restarted.state.sessionId).toBe("session-test")
    expect(restarted.effect).toEqual({ kind: "none" })
    expect(restarted.state.transcript.filter((m) => m.text === getContent("en").assistant.intro).length).toBe(1)
  })
})

describe("summary review and single-field correction", () => {
  it("corrects one field without losing the others", () => {
    const full = run("pt", HAPPY_PATH)
    const edit = reduce(full.state, sel("sum-edit"), getContent("pt"))
    expect(edit.state.currentNodeId).toBe("editMenu")
    const pick = reduce(edit.state, sel("edit-city"), getContent("pt"))
    expect(pick.state.currentNodeId).toBe("city")
    expect(pick.state.editingField).toBe("city")
    const corrected = reduce(pick.state, inp("Ijui, RS"), getContent("pt"))
    expect(corrected.state.currentNodeId).toBe("summary")
    expect(corrected.state.collected.city).toBe("Ijui, RS")
    expect(corrected.state.collected.name).toBe("Rafael")
    expect(corrected.state.editingField).toBeNull()
  })
})

describe("consent, persistence, and honest handoff states", () => {
  it("saves and prepares WhatsApp only after consent", () => {
    const full = run("pt", HAPPY_PATH)
    const confirm = reduce(full.state, sel("sum-confirm"), getContent("pt"))
    expect(confirm.state.currentNodeId).toBe("consent")
    const yes = reduce(confirm.state, sel("consent-yes"), getContent("pt"))
    expect(yes.state.consent.status).toBe(true)
    expect(yes.state.submissionState).toBe("saving")
    expect(yes.effect).toEqual({ kind: "saveLead" })
    expect(canPersistLead(yes.state)).toBe(true)

    const saved = reduce(yes.state, { kind: "markSaved" }, getContent("pt"))
    expect(saved.state.submissionState).toBe("saved")
    expect(saved.state.whatsappState).toBe("prepared")
    expect(saved.emitted).toContain(getContent("pt").assistant.leadSavedStatus)
  })

  it("declining consent blocks persistence and PII handoff", () => {
    const full = run("pt", HAPPY_PATH)
    const confirm = reduce(full.state, sel("sum-confirm"), getContent("pt"))
    const no = reduce(confirm.state, sel("consent-no"), getContent("pt"))
    expect(no.state.consent.status).toBe(false)
    expect(no.state.currentNodeId).toBe("declined")
    expect(canPersistLead(no.state)).toBe(false)
    const url = buildWhatsAppUrl(no.state, getContent("pt"), no.state.consent.status === true)
    expect(decodeURIComponent(url)).not.toContain("Rafael")
  })

  it("recovers from a Supabase failure by keeping WhatsApp available", () => {
    const full = run("pt", HAPPY_PATH)
    const yes = reduce(reduce(full.state, sel("sum-confirm"), getContent("pt")).state, sel("consent-yes"), getContent("pt"))
    const errored = reduce(yes.state, { kind: "markError" }, getContent("pt"))
    expect(errored.state.submissionState).toBe("error")
    const savedOptions = optionsForNode(errored.state, getContent("pt")).map((o) => o.id)
    expect(savedOptions).toContain("saved-wa")
  })

  it("restart after a failed save preserves session_id and stays a plain reset", () => {
    const full = run("pt", HAPPY_PATH)
    const yes = reduce(reduce(full.state, sel("sum-confirm"), getContent("pt")).state, sel("consent-yes"), getContent("pt"))
    const errored = reduce(yes.state, { kind: "markError" }, getContent("pt"))
    const restarted = reduce(errored.state, sel("saved-restart"), getContent("pt"))
    expect(restarted.effect).toEqual({ kind: "none" })
    expect(restarted.state.sessionId).toBe("session-test")
    expect(restarted.state.collected).toEqual({})
  })

  it("keepAndMenu after a failed save preserves session_id and progress", () => {
    const full = run("pt", HAPPY_PATH)
    const yes = reduce(reduce(full.state, sel("sum-confirm"), getContent("pt")).state, sel("consent-yes"), getContent("pt"))
    const errored = reduce(yes.state, { kind: "markError" }, getContent("pt"))
    const toMenu = reduce(errored.state, sel("saved-menu"), getContent("pt"))
    expect(toMenu.state.currentNodeId).toBe("menuConfirm")
    const kept = reduce(toMenu.state, sel("mc-keep"), getContent("pt"))
    expect(kept.effect).toEqual({ kind: "none" })
    expect(kept.state.sessionId).toBe("session-test")
    expect(kept.state.selectedServiceId).toBe("topografia")
    expect(kept.state.collected.name).toBe("Rafael")
  })

  it("builds a Supabase-ready lead record from collected fields only", () => {
    const full = run("en", HAPPY_PATH)
    const yes = reduce(reduce(full.state, sel("sum-confirm"), getContent("en")).state, sel("consent-yes"), getContent("en"))
    const record = toLeadRecord(yes.state, getContent("en"), "lead-123")
    expect(record.lead_id).toBe("lead-123")
    expect(record.session_id).toBe("session-test")
    expect(record.selected_service_id).toBe("topografia")
    expect(record.selected_service_label).toBe("Surveying")
    expect(record.client_type).toBe("individual")
    expect(record.contact_method).toBe("Email")
    expect(record.project_stage).toBe("In planning")
    expect(record.consent_status).toBe(true)
    expect(record.source).toBe("bioghaia_landing_bia")
    expect(Array.isArray(record.transcript)).toBe(true)
  })
})

describe("session_id rotation after a completed submission", () => {
  function toSaved(locale: Lang) {
    const full = run(locale, HAPPY_PATH)
    const yes = reduce(reduce(full.state, sel("sum-confirm"), getContent(locale)).state, sel("consent-yes"), getContent(locale))
    return reduce(yes.state, { kind: "markSaved" }, getContent(locale))
  }

  it("restart after a saved submission requests rotation instead of reusing the id", () => {
    const saved = toSaved("pt")
    expect(saved.state.submissionState).toBe("saved")

    const restarted = reduce(saved.state, sel("saved-restart"), getContent("pt"))
    expect(restarted.effect).toEqual({ kind: "requestSessionRotation", resetProgress: true })
    // reduce() stays pure: it never mints the new id itself, the caller does.
    expect(restarted.state.sessionId).toBe("session-test")

    const rotated = reduce(
      restarted.state,
      { kind: "rotateSession", sessionId: "session-new-1", createdAt: "2021-01-01T00:00:00.000Z", resetProgress: true },
      getContent("pt"),
    )
    expect(rotated.state.sessionId).toBe("session-new-1")
    expect(rotated.state.sessionId).not.toBe(saved.state.sessionId)
    expect(rotated.state.collected).toEqual({})
    expect(rotated.state.selectedServiceId).toBeNull()
    expect(rotated.state.submissionState).toBe("idle")
    expect(rotated.state.currentNodeId).toBe("welcome")
  })

  it("keepAndMenu after a saved submission requests rotation but keeps progress", () => {
    const saved = toSaved("en")
    const toMenu = reduce(saved.state, sel("saved-menu"), getContent("en"))
    expect(toMenu.state.currentNodeId).toBe("menuConfirm")

    const kept = reduce(toMenu.state, sel("mc-keep"), getContent("en"))
    expect(kept.effect).toEqual({ kind: "requestSessionRotation", resetProgress: false })
    expect(kept.state.sessionId).toBe("session-test")

    const rotated = reduce(
      kept.state,
      { kind: "rotateSession", sessionId: "session-new-2", createdAt: "2021-01-01T00:00:00.000Z", resetProgress: false },
      getContent("en"),
    )
    expect(rotated.state.sessionId).toBe("session-new-2")
    expect(rotated.state.sessionId).not.toBe(saved.state.sessionId)
    expect(rotated.state.currentNodeId).toBe("welcome")
    expect(rotated.state.submissionState).toBe("idle")
    expect(rotated.state.consent.status).toBeNull()
    // "Keep progress" still means what it says: collected data survives the rotation.
    expect(rotated.state.selectedServiceId).toBe("topografia")
    expect(rotated.state.collected.name).toBe("Rafael")
  })

  it("persists a rotated session_id to localStorage the same way a fresh one is loaded", () => {
    const store = new Map<string, string>()
    const stubStorage: Storage = {
      length: 0,
      clear: () => store.clear(),
      key: () => null,
      getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
    }

    const original = (globalThis as { window?: { localStorage: Storage } }).window
    ;(globalThis as { window?: { localStorage: Storage } }).window = { localStorage: stubStorage }
    try {
      const rotated = createInitialState("pt", { sessionId: "session-new-3", createdAt: "2021-01-01T00:00:00.000Z" })
      saveSession(rotated)
      const restored = loadSession("pt")
      expect(restored?.sessionId).toBe("session-new-3")
      expect(restored?.sessionId).not.toBe("session-test")
    } finally {
      ;(globalThis as { window?: { localStorage: Storage } }).window = original
    }
  })
})

describe("guards", () => {
  it("ignores stale / double-click option ids", () => {
    const first = reduce(createInitialState("en"), sel("welcome-services"), getContent("en"))
    const len = first.state.transcript.length
    const second = reduce(first.state, sel("welcome-services"), getContent("en"))
    expect(second.state.currentNodeId).toBe("services")
    expect(second.state.transcript.length).toBe(len)
    expect(second.effect).toEqual({ kind: "none" })
  })

  it("is deterministic and pure (no timers, same input same output)", () => {
    const s = createInitialState("en", { sessionId: "x", createdAt: "2020-01-01T00:00:00.000Z" })
    const a = reduce(s, sel("welcome-services"), getContent("en"))
    const b = reduce(s, sel("welcome-services"), getContent("en"))
    expect(a.state.transcript.map((m) => m.text)).toEqual(b.state.transcript.map((m) => m.text))
  })
})

describe("localization", () => {
  it("keeps journey, service, and fields when switching language", () => {
    const base = run("pt", [sel("welcome-services"), sel("service-topografia"), sel("detail-assist"), sel("ct-individual"), inp("Rafael")])
    const switched = reduce(base.state, { kind: "setLocale", locale: "en" }, getContent("pt"))
    expect(switched.state.locale).toBe("en")
    expect(switched.state.selectedServiceId).toBe("topografia")
    expect(switched.state.collected.name).toBe("Rafael")
    expect(switched.state.currentNodeId).toBe("contactMethod")
    const teamLabel = optionsForNode(switched.state, getContent("en")).find((o) => o.id === "cm-team")?.label
    expect(teamLabel).toBe("Talk to the team")
  })

  it("produces no mixed-language output within a session", () => {
    const pt = run("pt", HAPPY_PATH)
    expect(pt.texts.some((t) => t.includes("What is your name?"))).toBe(false)
    const en = run("en", HAPPY_PATH)
    expect(en.texts.some((t) => t.includes("Qual é o seu nome?"))).toBe(false)
  })

  it("contains no forbidden em dash in any emitted text", () => {
    const pt = run("pt", HAPPY_PATH)
    const en = run("en", HAPPY_PATH)
    for (const text of [...pt.texts, ...en.texts]) {
      expect(text.includes("—")).toBe(false)
    }
  })
})
