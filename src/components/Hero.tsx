// src/components/Hero.tsx
import { useEffect, useMemo, useState, type CSSProperties } from "react"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"
import heroImage from "../assets/bioghaia-hero.webp"

type Lang = "pt" | "en"
type TemplateMode = "dawn" | "dusk"

type HeroContent = typeof pt & {
  hero: typeof pt.hero & {
    chips?: string[]
    whatsappPrefill?: string
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

function getDocumentLang(): Lang {
  if (typeof document === "undefined") return "pt"
  return normalizeLang(document.documentElement.getAttribute("lang"))
}

function resolveLang(): Lang {
  const fromStorage = normalizeLang(safeGetLS(LS_LANG))
  const fromDocument = getDocumentLang()

  if (fromStorage === "en" || fromDocument === "en") return "en"
  return "pt"
}

function normalizeTemplate(x: string | null | undefined): TemplateMode {
  if (!x) return "dawn"
  return x === "dusk" ? "dusk" : "dawn"
}

function getDocumentTemplate(): TemplateMode {
  if (typeof document === "undefined") return "dawn"
  return normalizeTemplate(document.documentElement.getAttribute("data-template"))
}

function buildWhatsAppLink(baseUrl: string, message?: string) {
  if (!message) return baseUrl
  const encoded = encodeURIComponent(message)
  return `${baseUrl}?text=${encoded}`
}

function safeArrayOfStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).map((s) => s.trim()).filter(Boolean)
}

function getFallbackHeroChips(lang: Lang): string[] {
  return lang === "en"
    ? ["Rio Grande do Sul", "Nature + Data", "Technical Precision"]
    : ["Rio Grande do Sul", "Natureza + Dados", "Precisão técnica"]
}

function getFallbackWhatsAppPrefill(lang: Lang): string {
  return lang === "en"
    ? "Hi! I would like guidance about topography, GIS or environmental licensing in Rio Grande do Sul."
    : "Olá! Gostaria de orientação sobre topografia, geoprocessamento ou licenciamento ambiental no Rio Grande do Sul."
}

export default function Hero() {
  const [lang, setLang] = useState<Lang>(() => resolveLang())
  const [templateMode, setTemplateMode] = useState<TemplateMode>(() => getDocumentTemplate())

  useEffect(() => {
    const syncAll = () => {
      const nextLang = resolveLang()
      const nextTemplate = getDocumentTemplate()

      setLang((prev) => (prev === nextLang ? prev : nextLang))
      setTemplateMode((prev) => (prev === nextTemplate ? prev : nextTemplate))
    }

    syncAll()

    const onStorage = () => {
      syncAll()
    }

    const onFocus = () => {
      syncAll()
    }

    const onVisibilityChange = () => {
      syncAll()
    }

    window.addEventListener("storage", onStorage)
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibilityChange)

    const observer = new MutationObserver(() => {
      syncAll()
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-template", "lang"],
    })

    const intervalId = window.setInterval(syncAll, 250)

    return () => {
      window.removeEventListener("storage", onStorage)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      observer.disconnect()
      window.clearInterval(intervalId)
    }
  }, [])

  const content = useMemo<HeroContent>(() => {
    return lang === "en" ? (en as HeroContent) : (pt as HeroContent)
  }, [lang])

  const ui = useMemo(() => {
    return {
      section: lang === "en" ? "Introduction" : "Apresentação",
      actions: lang === "en" ? "Primary actions" : "Ações principais",
      highlights: lang === "en" ? "Highlights" : "Destaques",
      whatsapp:
        lang === "en"
          ? "Talk to Bioghaia on WhatsApp"
          : "Falar com a Bioghaia no WhatsApp",
      services: lang === "en" ? "View services" : "Ver serviços",
      visual:
        lang === "en"
          ? "Decorative environmental banner with natural landscape and technical overlays"
          : "Banner ambiental decorativo com paisagem natural e sobreposições técnicas",
      metrics:
        lang === "en"
          ? "Key environmental service strengths"
          : "Principais forças dos serviços ambientais",
    }
  }, [lang])

  const kicker = useMemo(() => {
    return `${content.hero.kicker} • ${content.company.cityRegion}`
  }, [content.company.cityRegion, content.hero.kicker])

  const heroChips = useMemo(() => {
    const fromJson = safeArrayOfStrings(content.hero?.chips)
    return fromJson.length ? fromJson : getFallbackHeroChips(lang)
  }, [content.hero, lang])

  const highlights = useMemo(() => {
    const fromJson = safeArrayOfStrings(content.hero?.highlights)
    if (fromJson.length) return fromJson

    const trustLine = String(content.hero?.trustLine || "").trim()
    return trustLine ? [trustLine] : []
  }, [content.hero])

  const whatsappPrefill = useMemo(() => {
    const fromJson = String(content.hero?.whatsappPrefill || "").trim()
    return fromJson || getFallbackWhatsAppPrefill(lang)
  }, [content.hero, lang])

  const whatsappHref = useMemo(() => {
    return buildWhatsAppLink(content.company.whatsappUrl, whatsappPrefill)
  }, [content.company.whatsappUrl, whatsappPrefill])

  const imageStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "26% center",
      opacity: templateMode === "dawn" ? 0.66 : 0.42,
      filter:
        templateMode === "dawn"
          ? "brightness(1.01) saturate(1.08) contrast(1.03)"
          : "brightness(0.76) saturate(0.95) contrast(1.05)",
      transform: templateMode === "dawn" ? "scale(1.015)" : "scale(1.02)",
      pointerEvents: "none",
      userSelect: "none",
    }
  }, [templateMode])

  const softOverlayStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      background:
        templateMode === "dawn"
          ? [
              "linear-gradient(90deg, rgba(248,243,236,0.14) 0%, rgba(248,243,236,0.06) 22%, rgba(248,243,236,0.16) 42%, rgba(248,243,236,0.54) 72%, rgba(248,243,236,0.88) 100%)",
              "linear-gradient(180deg, rgba(255,250,244,0.12) 0%, rgba(255,250,244,0.03) 38%, rgba(30,47,37,0.10) 100%)",
              "radial-gradient(960px 420px at 12% 18%, rgba(120,156,104,0.08), transparent 62%)",
              "radial-gradient(820px 340px at 88% 26%, rgba(148,102,67,0.14), transparent 68%)",
            ].join(",")
          : [
              "linear-gradient(90deg, rgba(6,10,16,0.16) 0%, rgba(6,10,16,0.08) 24%, rgba(6,10,16,0.20) 44%, rgba(6,10,16,0.54) 72%, rgba(6,10,16,0.84) 100%)",
              "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.03) 36%, rgba(0,0,0,0.22) 100%)",
            ].join(","),
    }
  }, [templateMode])

  const accentGlowStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      opacity: templateMode === "dawn" ? 0.9 : 0.62,
      background:
        templateMode === "dawn"
          ? [
              "radial-gradient(circle at 18% 20%, rgba(106,150,102,0.10), transparent 0 22%)",
              "radial-gradient(circle at 30% 82%, rgba(93,131,96,0.08), transparent 0 24%)",
              "radial-gradient(circle at 84% 24%, rgba(171,122,76,0.10), transparent 0 20%)",
            ].join(",")
          : [
              "radial-gradient(circle at 18% 20%, rgba(34,197,94,0.08), transparent 0 22%)",
              "radial-gradient(circle at 28% 82%, rgba(16,185,129,0.06), transparent 0 24%)",
              "radial-gradient(circle at 84% 24%, rgba(59,130,246,0.06), transparent 0 20%)",
            ].join(","),
    }
  }, [templateMode])

  return (
    <section className="hero" aria-label={ui.section}>
      <div className="hero-inner">
        <div
          className={`hero-art hero-art-${templateMode}`}
          aria-label={ui.visual}
          aria-hidden="true"
        >
          <img
            src={heroImage}
            alt=""
            style={imageStyle}
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          <div style={softOverlayStyle} />
          <div style={accentGlowStyle} />

          <div className="hero-art-layer hero-art-layer-a" />
          <div className="hero-art-layer hero-art-layer-b" />
          <div className="hero-art-layer hero-art-layer-c" />
          <div className="hero-art-grid" />
          <div className="hero-art-rings" />
          <div className="hero-art-glow hero-art-glow-a" />
          <div className="hero-art-glow hero-art-glow-b" />
        </div>

        <div className="hero-content">
          <div className="hero-topline">
            <p className="hero-kicker">{kicker}</p>

            {heroChips.length ? (
              <div className="hero-chips" aria-label={ui.metrics}>
                {heroChips.map((chip) => (
                  <span key={chip} className="hero-chip">
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <h1 className="hero-title">{content.hero.headline}</h1>

          <p className="hero-subtitle">{content.hero.subheadline}</p>

          <div className="hero-actions" role="group" aria-label={ui.actions}>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-button"
              aria-label={ui.whatsapp}
            >
              {content.hero.primaryCta}
            </a>

            <a className="ghost-button" href="#services" aria-label={ui.services}>
              {content.hero.secondaryCta}
            </a>
          </div>

          {highlights.length ? (
            <ul className="hero-highlights" aria-label={ui.highlights}>
              {highlights.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  )
}