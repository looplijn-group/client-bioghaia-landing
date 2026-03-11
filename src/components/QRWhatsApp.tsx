// src/components/QRWhatsApp.tsx
import { useEffect, useMemo, useState } from "react"
import { toDataURL } from "qrcode"

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

function normalizeText(value: unknown) {
  return String(value || "").trim()
}

function getFallbackPrefill(lang: Lang) {
  return lang === "en"
    ? "Hi! I would like guidance about topography, GIS or environmental licensing in Rio Grande do Sul."
    : "Olá! Gostaria de orientação sobre topografia, geoprocessamento ou licenciamento ambiental no Rio Grande do Sul."
}

export default function QRWhatsApp() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)

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

  const content = useMemo<QRContent>(() => {
    return lang === "en" ? (en as QRContent) : (pt as QRContent)
  }, [lang])

  const ui = useMemo(() => {
    const qr = content.qr

    return {
      sectionAria: lang === "en" ? "WhatsApp QR code" : "QR Code para WhatsApp",
      title:
        normalizeText(qr?.title) ||
        (lang === "en" ? "Quick access" : "Acesso rápido"),
      subtitle:
        normalizeText(qr?.subtitle) ||
        (lang === "en"
          ? "Scan to open WhatsApp and talk to Bioghaia."
          : "Aponte a câmera para abrir o WhatsApp e falar com a Bioghaia."),
      hint:
        normalizeText(qr?.scanHint) ||
        (lang === "en"
          ? "Tip: on mobile, the WhatsApp button is the fastest path."
          : "Dica: no celular, o botão do WhatsApp é o caminho mais rápido."),
      manualLinkLabel:
        normalizeText(qr?.manualLinkLabel) ||
        (lang === "en" ? "Open WhatsApp manually" : "Abrir WhatsApp manualmente"),
      manualLinkAria:
        normalizeText(qr?.manualLinkAria) ||
        (lang === "en"
          ? "Open WhatsApp link in a new tab"
          : "Abrir link do WhatsApp em nova aba"),
      loadingLabel:
        normalizeText(qr?.loadingLabel) ||
        (lang === "en" ? "Generating QR…" : "Gerando QR…"),
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
      prefillMessage:
        normalizeText(qr?.prefillMessage) || getFallbackPrefill(lang),
    }
  }, [content.qr, lang])

  const whatsappBaseUrl = useMemo(() => {
    return normalizeText(content.company?.whatsappUrl) || "https://wa.me/5554996778886"
  }, [content.company?.whatsappUrl])

  const link = useMemo(() => {
    return buildWhatsAppLink(whatsappBaseUrl, ui.prefillMessage)
  }, [ui.prefillMessage, whatsappBaseUrl])

  useEffect(() => {
    let cancelled = false

    async function buildQr() {
      setBuilding(true)
      setDataUrl(null)

      try {
        const url = await toDataURL(link, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M"
        })

        if (!cancelled) setDataUrl(url)
      } catch {
        if (!cancelled) setDataUrl(null)
      } finally {
        if (!cancelled) setBuilding(false)
      }
    }

    void buildQr()

    return () => {
      cancelled = true
    }
  }, [link])

  return (
    <section className="qr" aria-label={ui.sectionAria}>
      <div className="qr-inner">
        <h3 className="qr-title">{ui.title}</h3>
        <p className="qr-text">{ui.subtitle}</p>

        {dataUrl ? (
          <img
            src={dataUrl}
            alt={ui.imageAlt}
            className="qr-img"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="qr-fallback" role="status" aria-live="polite">
            {building ? ui.loadingLabel : ui.unavailableLabel}
          </div>
        )}

        <p className="qr-hint">{ui.hint}</p>

        <a
          className="qr-link"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={ui.manualLinkAria}
        >
          {ui.manualLinkLabel}
        </a>
      </div>
    </section>
  )
}