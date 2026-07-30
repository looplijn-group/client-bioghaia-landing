import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./AssistantWidget.css"
import { type Lang } from "../bia/content"
import {
  buildWhatsAppUrl,
  createInitialState,
  getContent,
  optionsForNode,
  reduce,
  type BiaAction,
  type BiaState,
  type Effect,
} from "../bia/engine"
import { canPersistLead, toLeadRecord } from "../bia/leadRecord"
import { clearSession, loadSession, saveSession, submitLead } from "../bia/persistence"

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID()
  } catch {
    // fall through
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

function nowIso(): string {
  try {
    return new Date().toISOString()
  } catch {
    return "1970-01-01T00:00:00.000Z"
  }
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

interface BiaWidgetProps {
  lang: Lang
  initialMessage?: { id: string; text: string } | null
}

export default function BiaWidget({ lang, initialMessage }: BiaWidgetProps) {
  const content = useMemo(() => getContent(lang), [lang])

  const [open, setOpen] = useState(false)
  const [state, setState] = useState<BiaState>(() => {
    const restored = loadSession(lang)
    return restored ?? createInitialState(lang, { sessionId: makeId(), createdAt: nowIso() })
  })
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [processedInitial, setProcessedInitial] = useState<string | null>(null)

  const stateRef = useRef(state)
  stateRef.current = state
  const contentRef = useRef(content)
  contentRef.current = content

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Persist the whole conversation so a reload restores the exact journey.
  useEffect(() => {
    saveSession(state)
  }, [state])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" })
  }, [state.transcript.length, open])

  const runEffect = useCallback(async (effect: Effect, base: BiaState) => {
    if (effect.kind === "openWhatsapp") {
      try {
        const url = buildWhatsAppUrl(base, contentRef.current, effect.includeLead)
        if (typeof window !== "undefined") window.open(url, "_blank", "noopener,noreferrer")
      } catch {
        // ignore popup failures
      }
      const res = reduce(base, { kind: "markWhatsappOpened" }, contentRef.current)
      setState(res.state)
      return
    }

    if (effect.kind === "saveLead") {
      setBusy(true)
      try {
        let ok = false
        if (canPersistLead(base)) {
          const record = toLeadRecord(base, contentRef.current, makeId())
          const result = await submitLead(record)
          ok = result.ok
        }
        // Whether or not the backend accepted it, the WhatsApp path stays open.
        const marker: BiaAction = ok ? { kind: "markSaved" } : { kind: "markError" }
        const res = reduce(stateRef.current, marker, contentRef.current)
        setState(res.state)
      } finally {
        setBusy(false)
      }
    }
  }, [])

  const dispatch = useCallback((action: BiaAction) => {
    const res = reduce(stateRef.current, action, contentRef.current)
    setState(res.state)
    stateRef.current = res.state
    if (res.effect.kind !== "none") void runEffect(res.effect, res.state)
  }, [runEffect])

  // Locale change preserves the entire journey; only future content flips language.
  useEffect(() => {
    if (stateRef.current.locale !== lang) dispatch({ kind: "setLocale", locale: lang })
  }, [lang, dispatch])

  // Hero prompt: open the widget and feed the message exactly once.
  useEffect(() => {
    if (!initialMessage) return
    if (processedInitial === initialMessage.id) return
    setProcessedInitial(initialMessage.id)
    setOpen(true)
    dispatch({ kind: "input", text: initialMessage.text })
  }, [initialMessage, processedInitial, dispatch])

  function handleSend() {
    const cleaned = normalizeWhitespace(input)
    if (!cleaned || busy) return
    setInput("")
    dispatch({ kind: "input", text: cleaned })
  }

  function handleSelect(optionId: string) {
    if (busy) return
    dispatch({ kind: "select", optionId })
  }

  function openWhatsAppDirect() {
    void runEffect({ kind: "openWhatsapp", includeLead: stateRef.current.consent.status === true }, stateRef.current)
  }

  function fullRestart() {
    clearSession()
    const fresh = createInitialState(lang, { sessionId: makeId(), createdAt: nowIso() })
    setState(fresh)
    stateRef.current = fresh
    setInput("")
  }

  const ui = useMemo(
    () => ({
      floatingAria: lang === "en" ? "Bia assistant" : "Assistente Bia",
      dialogAria: lang === "en" ? "Bioghaia conversation" : "Conversa da Bioghaia",
      inputAria: content.assistant.inputPlaceholder,
      close: lang === "en" ? "Close chat" : "Fechar chat",
      openLabel: lang === "en" ? "Open Bia" : "Abrir a Bia",
      restart: content.assistant.restartLabel,
      menu: content.options.menu,
      status:
        state.submissionState === "saving"
          ? content.assistant.savingStatus
          : lang === "en"
            ? "Ready to help"
            : "Pronta para ajudar",
    }),
    [lang, content, state.submissionState],
  )

  const options = optionsForNode(state, content)
  const showWhatsAppFooter = state.currentNodeId !== "saved"

  return (
    <div className="assistant-floating" aria-label={ui.floatingAria}>
      {open ? (
        <div className="assistant-panel" role="dialog" aria-modal="false" aria-label={ui.dialogAria}>
          <div className="assistant-header">
            <div>
              <div className="assistant-name">{content.assistant.name}</div>
              <div className="assistant-status">{ui.status}</div>
            </div>
            <div className="assistant-header-actions">
              <button type="button" className="assistant-close" onClick={() => dispatch({ kind: "requestMenu" })} aria-label={ui.menu}>
                ⌂
              </button>
              <button type="button" className="assistant-close" onClick={fullRestart} aria-label={ui.restart}>
                ↺
              </button>
              <button type="button" className="assistant-close" onClick={() => setOpen(false)} aria-label={ui.close}>
                ×
              </button>
            </div>
          </div>

          <div className="assistant-messages" role="log" aria-live="polite" aria-label={ui.dialogAria}>
            {state.transcript.map((message) => (
              <div key={message.id} className={message.role === "user" ? "msg msg-user" : "msg msg-assistant"}>
                {message.text}
              </div>
            ))}

            {options.length > 0 ? (
              <div className="assistant-options" role="group" aria-label={ui.menu}>
                {options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className="assistant-option"
                    onClick={() => handleSelect(option.id)}
                    disabled={busy}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            {state.submissionState === "error" ? (
              <div className="assistant-error" role="status">
                {content.assistant.errorBody}
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          <div className="assistant-actions">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  handleSend()
                }
              }}
              className="assistant-input"
              placeholder={content.assistant.inputPlaceholder}
              aria-label={ui.inputAria}
              maxLength={280}
              disabled={busy}
            />
            <button type="button" className="assistant-send" onClick={handleSend} disabled={busy}>
              {content.assistant.submitLabel}
            </button>
          </div>

          {showWhatsAppFooter ? (
            <div className="assistant-footer">
              <button type="button" className="assistant-whats" onClick={openWhatsAppDirect}>
                {content.assistant.openWhatsApp}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        className="assistant-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? ui.close : ui.openLabel}
      >
        {open ? "×" : "Bia"}
      </button>
    </div>
  )
}
