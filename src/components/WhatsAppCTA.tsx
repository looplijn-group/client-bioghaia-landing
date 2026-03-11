// src/components/WhatsAppCTA.tsx
import { useEffect, useMemo, useState } from "react"

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
    ? "Hi! I would like guidance about topography, GIS or environmental licensing in Rio Grande do Sul."
    : "Olá! Gostaria de orientação sobre topografia, geoprocessamento ou licenciamento ambiental no Rio Grande do Sul."
}

export default function WhatsAppCTA() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))

  useEffect(() => {
    const checkLang = () => {
      const current = normalizeLang(safeGetLS(LS_LANG))
      setLang((prev) => (prev === current ? prev : current))
    }

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
      normalizeText(content.whatsAppCta?.prefillFallback) ||
      getFallbackPrefill(lang)

    const buttonLabel =
      normalizeText(content.whatsAppCta?.buttonLabel) ||
      (lang === "en" ? "Talk on WhatsApp" : "Falar no WhatsApp")

    return {
      ariaLabel,
      prefill,
      buttonLabel
    }
  }, [content.whatsAppCta, lang])

  const whatsappHref = useMemo(() => {
    const baseUrl =
      normalizeText(content.company?.whatsappUrl) || "https://wa.me/5554996778886"

    return buildWhatsAppLink(baseUrl, ui.prefill)
  }, [content.company?.whatsappUrl, ui.prefill])

  return (
    <div className="cta-row">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="cta-button"
        aria-label={ui.ariaLabel}
      >
        {ui.buttonLabel}
      </a>
    </div>
  )
}