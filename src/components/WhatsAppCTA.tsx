// src/components/WhatsAppCTA.tsx

import { useEffect, useMemo, useState } from "react"
import "./SectionShell.css"
import "./WhatsAppCTA.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type WhatsAppCTAContent = {
  eyebrow?: string
  badge?: string
  title?: string
  subtitle?: string
  buttonLabel?: string
  ariaLabel?: string
  prefillMessage?: string
  flowTitle?: string
  flowItems?: string[]
  miniCardTitle?: string
  miniCardText?: string
  responseTimeLabel?: string
  responseTimeValue?: string
  trustItems?: string[]
}

type CTAContent = typeof pt & {
  whatsAppCta?: WhatsAppCTAContent
}

const LS_LANG = "bioghaia_lang"

function canUseDOM() {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

function safeGetLS(key: string) {
  if (!canUseDOM()) return null

  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function normalizeLang(value: string | null): Lang {
  if (!value) return "pt"

  const normalized = value.toLowerCase().trim()

  if (normalized === "en" || normalized.startsWith("en")) {
    return "en"
  }

  return "pt"
}

function getDocumentLang(): Lang {
  if (!canUseDOM()) return "pt"

  return normalizeLang(document.documentElement.getAttribute("lang"))
}

function resolveLang(): Lang {
  const fromStorage = normalizeLang(safeGetLS(LS_LANG))
  const fromDocument = getDocumentLang()

  if (fromStorage === "en" || fromDocument === "en") return "en"

  return "pt"
}

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function buildWhatsAppLink(baseUrl: string, message?: string) {
  const cleanBaseUrl = normalizeText(baseUrl)
  const cleanMessage = normalizeText(message)

  if (!cleanBaseUrl) return "#"
  if (!cleanMessage) return cleanBaseUrl

  const separator = cleanBaseUrl.includes("?") ? "&" : "?"

  return `${cleanBaseUrl}${separator}text=${encodeURIComponent(cleanMessage)}`
}

function safeArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.map(normalizeText).filter(Boolean)
}

function getFallbackPrefill(lang: Lang) {
  return lang === "en"
    ? "Hello! I would like initial guidance about environmental licensing, compliance, land surveying, geospatial analysis, agriculture, forestry, or technical diagnosis."
    : "Olá! Gostaria de uma orientação inicial sobre licenciamento ambiental, regularização, topografia, geoprocessamento, agricultura, florestal ou diagnóstico técnico."
}

function getFallbackFlowItems(lang: Lang) {
  return lang === "en"
    ? [
        "Describe your situation",
        "Share location and urgency",
        "Receive initial technical guidance",
      ]
    : [
        "Descreva sua situação",
        "Informe local e urgência",
        "Receba orientação técnica inicial",
      ]
}

function getFallbackTrustItems(lang: Lang) {
  return lang === "en"
    ? ["Technical screening", "Direct WhatsApp contact", "Clear next step"]
    : ["Triagem técnica", "Contato direto no WhatsApp", "Próximo passo claro"]
}

export default function WhatsAppCTA() {
  const [lang, setLang] = useState<Lang>(() => resolveLang())

  useEffect(() => {
    if (!canUseDOM()) return

    const syncLang = () => {
      const current = resolveLang()

      setLang((prev) => (prev === current ? prev : current))
    }

    syncLang()

    const onStorage = () => syncLang()
    const onFocus = () => syncLang()
    const onVisibilityChange = () => syncLang()

    window.addEventListener("storage", onStorage)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)

    const observer = new MutationObserver(syncLang)

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
    })

    const intervalId = window.setInterval(syncLang, 300)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      observer.disconnect()
      window.clearInterval(intervalId)
    }
  }, [])

  const content = useMemo<CTAContent>(() => {
    return lang === "en" ? (en as CTAContent) : (pt as CTAContent)
  }, [lang])

  const ui = useMemo(() => {
    const cta = content.whatsAppCta || {}

    const title =
      normalizeText(cta.title) ||
      (lang === "en"
        ? "Tell us what you need"
        : "Conte o que você precisa")

    const subtitle =
      normalizeText(cta.subtitle) ||
      (lang === "en"
        ? "A clear first contact helps identify risks, urgency, and the safest next step for your case."
        : "Um primeiro contato claro ajuda a identificar riscos, urgência e o próximo passo mais seguro para o seu caso.")

    const buttonLabel =
      normalizeText(cta.buttonLabel) ||
      (lang === "en"
        ? "Talk to Bioghaia on WhatsApp"
        : "Falar com a Bioghaia no WhatsApp")

    const ariaLabel =
      normalizeText(cta.ariaLabel) ||
      (lang === "en"
        ? "Open WhatsApp and talk to Bioghaia"
        : "Abrir WhatsApp e conversar com a Bioghaia")

    const prefill = normalizeText(cta.prefillMessage) || getFallbackPrefill(lang)

    const flowItems = safeArrayOfStrings(cta.flowItems)
    const trustItems = safeArrayOfStrings(cta.trustItems)

    return {
      badge:
        normalizeText(cta.badge) ||
        (lang === "en" ? "Initial guidance" : "Orientação inicial"),
      title,
      subtitle,
      buttonLabel,
      ariaLabel,
      prefill,
      flowTitle:
        normalizeText(cta.flowTitle) ||
        (lang === "en" ? "First contact flow" : "Fluxo do primeiro contato"),
      flowItems: flowItems.length ? flowItems : getFallbackFlowItems(lang),
      miniCardTitle:
        normalizeText(cta.miniCardTitle) ||
        (lang === "en"
          ? "What Bioghaia checks first"
          : "O que a Bioghaia verifica primeiro"),
      miniCardText:
        normalizeText(cta.miniCardText) ||
        (lang === "en"
          ? "Type of request, location, technical urgency, and whether documents or field analysis may be needed."
          : "Tipo de solicitação, localização, urgência técnica e se pode haver necessidade de documentos ou análise em campo."),
      responseTimeLabel:
        normalizeText(cta.responseTimeLabel) ||
        (lang === "en" ? "Contact channel" : "Canal de contato"),
      responseTimeValue: normalizeText(cta.responseTimeValue) || "WhatsApp",
      trustItems: trustItems.length ? trustItems : getFallbackTrustItems(lang),
    }
  }, [content.whatsAppCta, lang])

  const whatsappHref = useMemo(() => {
    const baseUrl =
      normalizeText(content.company?.whatsappUrl) || "https://wa.me/5554996778886"

    return buildWhatsAppLink(baseUrl, ui.prefill)
  }, [content.company?.whatsappUrl, ui.prefill])

  return (
    <section
      className="whatsapp-cta-section"
      aria-label={ui.ariaLabel}
      data-lang={lang}
    >
      <div className="whatsapp-cta-shell">
        <div className="whatsapp-cta-panel">
          <div className="whatsapp-cta-orb whatsapp-cta-orb-one" aria-hidden="true" />
          <div className="whatsapp-cta-orb whatsapp-cta-orb-two" aria-hidden="true" />

          <div className="whatsapp-cta-content">
            <div className="whatsapp-cta-copy-block">
              <span className="whatsapp-cta-badge">{ui.badge}</span>

              <h2 className="whatsapp-cta-title">{ui.title}</h2>

              <p className="whatsapp-cta-text">{ui.subtitle}</p>
            </div>

            <div className="whatsapp-cta-action-block">
              <div className="whatsapp-cta-trust-row" aria-label={ui.flowTitle}>
                {ui.trustItems.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="whatsapp-cta-trust-pill"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-cta-button"
                aria-label={ui.ariaLabel}
              >
                <span className="whatsapp-cta-button-icon" aria-hidden="true">
                  ✦
                </span>
                <span className="whatsapp-cta-button-label">
                  {ui.buttonLabel}
                </span>
                <span className="whatsapp-cta-button-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>

          <aside className="whatsapp-cta-app-card" aria-label={ui.flowTitle}>
            <div className="whatsapp-cta-app-top">
              <div className="whatsapp-cta-app-status">
                <span className="whatsapp-cta-app-label">
                  {ui.responseTimeLabel}
                </span>
                <strong>{ui.responseTimeValue}</strong>
              </div>

              <span className="whatsapp-cta-live-dot" aria-hidden="true" />
            </div>

            <div className="whatsapp-cta-app-body">
              <div className="whatsapp-cta-mini-card">
                <h3>{ui.miniCardTitle}</h3>
                <p>{ui.miniCardText}</p>
              </div>

              <div className="whatsapp-cta-flow-list">
                {ui.flowItems.map((item, index) => (
                  <div key={`${item}-${index}`} className="whatsapp-cta-step">
                    <span className="whatsapp-cta-step-index" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="whatsapp-cta-step-text">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="whatsapp-cta-app-dock" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}