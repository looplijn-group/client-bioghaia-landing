// src/components/QRWhatsApp.tsx

import { useEffect, useMemo, useState } from "react"
import { toDataURL } from "qrcode"
import "./QRWhatsApp.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type QRContent = typeof pt & {
  qr?: typeof pt.qr & {
    manualLinkLabel?: string
    manualLinkAria?: string
    loadingLabel?: string
    unavailableLabel?: string
    imageAlt?: string
    prefillMessage?: string
  }
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

function getFallbackPrefill(lang: Lang) {
  return lang === "en"
    ? "Hello! I would like initial guidance about environmental licensing, compliance, land surveying, geospatial analysis, agriculture, forestry, or technical diagnosis."
    : "Olá! Gostaria de uma orientação inicial sobre licenciamento ambiental, regularização, topografia, geoprocessamento, agricultura, florestal ou diagnóstico técnico."
}

function getFlowSteps(lang: Lang) {
  return lang === "en"
    ? ["Scan the code", "Open WhatsApp instantly", "Send your project details"]
    : ["Escaneie o código", "Abra o WhatsApp rapidamente", "Envie os detalhes do projeto"]
}

export default function QRWhatsApp() {
  const [lang, setLang] = useState<Lang>(() => resolveLang())
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)

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

  const content = useMemo<QRContent>(() => {
    return lang === "en" ? (en as QRContent) : (pt as QRContent)
  }, [lang])

  const ui = useMemo(() => {
    const qr = content.qr

    return {
      sectionAria: lang === "en" ? "WhatsApp QR code" : "QR Code para WhatsApp",
      eyebrow: lang === "en" ? "Fast contact" : "Contato rápido",
      badge: "QR + WhatsApp",
      flowTitle: lang === "en" ? "How this access works" : "Como esse acesso funciona",

      title:
        normalizeText(qr?.title) ||
        (lang === "en" ? "Quick access" : "Acesso rápido"),

      subtitle:
        normalizeText(qr?.subtitle) ||
        (lang === "en"
          ? "Scan to open WhatsApp and talk directly to Bioghaia."
          : "Aponte a câmera para abrir o WhatsApp e falar direto com a Bioghaia."),

      hint:
        normalizeText(qr?.scanHint) ||
        (lang === "en"
          ? "On mobile, tapping the WhatsApp button is usually faster."
          : "No celular, tocar no botão do WhatsApp costuma ser mais rápido."),

      manualLinkLabel:
        normalizeText(qr?.manualLinkLabel) ||
        (lang === "en" ? "Open WhatsApp" : "Abrir WhatsApp"),

      manualLinkAria:
        normalizeText(qr?.manualLinkAria) ||
        (lang === "en"
          ? "Open WhatsApp and talk to Bioghaia"
          : "Abrir WhatsApp e conversar com a Bioghaia"),

      loadingLabel:
        normalizeText(qr?.loadingLabel) ||
        (lang === "en" ? "Generating QR..." : "Gerando QR..."),

      unavailableLabel:
        normalizeText(qr?.unavailableLabel) ||
        (lang === "en"
          ? "QR unavailable at the moment."
          : "QR indisponível no momento."),

      imageAlt:
        normalizeText(qr?.imageAlt) ||
        (lang === "en"
          ? "QR code to open a WhatsApp conversation with Bioghaia"
          : "QR Code para abrir conversa no WhatsApp com a Bioghaia"),

      prefillMessage: normalizeText(qr?.prefillMessage) || getFallbackPrefill(lang),
    }
  }, [content.qr, lang])

  const whatsappBaseUrl = useMemo(() => {
    return normalizeText(content.company?.whatsappUrl) || "https://wa.me/5554996778886"
  }, [content.company?.whatsappUrl])

  const link = useMemo(() => {
    return buildWhatsAppLink(whatsappBaseUrl, ui.prefillMessage)
  }, [ui.prefillMessage, whatsappBaseUrl])

  const flowSteps = useMemo(() => getFlowSteps(lang), [lang])

  useEffect(() => {
    let cancelled = false

    async function buildQr() {
      const cleanLink = normalizeText(link)

      if (!cleanLink || cleanLink === "#") {
        setBuilding(false)
        setDataUrl(null)
        return
      }

      setBuilding(true)
      setDataUrl(null)

      try {
        const url = await toDataURL(cleanLink, {
          margin: 1,
          width: 304,
          errorCorrectionLevel: "M",
          color: {
            dark: "#153322",
            light: "#ffffff",
          },
        })

        if (!cancelled) {
          setDataUrl(url)
        }
      } catch {
        if (!cancelled) {
          setDataUrl(null)
        }
      } finally {
        if (!cancelled) {
          setBuilding(false)
        }
      }
    }

    void buildQr()

    return () => {
      cancelled = true
    }
  }, [link])

  return (
    <section className="qr" aria-label={ui.sectionAria} data-lang={lang}>
      <div className="qr-inner">
        <div className="qr-copy">
          <p className="qr-eyebrow">{ui.eyebrow}</p>

          <div className="qr-head">
            <h3 className="qr-title">{ui.title}</h3>
            <span className="qr-badge">{ui.badge}</span>
          </div>

          <p className="qr-text">{ui.subtitle}</p>
        </div>

        <div className="qr-main">
          <div className="qr-stage">
            <div className="qr-visual-wrap" aria-hidden={!dataUrl}>
              {dataUrl ? (
                <div className="qr-visual">
                  <img
                    src={dataUrl}
                    alt={ui.imageAlt}
                    className="qr-img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="qr-fallback" role="status" aria-live="polite">
                  {building ? ui.loadingLabel : ui.unavailableLabel}
                </div>
              )}
            </div>
          </div>

          <div className="qr-side">
            <div className="qr-flow" aria-label={ui.flowTitle}>
              {flowSteps.map((step, index) => (
                <div key={`${step}-${index}`} className="qr-step">
                  <span className="qr-step-index" aria-hidden="true">
                    {index + 1}
                  </span>

                  <span className="qr-step-text">{step}</span>
                </div>
              ))}
            </div>

            <p className="qr-hint">{ui.hint}</p>

            <a
              className="qr-link"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={ui.manualLinkAria}
            >
              <span>{ui.manualLinkLabel}</span>
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}