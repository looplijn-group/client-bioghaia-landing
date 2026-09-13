import { biaContentByLang, type BiaLocaleContent, type Lang } from "./content"
import { validateField, type FieldId } from "./fieldValidators"

export type { FieldId } from "./fieldValidators"

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Bioghaia's verified WhatsApp number. Source of truth is the VITE_CLIENT_WHATSAPP
// env var (see .env.local); the literal is a safe fallback matching the value
// already published across the landing content.
function readWhatsAppNumber(): string {
  const fromEnv =
    typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_CLIENT_WHATSAPP
  return (typeof fromEnv === "string" && fromEnv.trim()) || "5554996778886"
}

export const WHATSAPP_NUMBER = readWhatsAppNumber()

// ---------------------------------------------------------------------------
// Node graph
// ---------------------------------------------------------------------------

export type NodeId =
  | "welcome"
  | "services"
  | "serviceDetail"
  | "projectHelp"
  | "askQuestion"
  | "faqAnswer"
  | "clientType"
  | "name"
  | "contactMethod"
  | "contactValue"
  | "city"
  | "objective"
  | "projectStage"
  | "deadline"
  | "note"
  | "summary"
  | "editMenu"
  | "consent"
  | "saved"
  | "declined"
  | "menuConfirm"
  | "fallback"

export type JourneyMode = "idle" | "exploration" | "qualification" | "human" | "review" | "complete"

export type NodeType =
  | "menu"
  | "info"
  | "input"
  | "choice"
  | "faq"
  | "summary"
  | "editMenu"
  | "consent"
  | "complete"
  | "fallback"

export type NodeMeta = {
  id: NodeId
  type: NodeType
  acceptFreeText: boolean
  inputField?: FieldId
  // Superset of successor nodes this node can transition to. Used by the
  // conversation-graph validator (reachability, dead ends, self loops).
  next: NodeId[]
}

// The required qualification fields, in the order Bia collects them.
// `note` is optional and offered at the summary, so it is not in this list.
export const QUALIFY_ORDER: FieldId[] = [
  "clientType",
  "name",
  "contactMethod",
  "contactValue",
  "city",
  "objective",
  "projectStage",
  "deadline",
]

const FIELD_NODES: NodeId[] = [...QUALIFY_ORDER, "note"] as NodeId[]

export const conversationNodes: Record<NodeId, NodeMeta> = {
  welcome: {
    id: "welcome",
    type: "menu",
    acceptFreeText: true,
    next: ["services", "serviceDetail", "projectHelp", "clientType", "faqAnswer", "askQuestion", "menuConfirm", "fallback"],
  },
  services: {
    id: "services",
    type: "info",
    acceptFreeText: true,
    next: ["serviceDetail", "clientType", "welcome", "faqAnswer", "fallback"],
  },
  serviceDetail: {
    id: "serviceDetail",
    type: "info",
    acceptFreeText: true,
    next: ["clientType", "askQuestion", "services", "faqAnswer", "welcome", "fallback"],
  },
  projectHelp: {
    id: "projectHelp",
    type: "input",
    acceptFreeText: true,
    inputField: "objective",
    next: ["clientType", "welcome", "faqAnswer", "fallback"],
  },
  askQuestion: {
    id: "askQuestion",
    type: "input",
    acceptFreeText: true,
    next: ["faqAnswer", "fallback", "welcome"],
  },
  faqAnswer: {
    id: "faqAnswer",
    type: "faq",
    acceptFreeText: true,
    next: ["askQuestion", "services", "clientType", "welcome", "summary", "fallback"],
  },
  clientType: {
    id: "clientType",
    type: "choice",
    acceptFreeText: true,
    inputField: "clientType",
    next: ["name", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  name: {
    id: "name",
    type: "input",
    acceptFreeText: true,
    inputField: "name",
    next: ["contactMethod", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  contactMethod: {
    id: "contactMethod",
    type: "choice",
    acceptFreeText: true,
    inputField: "contactMethod",
    next: ["contactValue", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  contactValue: {
    id: "contactValue",
    type: "input",
    acceptFreeText: true,
    inputField: "contactValue",
    next: ["city", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  city: {
    id: "city",
    type: "input",
    acceptFreeText: true,
    inputField: "city",
    next: ["objective", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  objective: {
    id: "objective",
    type: "input",
    acceptFreeText: true,
    inputField: "objective",
    next: ["projectStage", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  projectStage: {
    id: "projectStage",
    type: "choice",
    acceptFreeText: true,
    inputField: "projectStage",
    next: ["deadline", "summary", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  deadline: {
    id: "deadline",
    type: "input",
    acceptFreeText: true,
    inputField: "deadline",
    next: ["summary", "note", "welcome", "faqAnswer", "askQuestion", "fallback"],
  },
  note: {
    id: "note",
    type: "input",
    acceptFreeText: true,
    inputField: "note",
    next: ["summary", "welcome", "fallback"],
  },
  summary: {
    id: "summary",
    type: "summary",
    acceptFreeText: true,
    next: ["consent", "editMenu", "note", "welcome", "clientType", "fallback"],
  },
  editMenu: {
    id: "editMenu",
    type: "editMenu",
    acceptFreeText: false,
    next: [...FIELD_NODES, "summary"],
  },
  consent: {
    id: "consent",
    type: "consent",
    acceptFreeText: true,
    next: ["saved", "declined", "clientType", "welcome"],
  },
  saved: {
    id: "saved",
    type: "complete",
    acceptFreeText: false,
    next: ["welcome"],
  },
  declined: {
    id: "declined",
    type: "complete",
    acceptFreeText: false,
    next: ["welcome", "clientType"],
  },
  menuConfirm: {
    id: "menuConfirm",
    type: "menu",
    acceptFreeText: true,
    next: ["welcome", "clientType", "services", "serviceDetail"],
  },
  fallback: {
    id: "fallback",
    type: "fallback",
    acceptFreeText: true,
    next: ["services", "clientType", "welcome"],
  },
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type Role = "assistant" | "user"

export type TranscriptEntry = {
  id: string
  role: Role
  nodeId: NodeId
  text: string
}

export type ConsentState = { status: boolean | null; at: string | null }

export type SubmissionState = "idle" | "saving" | "saved" | "error"
export type WhatsAppState = "none" | "prepared" | "opened"
export type FallbackKind = "clarify" | "simpler" | "human"

export type BiaState = {
  locale: Lang
  sessionId: string
  createdAt: string
  currentNodeId: NodeId
  journeyMode: JourneyMode
  selectedServiceId: string | null
  collected: Partial<Record<FieldId, string>>
  resumeNodeId: NodeId | null
  lastFaqId: string | null
  fallbackCount: number
  lastFallbackKind: FallbackKind | null
  consent: ConsentState
  submissionState: SubmissionState
  whatsappState: WhatsAppState
  editingField: FieldId | null
  transcript: TranscriptEntry[]
  seq: number
}

export type OptionAction =
  | { t: "goto"; node: NodeId }
  | { t: "service"; serviceId: string }
  | { t: "startQualify"; mode: "purchase" | "human" }
  | { t: "field"; field: FieldId; value: string }
  | { t: "faq"; faqId: string }
  | { t: "whatsapp" }
  | { t: "team" }
  | { t: "menu" }
  | { t: "restart" }
  | { t: "confirm" }
  | { t: "consent"; value: boolean }
  | { t: "edit" }
  | { t: "editPick"; field: FieldId }
  | { t: "addNote" }
  | { t: "skipNote" }
  | { t: "resumeContinue" }
  | { t: "keepAndMenu" }
  | { t: "openSavedWhatsapp" }

export type Option = { id: string; label: string; action: OptionAction }

export type BiaAction =
  | { kind: "select"; optionId: string }
  | { kind: "input"; text: string }
  | { kind: "setLocale"; locale: Lang }
  | { kind: "requestMenu" }
  | { kind: "markSaving" }
  | { kind: "markSaved" }
  | { kind: "markError" }
  | { kind: "markWhatsappOpened" }
  | { kind: "rotateSession"; sessionId: string; createdAt: string; resetProgress: boolean }

export type Effect =
  | { kind: "none" }
  | { kind: "openWhatsapp"; includeLead: boolean }
  | { kind: "saveLead" }
  | { kind: "requestSessionRotation"; resetProgress: boolean }

export type ReduceResult = { state: BiaState; emitted: string[]; effect: Effect }

// ---------------------------------------------------------------------------
// Content helpers
// ---------------------------------------------------------------------------

export function getContent(lang: Lang): BiaLocaleContent {
  return biaContentByLang[lang]
}

const CLIENT_TYPE_CANON: Record<string, keyof BiaLocaleContent["options"]> = {
  individual: "individual",
  company: "company",
  public: "publicOrganization",
  other: "other",
}

const CONTACT_METHOD_CANON: Record<string, keyof BiaLocaleContent["options"]> = {
  whatsapp: "whatsapp",
  phone: "phone",
  email: "email",
}

const STAGE_CANON: Record<string, keyof BiaLocaleContent["options"]> = {
  idea: "stageIdea",
  planning: "stagePlanning",
  ongoing: "stageOngoing",
}

const FIELD_LABEL_KEY: Record<FieldId, keyof BiaLocaleContent["fields"]> = {
  clientType: "customerType",
  name: "name",
  contactMethod: "contactMethod",
  contactValue: "contact",
  city: "city",
  objective: "objective",
  projectStage: "projectStage",
  deadline: "deadline",
  note: "note",
}

export function displayFieldValue(content: BiaLocaleContent, field: FieldId, value: string): string {
  if (field === "clientType" && CLIENT_TYPE_CANON[value]) return content.options[CLIENT_TYPE_CANON[value]]
  if (field === "contactMethod" && CONTACT_METHOD_CANON[value]) return content.options[CONTACT_METHOD_CANON[value]]
  if (field === "projectStage" && STAGE_CANON[value]) return content.options[STAGE_CANON[value]]
  if (field === "deadline" && value === "__none__") return content.options.deadlineNone
  return value
}

function contactMethodCategory(canon?: string): string {
  if (canon === "email") return "Email"
  if (canon === "phone" || canon === "whatsapp") return "Phone"
  return ""
}

// ---------------------------------------------------------------------------
// Text normalisation and intent matching
// ---------------------------------------------------------------------------

function normalizeText(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function matchesWholeWord(haystack: string, term: string): boolean {
  const normalizedTerm = normalizeText(term.trim())
  if (!normalizedTerm) return false
  const regex = new RegExp(`\\b${escapeRegExp(normalizedTerm)}\\b`, "u")
  return regex.test(normalizeText(haystack))
}

type GlobalIntent = "menu" | "restart" | "team" | "whatsapp" | "services" | "assist" | null

function parseGlobalIntent(text: string): GlobalIntent {
  const n = normalizeText(text)
  if (/(^|\b)(recomecar|comecar de novo|start again|restart|reset)(\b|$)/.test(n)) return "restart"
  if (/(^|\b)(menu principal|main menu|voltar ao menu|back to the menu|home|inicio)(\b|$)/.test(n)) return "menu"
  if (/(falar com a equipe|talk to the team|com um humano|com uma pessoa|atendente|equipe|human agent)/.test(n)) return "team"
  if (/(whatsapp|zap|zapzap)/.test(n)) return "whatsapp"
  if (/(ver os servicos|conhecer os servicos|ver servicos|our services|explore.*services|servicos|services)/.test(n)) return "services"
  if (/(quero atendimento|solicitar atendimento|preciso de ajuda|help with a project|request assistance|would like assistance|contratar|orcamento)/.test(n)) return "assist"
  return null
}

function isQuestion(text: string): boolean {
  const trimmed = text.trim()
  if (trimmed.endsWith("?")) return true
  const n = normalizeText(trimmed)
  return /^(o que|oque|qual|quais|quando|quem|como|onde|por que|porque|voces|voce|do you|does|what|when|who|how|where|why|can you|are you|is it|are there)\b/.test(n)
}

function getServiceByAlias(content: BiaLocaleContent, text: string) {
  const normalized = normalizeText(text).trim()
  if (normalized.length < 4) return undefined
  return content.services.find((service) => {
    const aliases = [service.id, service.name]
    return aliases.some((alias) => {
      const normalizedAlias = normalizeText(alias)
      return normalizedAlias === normalized || matchesWholeWord(alias, normalized) || matchesWholeWord(text, alias)
    })
  })
}

function getFaqByAlias(content: BiaLocaleContent, text: string) {
  const normalized = normalizeText(text)
  if (normalized.length < 4) return undefined
  return content.faq.find(
    (item) => normalizeText(item.question).includes(normalized) || normalized.split(/\s+/).some((word) => word.length > 4 && normalizeText(item.question).includes(word)),
  )
}

function mapClientTypeFreeText(text: string): string {
  const n = normalizeText(text)
  if (/(empresa|company|cnpj|ltda|firma)/.test(n)) return "company"
  if (/(orgao|órgão|prefeitura|public|governo|municipio)/.test(n)) return "public"
  if (/(pessoa fisica|individual|autonomo|cpf|sou eu|particular)/.test(n)) return "individual"
  return text.trim()
}

function mapStageFreeText(text: string): string {
  const n = normalizeText(text)
  if (/(ideia|idea|pensando|inicio|começando|comecando)/.test(n)) return "idea"
  if (/(planejamento|planning|planejando|projeto inicial)/.test(n)) return "planning"
  if (/(andamento|ongoing|em curso|executando|obra em)/.test(n)) return "ongoing"
  return text.trim()
}

function mapContactMethodFreeText(text: string): string | null {
  const n = normalizeText(text)
  if (/(whatsapp|zap)/.test(n)) return "whatsapp"
  if (/(telefone|phone|celular|ligar|ligacao)/.test(n)) return "phone"
  if (/(email|e-mail|mail)/.test(n)) return "email"
  return null
}

// ---------------------------------------------------------------------------
// Next-field logic
// ---------------------------------------------------------------------------

export function nextRequiredField(state: BiaState): FieldId | null {
  for (const field of QUALIFY_ORDER) {
    const value = state.collected[field]
    if (!value || !value.trim()) return field
  }
  return null
}

function nextQualifyNode(state: BiaState): NodeId {
  return (nextRequiredField(state) as NodeId | null) ?? "summary"
}

export function hasMeaningfulProgress(state: BiaState): boolean {
  if (state.selectedServiceId) return true
  return QUALIFY_ORDER.some((field) => Boolean(state.collected[field]))
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export function buildLeadSummary(content: BiaLocaleContent, state: BiaState): string {
  const lines: string[] = [content.assistant.summaryIntro, ""]
  if (state.selectedServiceId) {
    const service = content.services.find((item) => item.id === state.selectedServiceId)
    if (service) lines.push(`${content.fields.service}: ${service.name}`)
  }
  for (const field of QUALIFY_ORDER) {
    const value = state.collected[field]
    if (value) lines.push(`${content.fields[FIELD_LABEL_KEY[field]]}: ${displayFieldValue(content, field, value)}`)
  }
  if (state.collected.note) lines.push(`${content.fields.note}: ${state.collected.note}`)
  lines.push(`${content.fields.language}: ${state.locale === "en" ? "English" : "Português"}`)
  lines.push(`${content.fields.source}: ${state.locale === "en" ? "Bioghaia landing page" : "Página de destino Bioghaia"}`)
  const consentLabel = state.consent.status ? content.assistant.consentYes : content.assistant.consentNo
  lines.push(`${content.fields.consent}: ${consentLabel}`)
  return lines.join("\n")
}

export function buildWhatsAppMessage(content: BiaLocaleContent, state: BiaState): string {
  return `${content.assistant.summaryTitle}\n\n${buildLeadSummary(content, state)}`
}

export function buildWhatsAppUrl(state: BiaState, content: BiaLocaleContent, includeLead: boolean): string {
  const text = includeLead ? buildWhatsAppMessage(content, state) : content.assistant.whatsappGenericPrefill
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
}

function nodeMessage(state: BiaState, content: BiaLocaleContent, nodeId: NodeId): string {
  switch (nodeId) {
    case "welcome":
      return content.assistant.intro
    case "services":
      return content.prompts.productsPrompt
    case "serviceDetail": {
      const service = content.services.find((item) => item.id === state.selectedServiceId)
      if (!service) return content.prompts.productsPrompt
      return `${service.name}\n\n${service.description}\n\n${service.safeNote}`
    }
    case "projectHelp":
      return content.assistant.describeIntro
    case "askQuestion":
      return content.assistant.clarificationBody
    case "faqAnswer": {
      const item = content.faq.find((faq) => faq.id === state.lastFaqId)
      return item ? `${item.question}\n${item.answer}` : content.assistant.fallbackBody
    }
    case "clientType":
      return content.prompts.customerTypePrompt
    case "name":
      return content.prompts.namePrompt
    case "contactMethod":
      return content.prompts.contactMethodPrompt
    case "contactValue":
      return content.prompts.contactValuePrompt
    case "city":
      return content.prompts.cityPrompt
    case "objective":
      return content.prompts.objectivePrompt
    case "projectStage":
      return content.prompts.projectStagePrompt
    case "deadline":
      return content.prompts.deadlinePrompt
    case "note":
      return content.prompts.notePrompt
    case "summary":
      return `${content.assistant.reviewTitle}\n\n${content.assistant.reviewIntro}\n\n${buildLeadSummary(content, state)}`
    case "editMenu":
      return content.assistant.editIntro
    case "consent":
      return content.assistant.consentPrompt
    case "saved":
      return content.assistant.successBody
    case "declined":
      return content.assistant.consentDeclinedBody
    case "menuConfirm":
      return `${content.assistant.menuConfirmTitle}\n\n${content.assistant.menuConfirmBody}`
    case "fallback":
      return content.assistant.fallbackBody
    default:
      return content.assistant.fallbackBody
  }
}

// ---------------------------------------------------------------------------
// Reducer plumbing
// ---------------------------------------------------------------------------

function clone(state: BiaState): BiaState {
  return {
    ...state,
    collected: { ...state.collected },
    consent: { ...state.consent },
    transcript: state.transcript.slice(),
  }
}

function push(draft: BiaState, role: Role, nodeId: NodeId, text: string): void {
  draft.transcript.push({ id: `${role}-${draft.seq}`, role, nodeId, text })
  draft.seq += 1
}

function modeForNode(nodeId: NodeId, prevMode: JourneyMode): JourneyMode {
  if (nodeId === "welcome") return "idle"
  if (nodeId === "services" || nodeId === "serviceDetail") return "exploration"
  if (nodeId === "summary" || nodeId === "editMenu") return "review"
  if (nodeId === "saved" || nodeId === "declined") return "complete"
  if (FIELD_NODES.includes(nodeId) || nodeId === "consent") {
    return prevMode === "human" ? "human" : "qualification"
  }
  return prevMode
}

// Enter a node: set currentNodeId, recompute journeyMode, reset fallback tracking,
// and emit the node's message (plus optional prefaces).
function enter(draft: BiaState, content: BiaLocaleContent, nodeId: NodeId, prefaces: string[] = []): void {
  draft.currentNodeId = nodeId
  draft.journeyMode = modeForNode(nodeId, draft.journeyMode)
  draft.fallbackCount = 0
  draft.lastFallbackKind = null
  for (const preface of prefaces) push(draft, "assistant", nodeId, preface)
  push(draft, "assistant", nodeId, nodeMessage(draft, content, nodeId))
}

function setFieldAndAdvance(draft: BiaState, content: BiaLocaleContent, field: FieldId, value: string): void {
  draft.collected[field] = value
  if (draft.editingField === field) {
    draft.editingField = null
    enter(draft, content, "summary")
    return
  }
  if (field === "note") {
    enter(draft, content, "summary")
    return
  }
  enter(draft, content, nextQualifyNode(draft))
}

function startQualify(draft: BiaState, content: BiaLocaleContent, mode: "purchase" | "human"): void {
  draft.journeyMode = mode === "human" ? "human" : "qualification"
  draft.editingField = null
  enter(draft, content, nextQualifyNode(draft))
}

function goMenu(draft: BiaState, content: BiaLocaleContent): void {
  if (hasMeaningfulProgress(draft) && draft.currentNodeId !== "menuConfirm") {
    draft.resumeNodeId = draft.currentNodeId
    enter(draft, content, "menuConfirm")
    return
  }
  enter(draft, content, "welcome")
}

function doFallback(draft: BiaState, content: BiaLocaleContent): void {
  // Escalate: 1) contextual clarification, 2) simpler choices, 3) human handoff.
  const nextCount = draft.fallbackCount + 1
  let kind: FallbackKind = "clarify"
  let message = content.assistant.clarificationBody
  if (nextCount >= 3) {
    kind = "human"
    message = content.assistant.fallbackHumanBody
  } else if (nextCount === 2) {
    kind = "simpler"
    message = content.assistant.fallbackSimplerBody
  }
  // Never repeat the same fallback consecutively: if we would repeat, advance one step.
  if (kind === draft.lastFallbackKind && kind !== "human") {
    kind = "human"
    message = content.assistant.fallbackHumanBody
  }
  draft.currentNodeId = "fallback"
  draft.fallbackCount = nextCount
  draft.lastFallbackKind = kind
  push(draft, "assistant", "fallback", message)
}

function emitError(draft: BiaState, message: string): void {
  push(draft, "assistant", draft.currentNodeId, message)
}

// ---------------------------------------------------------------------------
// Runtime options
// ---------------------------------------------------------------------------

function globalTail(content: BiaLocaleContent, prefix: string, includeMenu = true): Option[] {
  const tail: Option[] = [
    { id: `${prefix}-team`, label: content.options.team, action: { t: "team" } },
    { id: `${prefix}-wa`, label: content.options.whatsappDirect, action: { t: "whatsapp" } },
  ]
  if (includeMenu) tail.push({ id: `${prefix}-menu`, label: content.options.menu, action: { t: "menu" } })
  return tail
}

export function optionsForNode(state: BiaState, content: BiaLocaleContent): Option[] {
  const node = state.currentNodeId
  switch (node) {
    case "welcome":
      return [
        { id: "welcome-services", label: content.options.products, action: { t: "goto", node: "services" } },
        { id: "welcome-project", label: content.options.projectHelp, action: { t: "goto", node: "projectHelp" } },
        { id: "welcome-team", label: content.options.team, action: { t: "team" } },
        { id: "welcome-wa", label: content.options.whatsappDirect, action: { t: "whatsapp" } },
      ]
    case "services":
      return [
        ...content.services.map((service) => ({
          id: `service-${service.id}`,
          label: service.name,
          action: { t: "service", serviceId: service.id } as OptionAction,
        })),
        ...globalTail(content, "services"),
      ]
    case "serviceDetail":
      return [
        { id: "detail-assist", label: content.options.assist, action: { t: "startQualify", mode: "purchase" } },
        { id: "detail-question", label: content.options.question, action: { t: "goto", node: "askQuestion" } },
        { id: "detail-another", label: content.options.anotherService, action: { t: "goto", node: "services" } },
        ...globalTail(content, "detail"),
      ]
    case "projectHelp":
      return globalTail(content, "project")
    case "askQuestion":
      return globalTail(content, "ask")
    case "faqAnswer": {
      const options: Option[] = []
      if (state.resumeNodeId) options.push({ id: "faq-resume", label: content.options.continueRequest, action: { t: "resumeContinue" } })
      options.push({ id: "faq-another", label: content.options.anotherQuestion, action: { t: "goto", node: "askQuestion" } })
      options.push({ id: "faq-services", label: content.options.products, action: { t: "goto", node: "services" } })
      options.push(...globalTail(content, "faq"))
      return options
    }
    case "clientType":
      return [
        { id: "ct-individual", label: content.options.individual, action: { t: "field", field: "clientType", value: "individual" } },
        { id: "ct-company", label: content.options.company, action: { t: "field", field: "clientType", value: "company" } },
        { id: "ct-public", label: content.options.publicOrganization, action: { t: "field", field: "clientType", value: "public" } },
        { id: "ct-other", label: content.options.other, action: { t: "field", field: "clientType", value: "other" } },
        ...globalTail(content, "ct"),
      ]
    case "contactMethod":
      return [
        { id: "cm-whatsapp", label: content.options.whatsapp, action: { t: "field", field: "contactMethod", value: "whatsapp" } },
        { id: "cm-phone", label: content.options.phone, action: { t: "field", field: "contactMethod", value: "phone" } },
        { id: "cm-email", label: content.options.email, action: { t: "field", field: "contactMethod", value: "email" } },
        ...globalTail(content, "cm"),
      ]
    case "projectStage":
      return [
        { id: "ps-idea", label: content.options.stageIdea, action: { t: "field", field: "projectStage", value: "idea" } },
        { id: "ps-planning", label: content.options.stagePlanning, action: { t: "field", field: "projectStage", value: "planning" } },
        { id: "ps-ongoing", label: content.options.stageOngoing, action: { t: "field", field: "projectStage", value: "ongoing" } },
        ...globalTail(content, "ps"),
      ]
    case "deadline":
      return [
        { id: "dl-none", label: content.options.deadlineNone, action: { t: "field", field: "deadline", value: "__none__" } },
        ...globalTail(content, "dl"),
      ]
    case "name":
    case "contactValue":
    case "city":
    case "objective":
      return globalTail(content, node)
    case "note":
      return [
        { id: "note-skip", label: content.options.skipNote, action: { t: "skipNote" } },
        { id: "note-team", label: content.options.team, action: { t: "team" } },
      ]
    case "summary":
      return [
        { id: "sum-confirm", label: content.assistant.reviewConfirm, action: { t: "confirm" } },
        { id: "sum-edit", label: content.options.editField, action: { t: "edit" } },
        { id: "sum-note", label: content.options.addNote, action: { t: "addNote" } },
        { id: "sum-team", label: content.options.team, action: { t: "team" } },
        { id: "sum-wa", label: content.options.whatsappDirect, action: { t: "whatsapp" } },
        { id: "sum-menu", label: content.options.menu, action: { t: "menu" } },
      ]
    case "editMenu": {
      const options: Option[] = []
      for (const field of [...QUALIFY_ORDER, "note" as FieldId]) {
        if (state.collected[field]) {
          options.push({
            id: `edit-${field}`,
            label: content.fields[FIELD_LABEL_KEY[field]],
            action: { t: "editPick", field },
          })
        }
      }
      options.push({ id: "edit-back", label: content.assistant.reviewConfirm, action: { t: "goto", node: "summary" } })
      return options
    }
    case "consent":
      return [
        { id: "consent-yes", label: content.assistant.consentYes, action: { t: "consent", value: true } },
        { id: "consent-no", label: content.assistant.consentNo, action: { t: "consent", value: false } },
        { id: "consent-team", label: content.options.team, action: { t: "team" } },
      ]
    case "saved":
      return [
        { id: "saved-wa", label: content.assistant.openWhatsApp, action: { t: "openSavedWhatsapp" } },
        { id: "saved-menu", label: content.options.menu, action: { t: "menu" } },
        { id: "saved-restart", label: content.options.restart, action: { t: "restart" } },
      ]
    case "declined":
      return [
        { id: "declined-wa", label: content.options.whatsappDirect, action: { t: "whatsapp" } },
        { id: "declined-team", label: content.options.team, action: { t: "team" } },
        { id: "declined-menu", label: content.options.menu, action: { t: "menu" } },
      ]
    case "menuConfirm":
      return [
        { id: "mc-continue", label: content.options.continueRequest, action: { t: "resumeContinue" } },
        { id: "mc-keep", label: content.options.keepProgress, action: { t: "keepAndMenu" } },
        { id: "mc-restart", label: content.options.startAgain, action: { t: "restart" } },
      ]
    case "fallback": {
      const options: Option[] = [
        { id: "fb-services", label: content.options.products, action: { t: "goto", node: "services" } },
        { id: "fb-team", label: content.options.team, action: { t: "team" } },
        { id: "fb-wa", label: content.options.whatsappDirect, action: { t: "whatsapp" } },
      ]
      if (state.resumeNodeId) options.unshift({ id: "fb-resume", label: content.options.continueRequest, action: { t: "resumeContinue" } })
      return options
    }
    default:
      return []
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export type InitOptions = { sessionId?: string; createdAt?: string }

export function createInitialState(locale: Lang, opts: InitOptions = {}): BiaState {
  const content = getContent(locale)
  const state: BiaState = {
    locale,
    sessionId: opts.sessionId ?? "session-fixed",
    createdAt: opts.createdAt ?? "1970-01-01T00:00:00.000Z",
    currentNodeId: "welcome",
    journeyMode: "idle",
    selectedServiceId: null,
    collected: {},
    resumeNodeId: null,
    lastFaqId: null,
    fallbackCount: 0,
    lastFallbackKind: null,
    consent: { status: null, at: null },
    submissionState: "idle",
    whatsappState: "none",
    editingField: null,
    transcript: [],
    seq: 0,
  }
  push(state, "assistant", "welcome", content.assistant.intro)
  return state
}

function applyOptionAction(draft: BiaState, content: BiaLocaleContent, action: OptionAction): Effect {
  switch (action.t) {
    case "goto":
      enter(draft, content, action.node)
      return { kind: "none" }
    case "service":
      draft.selectedServiceId = action.serviceId
      enter(draft, content, "serviceDetail")
      return { kind: "none" }
    case "startQualify":
      startQualify(draft, content, action.mode)
      return { kind: "none" }
    case "team":
      startQualify(draft, content, "human")
      return { kind: "none" }
    case "field": {
      const validation = validateField(action.field, action.value, contactMethodCategory(draft.collected.contactMethod))
      if (!validation.ok) {
        emitError(draft, content.validation[validation.errorKey])
        return { kind: "none" }
      }
      setFieldAndAdvance(draft, content, action.field, validation.value)
      return { kind: "none" }
    }
    case "faq":
      draft.lastFaqId = action.faqId
      enter(draft, content, "faqAnswer")
      return { kind: "none" }
    case "whatsapp": {
      const includeLead = draft.consent.status === true
      return { kind: "openWhatsapp", includeLead }
    }
    case "menu":
      goMenu(draft, content)
      return { kind: "none" }
    case "restart":
      // Restart is confirmed at menuConfirm or the saved screen; clear data, keep locale.
      return { kind: "none" } // handled by caller via reset
    case "confirm":
      enter(draft, content, "consent")
      return { kind: "none" }
    case "consent": {
      draft.consent = { status: action.value, at: draft.createdAt }
      if (action.value) {
        draft.submissionState = "saving"
        enter(draft, content, "saved", [content.assistant.savingStatus])
        return { kind: "saveLead" }
      }
      enter(draft, content, "declined")
      return { kind: "none" }
    }
    case "edit":
      enter(draft, content, "editMenu")
      return { kind: "none" }
    case "editPick":
      draft.editingField = action.field
      enter(draft, content, action.field as NodeId)
      return { kind: "none" }
    case "addNote":
      draft.editingField = null
      enter(draft, content, "note")
      return { kind: "none" }
    case "skipNote":
      enter(draft, content, "summary")
      return { kind: "none" }
    case "resumeContinue": {
      const target = draft.resumeNodeId ?? nextQualifyNode(draft)
      draft.resumeNodeId = null
      enter(draft, content, target, [content.assistant.resumeIntro])
      return { kind: "none" }
    }
    case "keepAndMenu":
      if (draft.submissionState === "saved") {
        // A completed submission must not hand its session_id to the next
        // conversation; defer id/time generation to the caller (BiaWidget).
        return { kind: "requestSessionRotation", resetProgress: false }
      }
      draft.resumeNodeId = null
      enter(draft, content, "welcome")
      return { kind: "none" }
    case "openSavedWhatsapp":
      return { kind: "openWhatsapp", includeLead: true }
    default:
      return { kind: "none" }
  }
}

function handleInput(draft: BiaState, content: BiaLocaleContent, rawText: string): Effect {
  const text = rawText.replace(/\s+/g, " ").trim()
  if (!text) return { kind: "none" }

  const node = conversationNodes[draft.currentNodeId]

  // 1. Explicit global commands take priority everywhere.
  const global = parseGlobalIntent(text)
  if (global === "restart") {
    goMenu(draft, content) // routes to menuConfirm when progress exists, offering a safe restart
    return { kind: "none" }
  }
  if (global === "menu") {
    goMenu(draft, content)
    return { kind: "none" }
  }
  if (global === "team") {
    startQualify(draft, content, "human")
    return { kind: "none" }
  }
  if (global === "whatsapp") {
    return { kind: "openWhatsapp", includeLead: draft.consent.status === true }
  }

  // 2. Consent node understands yes / no in free text.
  if (draft.currentNodeId === "consent") {
    const n = normalizeText(text)
    if (/^(sim|s|yes|y|claro|pode)\b/.test(n)) return applyOptionAction(draft, content, { t: "consent", value: true })
    if (/^(nao|n|no|prefiro nao)\b/.test(n)) return applyOptionAction(draft, content, { t: "consent", value: false })
  }

  // 3. A genuine question interrupts to the FAQ (preserving resume + fields).
  if (isQuestion(text)) {
    const faq = getFaqByAlias(content, text)
    if (faq) {
      if ((draft.journeyMode === "qualification" || draft.journeyMode === "human") && FIELD_NODES.includes(draft.currentNodeId)) {
        draft.resumeNodeId = draft.currentNodeId
      }
      draft.lastFaqId = faq.id
      enter(draft, content, "faqAnswer")
      return { kind: "none" }
    }
    if (draft.currentNodeId === "askQuestion") {
      doFallback(draft, content)
      return { kind: "none" }
    }
  }

  // 4. askQuestion always routes free text through FAQ matching.
  if (draft.currentNodeId === "askQuestion") {
    const faq = getFaqByAlias(content, text)
    if (faq) {
      draft.lastFaqId = faq.id
      enter(draft, content, "faqAnswer")
      return { kind: "none" }
    }
    doFallback(draft, content)
    return { kind: "none" }
  }

  // 5. Field-first: at an input/choice node, interpret the text as that field.
  if (node.inputField) {
    const field = node.inputField
    let value = text
    if (field === "clientType") value = mapClientTypeFreeText(text)
    else if (field === "projectStage") value = mapStageFreeText(text)
    else if (field === "contactMethod") {
      const mapped = mapContactMethodFreeText(text)
      if (!mapped) {
        doFallback(draft, content)
        return { kind: "none" }
      }
      value = mapped
    }

    // projectHelp seeds the objective, then begins qualification.
    if (draft.currentNodeId === "projectHelp") {
      const validation = validateField("objective", value)
      if (!validation.ok) {
        emitError(draft, content.validation[validation.errorKey])
        return { kind: "none" }
      }
      draft.collected.objective = validation.value
      startQualify(draft, content, "purchase")
      return { kind: "none" }
    }

    const validation = validateField(field, value, contactMethodCategory(draft.collected.contactMethod))
    if (!validation.ok) {
      emitError(draft, content.validation[validation.errorKey])
      return { kind: "none" }
    }
    setFieldAndAdvance(draft, content, field, validation.value)
    return { kind: "none" }
  }

  // 6. Summary free text becomes an added note.
  if (draft.currentNodeId === "summary") {
    draft.collected.note = text
    enter(draft, content, "summary")
    return { kind: "none" }
  }

  // 7. Non-input nodes: service alias, FAQ alias, assist intent, else fallback.
  if (global === "services") {
    enter(draft, content, "services")
    return { kind: "none" }
  }
  const service = getServiceByAlias(content, text)
  if (service) {
    draft.selectedServiceId = service.id
    enter(draft, content, "serviceDetail")
    return { kind: "none" }
  }
  const faq = getFaqByAlias(content, text)
  if (faq) {
    draft.lastFaqId = faq.id
    enter(draft, content, "faqAnswer")
    return { kind: "none" }
  }
  if (global === "assist") {
    startQualify(draft, content, "purchase")
    return { kind: "none" }
  }
  doFallback(draft, content)
  return { kind: "none" }
}

export function reduce(state: BiaState, action: BiaAction, content: BiaLocaleContent): ReduceResult {
  const startLen = state.transcript.length

  // Locale change preserves the entire journey; only content language flips.
  if (action.kind === "setLocale") {
    if (action.locale === state.locale) return { state, emitted: [], effect: { kind: "none" } }
    const draft = clone(state)
    draft.locale = action.locale
    return { state: draft, emitted: [], effect: { kind: "none" } }
  }

  if (action.kind === "requestMenu") {
    const draft = clone(state)
    goMenu(draft, content)
    return { state: draft, emitted: draft.transcript.slice(startLen).map((entry) => entry.text), effect: { kind: "none" } }
  }

  if (action.kind === "markSaving") {
    const draft = clone(state)
    draft.submissionState = "saving"
    return { state: draft, emitted: [], effect: { kind: "none" } }
  }

  if (action.kind === "markSaved") {
    const draft = clone(state)
    draft.submissionState = "saved"
    draft.whatsappState = "prepared"
    push(draft, "assistant", "saved", content.assistant.leadSavedStatus)
    push(draft, "assistant", "saved", content.assistant.whatsappPreparedStatus)
    return { state: draft, emitted: draft.transcript.slice(startLen).map((entry) => entry.text), effect: { kind: "none" } }
  }

  if (action.kind === "markError") {
    const draft = clone(state)
    draft.submissionState = "error"
    push(draft, "assistant", draft.currentNodeId, content.assistant.errorBody)
    return { state: draft, emitted: draft.transcript.slice(startLen).map((entry) => entry.text), effect: { kind: "none" } }
  }

  if (action.kind === "markWhatsappOpened") {
    const draft = clone(state)
    draft.whatsappState = "opened"
    push(draft, "assistant", draft.currentNodeId, content.assistant.whatsappOpenedStatus)
    return { state: draft, emitted: draft.transcript.slice(startLen).map((entry) => entry.text), effect: { kind: "none" } }
  }

  if (action.kind === "rotateSession") {
    if (action.resetProgress) {
      const fresh = createInitialState(state.locale, { sessionId: action.sessionId, createdAt: action.createdAt })
      return { state: fresh, emitted: fresh.transcript.map((entry) => entry.text), effect: { kind: "none" } }
    }
    const draft = clone(state)
    draft.sessionId = action.sessionId
    draft.createdAt = action.createdAt
    draft.submissionState = "idle"
    draft.whatsappState = "none"
    draft.consent = { status: null, at: null }
    draft.resumeNodeId = null
    enter(draft, content, "welcome")
    return { state: draft, emitted: draft.transcript.slice(startLen).map((entry) => entry.text), effect: { kind: "none" } }
  }

  const draft = clone(state)

  if (action.kind === "select") {
    const option = optionsForNode(state, content).find((item) => item.id === action.optionId)
    // Stale / double-click / injected option ids are ignored (no-op).
    if (!option) return { state, emitted: [], effect: { kind: "none" } }

    // Restart from menuConfirm / saved requires an explicit reset (keep locale).
    if (option.action.t === "restart") {
      if (state.submissionState === "saved") {
        // A completed submission must not hand its session_id to the next
        // conversation; defer id/time generation to the caller (BiaWidget).
        return { state, emitted: [], effect: { kind: "requestSessionRotation", resetProgress: true } }
      }
      const fresh = createInitialState(state.locale, { sessionId: state.sessionId, createdAt: state.createdAt })
      return { state: fresh, emitted: fresh.transcript.map((entry) => entry.text), effect: { kind: "none" } }
    }

    push(draft, "user", state.currentNodeId, option.label)
    const effect = applyOptionAction(draft, content, option.action)
    return { state: draft, emitted: draft.transcript.slice(startLen + 1).map((entry) => entry.text), effect }
  }

  // input
  push(draft, "user", state.currentNodeId, action.text.replace(/\s+/g, " ").trim())
  const effect = handleInput(draft, content, action.text)
  return { state: draft, emitted: draft.transcript.slice(startLen + 1).map((entry) => entry.text), effect }
}

// ---------------------------------------------------------------------------
// Conversation-graph validator
// ---------------------------------------------------------------------------

export function validateConversationGraph(): string[] {
  const issues: string[] = []
  const ids = Object.keys(conversationNodes) as NodeId[]
  const idSet = new Set<NodeId>(ids)

  const terminalTypes: NodeType[] = ["complete"]

  for (const id of ids) {
    const node = conversationNodes[id]
    if (node.id !== id) issues.push(`Node ${id} has mismatched id ${node.id}`)
    for (const target of node.next) {
      if (!idSet.has(target)) issues.push(`${id} points to invalid target ${target}`)
      if (target === id) issues.push(`${id} has a self-loop`)
    }
    if (node.next.length === 0 && !terminalTypes.includes(node.type)) {
      issues.push(`${id} is a dead end`)
    }
    if (node.inputField && !node.acceptFreeText) {
      issues.push(`${id} has an input field but does not accept free text`)
    }
  }

  // Reachability from welcome.
  const seen = new Set<NodeId>(["welcome"])
  const queue: NodeId[] = ["welcome"]
  while (queue.length) {
    const current = queue.shift() as NodeId
    for (const target of conversationNodes[current].next) {
      if (!seen.has(target) && idSet.has(target)) {
        seen.add(target)
        queue.push(target)
      }
    }
  }
  for (const id of ids) {
    if (!seen.has(id)) issues.push(`${id} is unreachable from welcome`)
  }

  // Required terminals must be reachable.
  for (const required of ["summary", "consent", "saved", "welcome"] as NodeId[]) {
    if (!seen.has(required)) issues.push(`required node ${required} is unreachable`)
  }

  // Every qualification field must have a collecting node.
  for (const field of QUALIFY_ORDER) {
    if (!idSet.has(field as NodeId)) issues.push(`qualification field ${field} has no node`)
  }

  return issues
}
