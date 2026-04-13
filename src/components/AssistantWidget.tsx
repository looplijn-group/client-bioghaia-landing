import { useEffect, useMemo, useRef, useState } from "react"
import "./AssistantWidget.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"
type MsgRole = "user" | "assistant"
type Msg = { role: MsgRole; text: string }

type LeadDraft = {
  projectType?: string
  location?: string
  timeline?: string
  serviceNeed?: string
  name?: string
  contact?: string
}

type AssistantContent = typeof pt

type Props = {
  initialMessage?: string | null
}

const LS_LANG = "bioghaia_lang"

function safeGetLS(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function normalizeLang(x: string | null): Lang {
  if (!x) return "pt"
  const v = x.toLowerCase()
  if (v === "en" || v.startsWith("en")) return "en"
  return "pt"
}

function buildWhatsAppLink(baseUrl: string, message?: string) {
  if (!message) return baseUrl
  const encoded = encodeURIComponent(message)
  return `${baseUrl}?text=${encoded}`
}

function fillTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{([A-Z_]+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

function summarizeLead(content: AssistantContent, lead: LeadDraft) {
  const tpl: string = content.assistant.handoff.summaryTemplate

  return fillTemplate(tpl, {
    PROJECT_TYPE: lead.projectType || "",
    LOCATION: lead.location || "",
    TIMELINE: lead.timeline || "",
    SERVICE_NEED: lead.serviceNeed || "",
    NAME: lead.name || "",
    CONTACT: lead.contact || "",
  }).trim()
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function titleCaseLoose(text: string) {
  return text
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function isLikelyEmail(text: string) {
  return /[^\s]+@[^\s]+\.[^\s]+/.test(text)
}

function isLikelyPhone(text: string) {
  return /(\+?\d[\d\s().-]{7,}\d)/.test(text)
}

function looksLikeName(text: string) {
  const clean = normalizeWhitespace(text)
  if (clean.length < 2 || clean.length > 60) return false
  if (isLikelyEmail(clean) || isLikelyPhone(clean)) return false
  if (/\d/.test(clean)) return false
  return clean.split(" ").length <= 5
}

function detectServiceNeed(text: string, lang: Lang): string | undefined {
  const t = text.toLowerCase()

  if (
    t.includes("topografia") ||
    t.includes("topographic") ||
    t.includes("topography") ||
    t.includes("levantamento")
  ) {
    return lang === "en" ? "Topography" : "Topografia"
  }

  if (
    t.includes("geoprocessamento") ||
    t.includes("gis") ||
    t.includes("geo processing") ||
    t.includes("geoprocessing") ||
    t.includes("mapeamento") ||
    t.includes("mapping")
  ) {
    return lang === "en" ? "Geoprocessing (GIS)" : "Geoprocessamento"
  }

  if (
    t.includes("licenciamento") ||
    t.includes("licenciamento ambiental") ||
    t.includes("licensing") ||
    t.includes("environmental licensing") ||
    t.includes("licença") ||
    t.includes("license")
  ) {
    return lang === "en" ? "Environmental Licensing" : "Licenciamento Ambiental"
  }

  if (
    t.includes("saneamento") ||
    t.includes("sanitation") ||
    t.includes("esgoto") ||
    t.includes("sewage") ||
    t.includes("drenagem") ||
    t.includes("drainage") ||
    t.includes("costeiro") ||
    t.includes("coastal")
  ) {
    return lang === "en"
      ? "Coastal Sanitation & Environmental Diagnosis"
      : "Saneamento Costeiro e Diagnóstico Ambiental"
  }

  return undefined
}

function detectTimeline(text: string, lang: Lang): string | undefined {
  const t = text.toLowerCase()

  if (
    t.includes("urgente") ||
    t.includes("urgent") ||
    t.includes("asap") ||
    t.includes("o quanto antes") ||
    t.includes("imediato") ||
    t.includes("immediately")
  ) {
    return lang === "en" ? "Urgent" : "Urgente"
  }

  if (
    t.includes("2 semanas") ||
    t.includes("duas semanas") ||
    t.includes("2 weeks") ||
    t.includes("two weeks")
  ) {
    return lang === "en" ? "2 weeks" : "2 semanas"
  }

  if (
    t.includes("1 mês") ||
    t.includes("1 mes") ||
    t.includes("um mês") ||
    t.includes("um mes") ||
    t.includes("1 month") ||
    t.includes("one month")
  ) {
    return lang === "en" ? "1 month" : "1 mês"
  }

  if (t.includes("semana") || t.includes("week")) {
    return lang === "en" ? "In the next few weeks" : "Nas próximas semanas"
  }

  if (t.includes("mês") || t.includes("mes") || t.includes("month")) {
    return lang === "en" ? "In the next few months" : "Nos próximos meses"
  }

  return undefined
}

function detectLocation(text: string): string | undefined {
  const clean = normalizeWhitespace(text)
  const lower = clean.toLowerCase()

  if (lower.includes("rio grande do sul")) return "Rio Grande do Sul"
  if (/\brs\b/i.test(clean)) return "Rio Grande do Sul"

  const cityPatterns = [
    /(?:cidade|city|location|local|região|region)\s*[:\-]?\s*(.+)$/i,
    /(?:em|in)\s+([A-ZÀ-ÿ][\wÀ-ÿ' -]{2,})$/i,
  ]

  for (const pattern of cityPatterns) {
    const match = clean.match(pattern)
    if (match?.[1]) return titleCaseLoose(match[1])
  }

  return undefined
}

function detectProjectType(text: string, lang: Lang): string | undefined {
  const t = text.toLowerCase()

  if (
    t.includes("residencial") ||
    t.includes("casa") ||
    t.includes("house") ||
    t.includes("residential")
  ) {
    return lang === "en" ? "Residential project" : "Projeto residencial"
  }

  if (
    t.includes("empreendimento") ||
    t.includes("development") ||
    t.includes("incorporação") ||
    t.includes("real estate")
  ) {
    return lang === "en" ? "Development project" : "Empreendimento"
  }

  if (t.includes("indústria") || t.includes("industria") || t.includes("industry")) {
    return lang === "en" ? "Industrial project" : "Projeto industrial"
  }

  if (
    t.includes("área rural") ||
    t.includes("area rural") ||
    t.includes("rural") ||
    t.includes("propriedade rural")
  ) {
    return lang === "en" ? "Rural property" : "Propriedade rural"
  }

  if (
    t.includes("regularização") ||
    t.includes("regularizacao") ||
    t.includes("regularization")
  ) {
    return lang === "en" ? "Regularization" : "Regularização"
  }

  if (t.includes("obra") || t.includes("construction")) {
    return lang === "en" ? "Construction project" : "Obra"
  }

  return undefined
}

function extractLeadHints(input: string, lead: LeadDraft, lang: Lang): LeadDraft {
  const text = normalizeWhitespace(input)
  if (!text) return lead

  const next: LeadDraft = { ...lead }

  if (!next.contact && isLikelyEmail(text)) {
    next.contact = text
  }

  if (!next.contact && isLikelyPhone(text)) {
    next.contact = text
  }

  if (!next.serviceNeed) {
    const serviceNeed = detectServiceNeed(text, lang)
    if (serviceNeed) next.serviceNeed = serviceNeed
  }

  if (!next.timeline) {
    const timeline = detectTimeline(text, lang)
    if (timeline) next.timeline = timeline
  }

  if (!next.location) {
    const location = detectLocation(text)
    if (location) next.location = location
  }

  if (!next.projectType) {
    const projectType = detectProjectType(text, lang)
    if (projectType) next.projectType = projectType
  }

  if (!next.name && looksLikeName(text)) {
    next.name = titleCaseLoose(text)
  }

  return next
}

function getNextMissingField(lead: LeadDraft): keyof LeadDraft | null {
  if (!lead.projectType) return "projectType"
  if (!lead.location) return "location"
  if (!lead.timeline) return "timeline"
  if (!lead.serviceNeed) return "serviceNeed"
  if (!lead.name) return "name"
  if (!lead.contact) return "contact"
  return null
}

function buildLocalFollowUp(content: AssistantContent, lead: LeadDraft, lang: Lang) {
  const nextField = getNextMissingField(lead)

  if (!nextField) {
    return lang === "en"
      ? "Great. I already have the main details. You can continue on WhatsApp below and send the summary directly."
      : "Perfeito. Já tenho os principais dados. Você pode continuar no WhatsApp abaixo e enviar o resumo diretamente."
  }

  return content.assistant.questions[nextField]
}

function getDefaultIntro(content: AssistantContent) {
  return content.assistant.intro
}

function getFallbackHandoffMessage(lang: Lang) {
  return lang === "en"
    ? "Hello! I would like initial guidance about surveying, geoprocessing, environmental licensing, or coastal technical diagnosis in Rio Grande do Sul."
    : "Olá! Gostaria de uma orientação inicial sobre topografia, geoprocessamento, licenciamento ambiental ou diagnóstico técnico costeiro no Rio Grande do Sul."
}

export default function AssistantWidget({ initialMessage = null }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [lead, setLead] = useState<LeadDraft>({})

  const content = useMemo<AssistantContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const [messages, setMessages] = useState<Msg[]>(() => {
    const initialLang = normalizeLang(safeGetLS(LS_LANG))
    const initialContent = initialLang === "en" ? en : pt
    return [{ role: "assistant", text: getDefaultIntro(initialContent) }]
  })

  const listRef = useRef<HTMLDivElement | null>(null)
  const processedInitialMessageRef = useRef<string | null>(null)

  useEffect(() => {
    const checkLang = () => {
      const current = normalizeLang(safeGetLS(LS_LANG))
      setLang((prev) => (prev === current ? prev : current))
    }

    checkLang()
    window.addEventListener("storage", checkLang)
    const interval = window.setInterval(checkLang, 300)

    return () => {
      window.removeEventListener("storage", checkLang)
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0]?.role === "assistant") {
        return [{ role: "assistant", text: content.assistant.intro }]
      }
      return prev
    })
  }, [content.assistant.intro])

  const handoffSummary = useMemo(() => summarizeLead(content, lead), [content, lead])

  const whatsappHref = useMemo(() => {
    const msg =
      handoffSummary && handoffSummary.length > 10
        ? `${content.assistant.handoff.summaryTitle}:\n${handoffSummary}`
        : getFallbackHandoffMessage(lang)

    return buildWhatsAppLink(content.company.whatsappUrl, msg)
  }, [content.assistant.handoff.summaryTitle, content.company.whatsappUrl, handoffSummary, lang])

  useEffect(() => {
    if (!open) return

    const t = window.setTimeout(() => {
      if (!listRef.current) return
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      })
    }, 50)

    return () => window.clearTimeout(t)
  }, [open, messages])

  async function sendMessage(rawText: string) {
    const text = normalizeWhitespace(rawText)
    if (!text) return

    setMessages((prev) => [...prev, { role: "user", text }])

    const nextLead = extractLeadHints(text, lead, lang)
    setLead(nextLead)
    setLoading(true)

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          lang,
          leadDraft: nextLead,
        }),
      })

      if (!res.ok) throw new Error("api_error")

      const data = (await res.json()) as { text?: string }

      const reply =
        (data?.text && String(data.text).trim()) || buildLocalFollowUp(content, nextLead, lang)

      setMessages((prev) => [...prev, { role: "assistant", text: reply }])
    } catch {
      const fallbackReply = buildLocalFollowUp(content, nextLead, lang)
      setMessages((prev) => [...prev, { role: "assistant", text: fallbackReply }])
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    const text = normalizeWhitespace(input)
    if (!text || loading) return

    setInput("")
    await sendMessage(text)
  }

  useEffect(() => {
    const next = normalizeWhitespace(initialMessage || "")
    if (!next) return
    if (processedInitialMessageRef.current === next) return

    processedInitialMessageRef.current = next
    setOpen(true)
    void sendMessage(next)
  }, [initialMessage]) // intentional: process once per unique message

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      void send()
    }

    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  function toggleOpen() {
    setOpen((prev) => !prev)
  }

  const ui = useMemo(() => {
    return {
      floatingAria: lang === "en" ? "Project assistant" : "Assistente de projeto",
      dialogAria: lang === "en" ? "Project intake chat" : "Chat de triagem do projeto",
      messagesAria: lang === "en" ? "Messages" : "Mensagens",
      inputAria: lang === "en" ? "Type your message" : "Digite sua mensagem",
      placeholder:
        lang === "en"
          ? "Describe your project here..."
          : "Descreva seu projeto aqui...",
      send: lang === "en" ? "Send" : "Enviar",
      close: lang === "en" ? "Close chat" : "Fechar chat",
      open: lang === "en" ? "Open assistant" : "Abrir assistente",
      closeFab: lang === "en" ? "Close assistant" : "Fechar assistente",
      statusOnline: lang === "en" ? "Ready to guide" : "Pronto para orientar",
      statusTyping: lang === "en" ? "Preparing guidance..." : "Preparando orientação...",
      whatsapp: lang === "en" ? "Go to WhatsApp" : "Ir para WhatsApp",
      yourMsg: lang === "en" ? "Your message" : "Sua mensagem",
      assistantMsg: lang === "en" ? "Assistant message" : "Mensagem do assistente",
      name: content.assistant.name,
      fabLabel: lang === "en" ? "Talk" : "Falar",
    }
  }, [content.assistant.name, lang])

  return (
    <div className="assistant-floating" aria-label={ui.floatingAria}>
      {open ? (
        <div
          className="assistant-panel"
          role="dialog"
          aria-modal="false"
          aria-label={ui.dialogAria}
        >
          <div className="assistant-header">
            <div>
              <div className="assistant-name">{ui.name}</div>
              <div className="assistant-status" aria-live="polite">
                {loading ? ui.statusTyping : ui.statusOnline}
              </div>
            </div>

            <button
              className="assistant-close"
              onClick={() => setOpen(false)}
              aria-label={ui.close}
              type="button"
            >
              ×
            </button>
          </div>

          <div
            ref={listRef}
            className="assistant-messages"
            role="log"
            aria-label={ui.messagesAria}
            aria-live="polite"
          >
            {messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}-${m.text.slice(0, 24)}`}
                className={m.role === "user" ? "msg msg-user" : "msg msg-assistant"}
                aria-label={m.role === "user" ? ui.yourMsg : ui.assistantMsg}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="assistant-actions" aria-label={ui.inputAria}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="assistant-input"
              placeholder={ui.placeholder}
              aria-label={ui.inputAria}
              autoComplete="off"
            />
            <button
              className="assistant-send"
              onClick={() => void send()}
              aria-label={ui.send}
              disabled={loading}
              type="button"
            >
              {ui.send}
            </button>
          </div>

          <div className="assistant-footer">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="assistant-whats"
              aria-label={ui.whatsapp}
            >
              {content.assistant.handoff.buttonLabel}
            </a>
          </div>
        </div>
      ) : null}

      <button
        className="assistant-fab"
        onClick={toggleOpen}
        aria-label={open ? ui.closeFab : ui.open}
        type="button"
      >
        {open ? (
          <span className="assistant-fab-close">×</span>
        ) : (
          <span className="assistant-fab-shell" aria-hidden="true">
            <span className="assistant-fab-orb">
              <span className="assistant-fab-ring assistant-fab-ring-a" />
              <span className="assistant-fab-ring assistant-fab-ring-b" />
              <span className="assistant-fab-core" />
              <span className="assistant-fab-dot assistant-fab-dot-a" />
              <span className="assistant-fab-dot assistant-fab-dot-b" />
            </span>
            <span className="assistant-fab-label">{ui.fabLabel}</span>
          </span>
        )}
      </button>
    </div>
  )
}