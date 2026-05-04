// src/components/AssistantWidget.tsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent
} from "react"
import "./AssistantWidget.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"
type MsgRole = "user" | "assistant"

type Msg = {
  id: string
  role: MsgRole
  text: string
}

type LeadDraft = {
  projectType?: string
  location?: string
  timeline?: string
  serviceNeed?: string
  name?: string
  contact?: string
}

type AssistantQuestionKey = keyof LeadDraft

type AssistantContent = {
  brand: {
    fullName: string
  }
  company: {
    serviceArea: string
    whatsappUrl: string
  }
  services: {
    items: Array<{
      title: string
    }>
  }
  assistant: {
    name: string
    intro: string
    questions: Record<AssistantQuestionKey, string>
    handoff: {
      buttonLabel: string
      summaryTitle: string
      summaryTemplate: string
    }
  }
}

type Props = {
  initialMessage?: string | null
}

type AssistantApiResponse = {
  text?: string
}

const LS_LANG = "bioghaia_lang"

const CONTENT_BY_LANG: Record<Lang, AssistantContent> = {
  pt: pt as AssistantContent,
  en: en as AssistantContent
}

function safeGetLS(key: string) {
  if (typeof window === "undefined") return null

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function normalizeLang(value: string | null): Lang {
  if (!value) return "pt"

  const normalized = value.toLowerCase()

  if (normalized === "en" || normalized.startsWith("en")) {
    return "en"
  }

  return "pt"
}

function buildWhatsAppLink(baseUrl: string, message?: string) {
  if (!message) return baseUrl

  const separator = baseUrl.includes("?") ? "&" : "?"

  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`
}

function fillTemplate(template: string, vars: Record<string, string>) {
  return template.replace(/\{([A-Z_]+)\}/g, (_, key: string) => {
    return vars[key] ?? `{${key}}`
  })
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function titleCaseLoose(text: string) {
  return normalizeWhitespace(text)
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function createMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isLikelyEmail(text: string) {
  return /[^\s]+@[^\s]+\.[^\s]+/.test(text)
}

function isLikelyPhone(text: string) {
  return /(\+?\d[\d\s().-]{7,}\d)/.test(text)
}

function extractContact(text: string): string | undefined {
  const email = text.match(/[^\s]+@[^\s]+\.[^\s]+/)
  if (email?.[0]) return email[0]

  const phone = text.match(/(\+?\d[\d\s().-]{7,}\d)/)
  if (phone?.[0]) return normalizeWhitespace(phone[0])

  return undefined
}

function looksLikeName(text: string) {
  const clean = normalizeWhitespace(text)

  if (clean.length < 2 || clean.length > 60) return false
  if (isLikelyEmail(clean) || isLikelyPhone(clean)) return false
  if (/\d/.test(clean)) return false

  const blockedWords = [
    "licenciamento",
    "licença",
    "licenca",
    "regularização",
    "regularizacao",
    "regularizar",
    "topografia",
    "topográfico",
    "topografico",
    "geoprocessamento",
    "georreferenciamento",
    "diagnóstico",
    "diagnostico",
    "reflorestamento",
    "agricultura",
    "propriedade",
    "terreno",
    "obra",
    "rural",
    "ambiental",
    "car",
    "fepam",
    "environmental",
    "permitting",
    "licensing",
    "compliance",
    "surveying",
    "geospatial",
    "assessment",
    "forestry",
    "reforestation",
    "agriculture",
    "property",
    "construction",
    "rural"
  ]

  const lower = clean.toLowerCase()

  if (blockedWords.some((word) => lower.includes(word))) return false

  return clean.split(" ").length <= 5
}

function detectServiceNeed(text: string, lang: Lang): string | undefined {
  const t = text.toLowerCase()

  if (
    t.includes("licenciamento") ||
    t.includes("licença") ||
    t.includes("licenca") ||
    t.includes("regularização") ||
    t.includes("regularizacao") ||
    t.includes("regularizar") ||
    t.includes("car") ||
    t.includes("fepam") ||
    t.includes("permitting") ||
    t.includes("licensing") ||
    t.includes("compliance") ||
    t.includes("regularization") ||
    t.includes("environmental license") ||
    t.includes("environmental permit")
  ) {
    return lang === "en"
      ? "Environmental Permitting & Compliance"
      : "Licenciamento e Regularização Ambiental"
  }

  if (
    t.includes("topografia") ||
    t.includes("topográfico") ||
    t.includes("topografico") ||
    t.includes("levantamento") ||
    t.includes("surveying") ||
    t.includes("land survey") ||
    t.includes("topography")
  ) {
    return lang === "en" ? "Land Surveying" : "Topografia"
  }

  if (
    t.includes("geoprocessamento") ||
    t.includes("georreferenciamento") ||
    t.includes("georreferenciado") ||
    t.includes("gis") ||
    t.includes("geospatial") ||
    t.includes("geoprocessing") ||
    t.includes("mapeamento") ||
    t.includes("mapping")
  ) {
    return lang === "en" ? "Geospatial Analysis" : "Geoprocessamento"
  }

  if (
    t.includes("diagnóstico") ||
    t.includes("diagnostico") ||
    t.includes("diagnosis") ||
    t.includes("diagnostic") ||
    t.includes("assessment") ||
    t.includes("impacto ambiental") ||
    t.includes("environmental impact") ||
    t.includes("análise ambiental") ||
    t.includes("analise ambiental") ||
    t.includes("environmental analysis")
  ) {
    return lang === "en" ? "Environmental Assessment" : "Diagnóstico Ambiental"
  }

  if (
    t.includes("agricultura") ||
    t.includes("lavoura") ||
    t.includes("plantação") ||
    t.includes("plantacao") ||
    t.includes("praga") ||
    t.includes("pragas") ||
    t.includes("formiga") ||
    t.includes("formigas") ||
    t.includes("reflorestamento") ||
    t.includes("florestal") ||
    t.includes("madeira") ||
    t.includes("madeireira") ||
    t.includes("drone") ||
    t.includes("drones") ||
    t.includes("sensor") ||
    t.includes("sensores") ||
    t.includes("agriculture") ||
    t.includes("crop") ||
    t.includes("crops") ||
    t.includes("pest") ||
    t.includes("pests") ||
    t.includes("forestry") ||
    t.includes("reforestation") ||
    t.includes("timber")
  ) {
    return lang === "en"
      ? "Agriculture & Reforestation"
      : "Agricultura e Reflorestamento"
  }

  if (
    t.includes("saneamento") ||
    t.includes("esgoto") ||
    t.includes("drenagem") ||
    t.includes("litoral") ||
    t.includes("litorânea") ||
    t.includes("litoranea") ||
    t.includes("litorâneo") ||
    t.includes("litoraneo") ||
    t.includes("sanitation") ||
    t.includes("sewage") ||
    t.includes("drainage") ||
    t.includes("littoral") ||
    t.includes("coastal")
  ) {
    return lang === "en"
      ? "Environmental Assessment for littoral and rural areas"
      : "Diagnóstico ambiental para áreas litorâneas e rurais"
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
    t.includes("imediatamente") ||
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

  const knownLocations = [
    "Rio Grande do Sul",
    "RS",
    "Porto Alegre",
    "Caxias do Sul",
    "Gramado",
    "Canela",
    "Bento Gonçalves",
    "Bento Goncalves",
    "Garibaldi",
    "Farroupilha",
    "Flores da Cunha",
    "Torres",
    "Capão da Canoa",
    "Capao da Canoa",
    "Xangri-lá",
    "Xangri-la",
    "Tramandaí",
    "Tramandai",
    "Osório",
    "Osorio",
    "Itati",
    "Cambará do Sul",
    "Cambara do Sul",
    "Três Cachoeiras",
    "Tres Cachoeiras",
    "Terra de Areia",
    "Maquiné",
    "Maquine",
    "Arroio do Sal",
    "Imbé",
    "Imbe",
    "Cidreira"
  ]

  for (const location of knownLocations) {
    if (location === "RS" && /\brs\b/i.test(clean)) {
      return "Rio Grande do Sul"
    }

    if (location !== "RS" && lower.includes(location.toLowerCase())) {
      return location
    }
  }

  const cityPatterns = [
    /(?:cidade|city|location|local|região|regiao|region)\s*[:\-]?\s*(.+)$/i,
    /(?:em|in)\s+([A-ZÀ-ÿ][\wÀ-ÿ' -]{2,})$/i
  ]

  for (const pattern of cityPatterns) {
    const match = clean.match(pattern)

    if (match?.[1]) {
      return titleCaseLoose(match[1])
    }
  }

  return undefined
}

function detectProjectType(text: string, lang: Lang): string | undefined {
  const t = text.toLowerCase()

  if (
    t.includes("propriedade rural") ||
    t.includes("área rural") ||
    t.includes("area rural") ||
    t.includes("sítio") ||
    t.includes("sitio") ||
    t.includes("fazenda") ||
    t.includes("rural property") ||
    t.includes("farm")
  ) {
    return lang === "en" ? "Rural property" : "Propriedade rural"
  }

  if (
    t.includes("reflorestamento") ||
    t.includes("florestal") ||
    t.includes("madeireira") ||
    t.includes("madeira") ||
    t.includes("forestry") ||
    t.includes("reforestation") ||
    t.includes("timber")
  ) {
    return lang === "en" ? "Reforestation or forestry project" : "Projeto florestal"
  }

  if (
    t.includes("agricultura") ||
    t.includes("lavoura") ||
    t.includes("plantação") ||
    t.includes("plantacao") ||
    t.includes("crop") ||
    t.includes("agriculture")
  ) {
    return lang === "en" ? "Agricultural project" : "Projeto agrícola"
  }

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
    t.includes("loteamento") ||
    t.includes("development") ||
    t.includes("incorporação") ||
    t.includes("incorporacao") ||
    t.includes("real estate")
  ) {
    return lang === "en" ? "Development project" : "Empreendimento"
  }

  if (
    t.includes("indústria") ||
    t.includes("industria") ||
    t.includes("industry") ||
    t.includes("industrial")
  ) {
    return lang === "en" ? "Industrial project" : "Projeto industrial"
  }

  if (
    t.includes("regularização") ||
    t.includes("regularizacao") ||
    t.includes("regularization") ||
    t.includes("compliance")
  ) {
    return lang === "en" ? "Compliance or regularization" : "Regularização"
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
  const contact = extractContact(text)

  if (!next.contact && contact) {
    next.contact = contact
  }

  if (!next.serviceNeed) {
    const serviceNeed = detectServiceNeed(text, lang)

    if (serviceNeed) {
      next.serviceNeed = serviceNeed
    }
  }

  if (!next.timeline) {
    const timeline = detectTimeline(text, lang)

    if (timeline) {
      next.timeline = timeline
    }
  }

  if (!next.location) {
    const location = detectLocation(text)

    if (location) {
      next.location = location
    }
  }

  if (!next.projectType) {
    const projectType = detectProjectType(text, lang)

    if (projectType) {
      next.projectType = projectType
    }
  }

  if (!next.name && looksLikeName(text)) {
    next.name = titleCaseLoose(text)
  }

  return next
}

function getNextMissingField(lead: LeadDraft): AssistantQuestionKey | null {
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
      ? "Great. I have the main details now. You can continue on WhatsApp and send the summary directly to Bioghaia."
      : "Perfeito. Já tenho os principais dados. Você pode continuar no WhatsApp e enviar o resumo diretamente para a Bioghaia."
  }

  return content.assistant.questions[nextField]
}

function summarizeLead(content: AssistantContent, lead: LeadDraft) {
  const template = content.assistant.handoff.summaryTemplate

  return fillTemplate(template, {
    PROJECT_TYPE: lead.projectType || "",
    LOCATION: lead.location || "",
    TIMELINE: lead.timeline || "",
    SERVICE_NEED: lead.serviceNeed || "",
    NAME: lead.name || "",
    CONTACT: lead.contact || ""
  }).trim()
}

function getDefaultIntro(content: AssistantContent) {
  return content.assistant.intro
}

function getFallbackHandoffMessage(lang: Lang) {
  return lang === "en"
    ? "Hello! I would like initial guidance about environmental permitting, compliance, land surveying, geospatial analysis, environmental assessment, CAR, agriculture, reforestation, or technical support in Rio Grande do Sul."
    : "Olá! Gostaria de uma orientação inicial sobre licenciamento ambiental, regularização ambiental, topografia, geoprocessamento, diagnóstico ambiental, CAR, agricultura, reflorestamento ou apoio técnico no Rio Grande do Sul."
}

export default function AssistantWidget({ initialMessage = null }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [lead, setLead] = useState<LeadDraft>({})

  const content = useMemo<AssistantContent>(() => {
    return CONTENT_BY_LANG[lang]
  }, [lang])

  const [messages, setMessages] = useState<Msg[]>(() => {
    const initialLang = normalizeLang(safeGetLS(LS_LANG))
    const initialContent = CONTENT_BY_LANG[initialLang]

    return [
      {
        id: createMessageId("assistant-intro"),
        role: "assistant",
        text: getDefaultIntro(initialContent)
      }
    ]
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
        return [
          {
            id: createMessageId("assistant-intro"),
            role: "assistant",
            text: content.assistant.intro
          }
        ]
      }

      return prev
    })
  }, [content.assistant.intro])

  const handoffSummary = useMemo(() => {
    return summarizeLead(content, lead)
  }, [content, lead])

  const whatsappHref = useMemo(() => {
    const message =
      handoffSummary && handoffSummary.length > 10
        ? `${content.assistant.handoff.summaryTitle}:\n${handoffSummary}`
        : getFallbackHandoffMessage(lang)

    return buildWhatsAppLink(content.company.whatsappUrl, message)
  }, [content, handoffSummary, lang])

  useEffect(() => {
    if (!open) return

    const timeout = window.setTimeout(() => {
      if (!listRef.current) return

      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth"
      })
    }, 50)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [open, messages])

  async function sendMessage(rawText: string) {
    const text = normalizeWhitespace(rawText)

    if (!text || loading) return

    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId("user"),
        role: "user",
        text
      }
    ])

    const nextLead = extractLeadHints(text, lead, lang)

    setLead(nextLead)
    setLoading(true)

    try {
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          lang,
          leadDraft: nextLead,
          businessContext: {
            company: content.brand.fullName,
            mainService:
              lang === "en"
                ? "Environmental Permitting & Compliance"
                : "Licenciamento e Regularização Ambiental",
            serviceArea: content.company.serviceArea,
            services: content.services.items.map((item) => item.title)
          }
        })
      })

      if (!response.ok) {
        throw new Error("api_error")
      }

      const data = (await response.json()) as AssistantApiResponse

      const reply =
        data?.text && String(data.text).trim()
          ? String(data.text).trim()
          : buildLocalFollowUp(content, nextLead, lang)

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant"),
          role: "assistant",
          text: reply
        }
      ])
    } catch {
      const fallbackReply = buildLocalFollowUp(content, nextLead, lang)

      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("assistant-fallback"),
          role: "assistant",
          text: fallbackReply
        }
      ])
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
  }, [initialMessage])

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      void send()
    }

    if (event.key === "Escape") {
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
        lang === "en" ? "Describe your project here..." : "Descreva seu projeto aqui...",
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
      fabLabel: lang === "en" ? "Talk" : "Falar"
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user" ? "msg msg-user" : "msg msg-assistant"
                }
                aria-label={message.role === "user" ? ui.yourMsg : ui.assistantMsg}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="assistant-actions" aria-label={ui.inputAria}>
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              className="assistant-input"
              placeholder={ui.placeholder}
              aria-label={ui.inputAria}
              autoComplete="off"
              maxLength={280}
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