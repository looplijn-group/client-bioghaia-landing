// src/components/Footer.tsx

import { useEffect, useMemo, useState } from "react"
import "./Footer.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"
import bioghaiaLogo from "../assets/bioghaia-logo.png"

type Lang = "pt" | "en"

type FooterContent = {
  brand: {
    name?: string
    fullName: string
    slogan?: string
    tagline?: string
  }
  company?: {
    cityRegion?: string
    serviceArea?: string
  }
  footer: {
    note?: string
    copyright?: string
    looplijnUrl?: string
    ui: {
      footerAria: string
      utilitiesAria: string
      poweredBy: string
      backToTop: string
      privacy: string
      close: string
      regionLabel: string
      supportLabel: string
      statusLabel: string
      noteEyebrow: string
      privacyTitle: string
      privacyIntro: string
      privacyNote: string
      logoAlt: string
    }
    privacy?: {
      title?: string
      intro?: string
      note?: string
      items?: string[]
      closing?: string
    }
  }
}

const LS_LANG = "bioghaia_lang"

const CONTENT_BY_LANG: Record<Lang, FooterContent> = {
  pt: pt as FooterContent,
  en: en as FooterContent,
}

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

function normalizedText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function pickFooterNote(content: FooterContent) {
  const note = String(content.footer?.note || "").trim()

  if (note) return note

  const slogan =
    String(content.brand.slogan || "").trim() ||
    String(content.brand.tagline || "").trim()

  const fullName = String(content.brand.fullName || "").trim()
  const shortName = String(content.brand.name || "").trim()

  if (slogan) {
    const s = normalizedText(slogan)

    if (s && s !== normalizedText(fullName) && s !== normalizedText(shortName)) {
      return slogan
    }
  }

  return ""
}

function fillYear(template: string, year: number) {
  return String(template || "")
    .replace("{YEAR}", String(year))
    .trim()
}

function scrollToTop() {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" })
  } catch {
    window.scrollTo(0, 0)
  }
}

export default function Footer() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const year = new Date().getFullYear()

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
    if (!privacyOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPrivacyOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [privacyOpen])

  const content = useMemo<FooterContent>(() => {
    return CONTENT_BY_LANG[lang]
  }, [lang])

  const ui = content.footer.ui

  const copyright = useMemo(() => {
    return fillYear(content.footer?.copyright || "", year)
  }, [content.footer?.copyright, year])

  const note = useMemo(() => {
    return pickFooterNote(content)
  }, [content])

  const serviceRegion = useMemo(() => {
    return String(content.company?.cityRegion || "").trim()
  }, [content.company?.cityRegion])

  const serviceArea = useMemo(() => {
    return String(content.company?.serviceArea || "").trim()
  }, [content.company?.serviceArea])

  const looplijnUrl = useMemo(() => {
    return String(content.footer?.looplijnUrl || "").trim()
  }, [content.footer?.looplijnUrl])

  const privacyTitle = useMemo(() => {
    return String(content.footer.privacy?.title || ui.privacyTitle || "").trim()
  }, [content.footer.privacy?.title, ui.privacyTitle])

  const privacyIntro = useMemo(() => {
    return String(content.footer.privacy?.intro || ui.privacyIntro || "").trim()
  }, [content.footer.privacy?.intro, ui.privacyIntro])

  const privacyNote = useMemo(() => {
    return String(content.footer.privacy?.note || ui.privacyNote || "").trim()
  }, [content.footer.privacy?.note, ui.privacyNote])

  const privacyItems = useMemo(() => {
    return Array.isArray(content.footer.privacy?.items)
      ? content.footer.privacy.items.filter((item) => String(item || "").trim())
      : []
  }, [content.footer.privacy?.items])

  const privacyClosing = useMemo(() => {
    return String(content.footer.privacy?.closing || "").trim()
  }, [content.footer.privacy?.closing])

  return (
    <>
      <footer className="footer" role="contentinfo" aria-label={ui.footerAria}>
        <div className="footer-inner">
          <div className="footer-brand-centered" aria-label={ui.supportLabel}>
            <div className="footer-logo-shell">
              <div className="footer-logo-glow" aria-hidden="true" />

              <img
                className="footer-logo"
                src={bioghaiaLogo}
                alt={ui.logoAlt}
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="footer-title">{content.brand.fullName}</div>

            {serviceRegion ? (
              <div className="footer-subtitle" aria-label={ui.regionLabel}>
                {serviceRegion}
              </div>
            ) : null}

            <div className="footer-status-row" aria-label={ui.statusLabel}>
              <span className="footer-status-dot" aria-hidden="true" />
              <span className="footer-status-text">{ui.statusLabel}</span>
            </div>

            {note ? <div className="footer-note">{note}</div> : null}

            {serviceArea ? <p className="footer-service-area">{serviceArea}</p> : null}

            <div className="footer-minirow" aria-label={ui.utilitiesAria}>
              <button
                type="button"
                className="footer-mini-link"
                onClick={scrollToTop}
                aria-label={ui.backToTop}
                title={ui.backToTop}
              >
                <span aria-hidden="true">↑</span>
                <span>{ui.backToTop}</span>
              </button>

              <span className="footer-mini-sep" aria-hidden="true">
                •
              </span>

              <button
                type="button"
                className="footer-mini-link"
                onClick={() => setPrivacyOpen(true)}
                aria-label={ui.privacy}
                title={ui.privacy}
                aria-haspopup="dialog"
              >
                {ui.privacy}
              </button>
            </div>
          </div>

          {copyright ? (
            <div className="footer-meta">
              <div className="footer-meta-line">{copyright}</div>
            </div>
          ) : null}
        </div>

        {looplijnUrl ? (
          <div className="footer-bottom">
            <div className="footer-powered-container" aria-label={ui.poweredBy}>
              <a
                className="footer-powered footer-powered--tiny footer-powered--shimmer"
                href={looplijnUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={ui.poweredBy}
                title={ui.poweredBy}
              >
                <span className="footer-powered-accent" aria-hidden="true" />
                <span className="footer-powered-text">{ui.poweredBy}</span>
              </a>
            </div>
          </div>
        ) : null}
      </footer>

      {privacyOpen ? (
        <div
          className="footer-privacy-overlay"
          role="presentation"
          onMouseDown={() => setPrivacyOpen(false)}
        >
          <section
            className="footer-privacy-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-privacy-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="footer-privacy-close"
              onClick={() => setPrivacyOpen(false)}
              aria-label={ui.close}
              title={ui.close}
            >
              ×
            </button>

            <p className="footer-privacy-eyebrow">{ui.privacy}</p>

            {privacyTitle ? (
              <h2 id="footer-privacy-title" className="footer-privacy-title">
                {privacyTitle}
              </h2>
            ) : null}

            {privacyIntro ? <p className="footer-privacy-text">{privacyIntro}</p> : null}

            {privacyNote ? <p className="footer-privacy-note">{privacyNote}</p> : null}

            {privacyItems.length > 0 ? (
              <ul className="footer-privacy-list">
                {privacyItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {privacyClosing ? (
              <p className="footer-privacy-closing">{privacyClosing}</p>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}