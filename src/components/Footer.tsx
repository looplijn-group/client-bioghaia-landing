// src/components/Footer.tsx
import { useEffect, useMemo, useState } from "react"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"
type FooterContent = typeof pt

const LS_LANG = "bioghaia_lang"
const LOOPLIJN_URL = "https://looplijn.com"

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

function pickFooterNote(content: FooterContent, lang: Lang) {
  const note = String(content?.footer?.note || "").trim()
  if (note) return note

  const slogan =
    String((content as any)?.brand?.slogan || "").trim() ||
    String((content as any)?.brand?.tagline || "").trim()

  const fullName = String(content?.brand?.fullName || "").trim()
  const shortName = String(content?.brand?.name || "").trim()

  if (slogan) {
    const s = normalizedText(slogan)
    if (s && s !== normalizedText(fullName) && s !== normalizedText(shortName)) {
      return slogan
    }
  }

  return lang === "en"
    ? "Environmental intelligence for safer, compliant decisions."
    : "Inteligência ambiental para decisões mais seguras e em conformidade."
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
  const year = new Date().getFullYear()

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

  const content = useMemo<FooterContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const ui = useMemo(() => {
    return {
      footerAria: lang === "en" ? "Footer" : "Rodapé",
      utilitiesAria: lang === "en" ? "Footer utilities" : "Utilitários do rodapé",
      poweredBy: lang === "en" ? "Powered by Looplijn" : "Desenvolvido por Looplijn",
      backToTop: lang === "en" ? "Back to top" : "Voltar ao topo",
      privacy: lang === "en" ? "Privacy policy" : "Política de privacidade",
      regionLabel: lang === "en" ? "Service region" : "Região de atendimento"
    }
  }, [lang])

  const copyright = useMemo(() => {
    const raw = String(content.footer?.copyright || "").trim()
    if (raw) return fillYear(raw, year)

    return lang === "en"
      ? `© ${year} Bioghaia. All rights reserved.`
      : `© ${year} Bioghaia. Todos os direitos reservados.`
  }, [content.footer?.copyright, lang, year])

  const note = useMemo(() => pickFooterNote(content, lang), [content, lang])

  const serviceRegion = useMemo(() => {
    return String(content.company?.cityRegion || "").trim()
  }, [content.company?.cityRegion])

  const privacyHref = "#privacy"

  return (
    <footer className="footer" role="contentinfo" aria-label={ui.footerAria}>
      <div className="footer-inner">
        <div className="footer-brand-centered">
          <div className="footer-title">{content.brand.fullName}</div>

          {serviceRegion ? (
            <div className="footer-subtitle" aria-label={ui.regionLabel}>
              {serviceRegion}
            </div>
          ) : null}

          {note ? <div className="footer-note">{note}</div> : null}

          <div className="footer-minirow" aria-label={ui.utilitiesAria}>
            <button
              type="button"
              className="footer-mini-link"
              onClick={scrollToTop}
              aria-label={ui.backToTop}
              title={ui.backToTop}
            >
              ↑ {ui.backToTop}
            </button>

            <span className="footer-mini-sep" aria-hidden="true">
              •
            </span>

            <a
              className="footer-mini-link"
              href={privacyHref}
              aria-label={ui.privacy}
              title={ui.privacy}
            >
              {ui.privacy}
            </a>
          </div>
        </div>

        <div className="footer-meta">
          <div className="footer-meta-line">{copyright}</div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-powered-container" aria-label={ui.poweredBy}>
          <a
            className="footer-powered footer-powered--tiny footer-powered--shimmer"
            href={LOOPLIJN_URL}
            target="_blank"
            rel="noopener noreferrer nofollow"
            aria-label={ui.poweredBy}
            title={ui.poweredBy}
          >
            <span className="footer-powered-accent" aria-hidden="true" />
            {ui.poweredBy}
          </a>
        </div>
      </div>
    </footer>
  )
}