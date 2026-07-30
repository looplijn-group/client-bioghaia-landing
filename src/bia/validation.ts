import { biaContentByLang, type BiaLocaleContent, type Lang } from "./content"
import {
  conversationNodes,
  createInitialState,
  getContent,
  optionsForNode,
  validateConversationGraph,
  type BiaState,
  type NodeId,
} from "./engine"

const FORBIDDEN = /[—–]/

export function hasForbiddenDash(text: string): boolean {
  return FORBIDDEN.test(text)
}

export function validateNoForbiddenDashes(content: BiaLocaleContent): string[] {
  const issues: string[] = []
  const walk = (value: unknown, path = "root") => {
    if (typeof value === "string") {
      if (hasForbiddenDash(value)) issues.push(`${path} contains forbidden dash`)
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`))
      return
    }
    if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`)
    }
  }
  walk(content)
  return issues
}

export function validateLocaleParity(lang: Lang): string[] {
  const base = biaContentByLang.pt
  const candidate = biaContentByLang[lang]
  const issues: string[] = []

  const collect = (value: unknown, path = "root"): string[] => {
    if (typeof value === "string") return [path]
    if (Array.isArray(value)) return value.flatMap((item, index) => collect(item, `${path}[${index}]`))
    if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => collect(child, `${path}.${key}`))
    return []
  }

  const basePaths = new Set(collect(base))
  const candidatePaths = new Set(collect(candidate))
  for (const path of basePaths) if (!candidatePaths.has(path)) issues.push(`Missing path in ${lang}: ${path}`)
  for (const path of candidatePaths) if (!basePaths.has(path)) issues.push(`Extra path in ${lang}: ${path}`)
  return issues
}

// Options are generated dynamically per node; verify PT and EN produce the same
// stable option IDs for the same node/state, and that no label is missing.
export function validateOptionParity(): string[] {
  const issues: string[] = []
  const nodeIds = Object.keys(conversationNodes) as NodeId[]

  for (const nodeId of nodeIds) {
    const ptState: BiaState = { ...createInitialState("pt"), currentNodeId: nodeId }
    const enState: BiaState = { ...createInitialState("en"), currentNodeId: nodeId }
    const ptOptions = optionsForNode(ptState, getContent("pt"))
    const enOptions = optionsForNode(enState, getContent("en"))

    const ptIds = ptOptions.map((option) => option.id).join(",")
    const enIds = enOptions.map((option) => option.id).join(",")
    if (ptIds !== enIds) issues.push(`Option IDs differ for node ${nodeId}: [${ptIds}] vs [${enIds}]`)

    for (const option of [...ptOptions, ...enOptions]) {
      if (!option.label || !option.label.trim()) issues.push(`Node ${nodeId} option ${option.id} has an empty label`)
    }
  }
  return issues
}

export function validateConversationModel(): string[] {
  return [...validateConversationGraph(), ...validateOptionParity()]
}

export function getValidationReport(lang: Lang): string[] {
  return [...validateLocaleParity(lang), ...validateNoForbiddenDashes(biaContentByLang[lang]), ...validateConversationModel()]
}

export function getAllValidationReports(): Record<Lang, string[]> {
  return { pt: getValidationReport("pt"), en: getValidationReport("en") }
}

export function hasValidationErrors(): boolean {
  return Object.values(getAllValidationReports()).some((issues) => issues.length > 0)
}
