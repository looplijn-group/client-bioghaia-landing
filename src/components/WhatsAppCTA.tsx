import { useEffect, useMemo, useState } from "react"
import "./SectionShell.css"
import "./Hero.css"
import "./WhatsAppCTA.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type CTAContent = typeof pt & {
  whatsAppCta: typeof pt.whatsAppCta & {
    ariaLabel?: string
    prefillFallback?: string
  }
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

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function buildWhatsAppLink(baseUrl: string, message?: string) {
  if (!message) return baseUrl
  const encoded = encodeURIComponent(message)
  return `${baseUrl}?text=${encoded}`
}

function getFallbackPrefill(lang: Lang) {
  return lang === "en"
    ? "Hello! I would like initial guidance about surveying, geoprocessing, environmental licensing, or coastal technical diagnosis in Rio Grande do Sul."
    : "Olá! Gostaria de uma orientação inicial sobre topografia, geoprocessamento, licenciamento ambiental ou diagnóstico técnico costeiro no Rio Grande do Sul."
}

function getFallbackFlowItems(lang: Lang) {
  return lang === "en"
    ? [
        "Describe your project in a few words",
        "Share location and estimated timeline",
        "Receive initial technical direction",
      ]
    : [
        "Descreva seu projeto em poucas palavras",
        "Informe localização e prazo estimado",
        "Receba um direcionamento técnico inicial",
      ]
}

export default function WhatsAppCTA() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))

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

  const content = useMemo<CTAContent>(() => {
    return lang === "en" ? (en as CTAContent) : (pt as CTAContent)
  }, [lang])

  const ui = useMemo(() => {
    const ariaLabel =
      normalizeText(content.whatsAppCta?.ariaLabel) ||
      (lang === "en"
        ? "Open WhatsApp and talk to Bioghaia"
        : "Abrir WhatsApp e conversar com a Bioghaia")

    const prefill =
      normalizeText(content.whatsAppCta?.prefillFallback) || getFallbackPrefill(lang)

    const buttonLabel =
      normalizeText(content.whatsAppCta?.buttonLabel) ||
      (lang === "en" ? "Talk on WhatsApp" : "Falar no WhatsApp")

    const title =
      normalizeText(content.whatsAppCta?.title) ||
      (lang === "en" ? "Tell us about your project" : "Explique seu projeto")

    const subtitle =
      normalizeText(content.whatsAppCta?.subtitle) ||
      (lang === "en"
        ? "A quick conversation can help define the right next step."
        : "Uma conversa rápida pode ajudar a definir o próximo passo ideal.")

    return {
      ariaLabel,
      prefill,
      buttonLabel,
      title,
      subtitle,
      eyebrow: lang === "en" ? "Direct first contact" : "Primeiro contato direto",
      badge: lang === "en" ? "WhatsApp guidance" : "Orientação via WhatsApp",
      flowTitle:
        lang === "en"
          ? "How the first contact works"
          : "Como funciona o primeiro contato",
    }
  }, [content.whatsAppCta, lang])

  const whatsappHref = useMemo(() => {
    const baseUrl =
      normalizeText(content.company?.whatsappUrl) || "https://wa.me/5554996778886"
    return buildWhatsAppLink(baseUrl, ui.prefill)
  }, [content.company?.whatsappUrl, ui.prefill])

  const flowItems = useMemo(() => getFallbackFlowItems(lang), [lang])

  return (
    <div className="cta-panel" role="region" aria-label={ui.ariaLabel}>
      <div className="cta-panel-copy">
        <p className="section-eyebrow">{ui.eyebrow}</p>

        <div className="cta-panel-head">
          <h3 className="cta-panel-title">{ui.title}</h3>
          <span className="cta-panel-badge">{ui.badge}</span>
        </div>

        <p className="cta-panel-text">{ui.subtitle}</p>
      </div>

      <div className="cta-panel-flow" aria-label={ui.flowTitle}>
        {flowItems.map((item, index) => (
          <div key={`${item}-${index}`} className="cta-panel-step">
            <span className="cta-panel-step-index" aria-hidden="true">
              {index + 1}
            </span>
            <span className="cta-panel-step-text">{item}</span>
          </div>
        ))}
      </div>

      <div className="cta-row">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-button"
          aria-label={ui.ariaLabel}
        >
          <span className="cta-button-label">{ui.buttonLabel}</span>
          <span className="cta-button-trace" aria-hidden="true" />
        </a>
      </div>
    </div>
  )
}