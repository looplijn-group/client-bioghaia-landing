import { useEffect, useMemo, useState, type CSSProperties } from "react"
import "./Hero.css"

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

function normalizeLang(x: string | null) {
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
    ? ["Urban and rural projects", "Coastal and expansion areas", "Technical precision"]
    : ["Projetos urbanos e rurais", "Regiões costeiras e expansão", "Precisão técnica"]
}

function getFallbackWhatsAppPrefill(lang: Lang): string {
  return lang === "en"
    ? "Hello! I have a project and would like to understand what environmental or technical support is needed. Can you guide me?"
    : "Olá! Tenho um projeto e gostaria de entender qual suporte ambiental ou levantamento técnico pode ser necessário. Pode me orientar?"
}

function getFallbackFlowSteps(lang: Lang): string[] {
  return lang === "en"
    ? ["Share your project", "Get technical direction", "Move forward with clarity"]
    : ["Compartilhe seu projeto", "Receba direção técnica", "Avance com clareza"]
}

function getCompactMobileFlowSteps(lang: Lang): string[] {
  return lang === "en"
    ? ["Project", "Technical guidance", "Next step"]
    : ["Projeto", "Direção técnica", "Próximo passo"]
}

function getFallbackLiveNote(lang: Lang): string {
  return lang === "en"
    ? "Fluid technical guidance for environmental decisions"
    : "Orientação técnica fluida para decisões ambientais"
}

function getCompactMobileLiveNote(lang: Lang): string {
  return lang === "en"
    ? "Fast technical guidance"
    : "Orientação técnica rápida"
}

function getFlowExampleLabel(lang: Lang): string {
  return lang === "en" ? "Example:" : "Exemplo:"
}

function getFlowExampleText(lang: Lang): string {
  return lang === "en"
    ? "I need environmental licensing for a rural property in Rio Grande do Sul."
    : "Preciso de licenciamento ambiental para uma propriedade rural no Rio Grande do Sul."
}

function getFlowCardTitle(lang: Lang): string {
  return lang === "en" ? "First contact flow" : "Fluxo do primeiro contato"
}

export default function Hero() {
  const [lang, setLang] = useState<Lang>(() => resolveLang())
  const [templateMode, setTemplateMode] = useState<TemplateMode>(() => getDocumentTemplate())
  const [isCompactMobile, setIsCompactMobile] = useState(false)

  useEffect(() => {
    const syncAll = () => {
      const nextLang = resolveLang()
      const nextTemplate = getDocumentTemplate()

      setLang((prev) => (prev === nextLang ? prev : nextLang))
      setTemplateMode((prev) => (prev === nextTemplate ? prev : nextTemplate))
    }

    syncAll()

    const onStorage = () => syncAll()
    const onFocus = () => syncAll()
    const onVisibilityChange = () => syncAll()

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

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return

    const mediaQuery = window.matchMedia("(max-width: 640px)")

    const updateMobileState = () => {
      setIsCompactMobile(mediaQuery.matches)
    }

    updateMobileState()

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateMobileState)
      return () => mediaQuery.removeEventListener("change", updateMobileState)
    }

    mediaQuery.addListener(updateMobileState)
    return () => mediaQuery.removeListener(updateMobileState)
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
      flow:
        lang === "en"
          ? "How the first contact flows"
          : "Como o primeiro contato acontece",
      ambient:
        lang === "en"
          ? "Immersive visual layer"
          : "Camada visual imersiva",
      live:
        lang === "en"
          ? "Guided experience"
          : "Experiência guiada",
      example:
        lang === "en"
          ? "Example of a first client message"
          : "Exemplo de primeira mensagem do cliente",
    }
  }, [lang])

  const kicker = useMemo(() => {
    return content.hero.kicker
  }, [content.hero.kicker])

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

  const flowSteps = useMemo(() => {
    return isCompactMobile ? getCompactMobileFlowSteps(lang) : getFallbackFlowSteps(lang)
  }, [isCompactMobile, lang])

  const flowExampleLabel = useMemo(() => getFlowExampleLabel(lang), [lang])
  const flowExampleText = useMemo(() => getFlowExampleText(lang), [lang])
  const flowCardTitle = useMemo(() => getFlowCardTitle(lang), [lang])

  const liveNote = useMemo(() => {
    return isCompactMobile ? getCompactMobileLiveNote(lang) : getFallbackLiveNote(lang)
  }, [isCompactMobile, lang])

  const whatsappPrefill = useMemo(() => {
    const fromJson = String(content.hero?.whatsappPrefill || "").trim()
    return fromJson || getFallbackWhatsAppPrefill(lang)
  }, [content.hero, lang])

  const whatsappHref = useMemo(() => {
    return buildWhatsAppLink(content.company.whatsappUrl, whatsappPrefill)
  }, [content.company.whatsappUrl, whatsappPrefill])

  const servicesHref = useMemo(() => `#${content.sections.servicesId || "services"}`, [content])

  const cinematicTransition =
    "opacity 1200ms ease, filter 1800ms cubic-bezier(0.22, 1, 0.36, 1), transform 2400ms cubic-bezier(0.22, 1, 0.36, 1), background 1600ms ease"

  const imageStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "26% center",
      opacity: templateMode === "dawn" ? 0.74 : 0.60,
      filter:
        templateMode === "dawn"
          ? "brightness(1.04) saturate(1.1) contrast(1.04)"
          : "brightness(0.9) saturate(1.04) contrast(1.06)",
      transform:
        templateMode === "dawn"
          ? "scale(1.065) translate3d(0, -0.8%, 0)"
          : "scale(1.135) translate3d(-0.8%, -1.2%, 0)",
      transformOrigin: templateMode === "dawn" ? "32% 42%" : "48% 40%",
      pointerEvents: "none",
      userSelect: "none",
      transition: cinematicTransition,
      willChange: "opacity, filter, transform",
    }
  }, [templateMode])

  const softOverlayStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      transition: cinematicTransition,
      background:
        templateMode === "dawn"
          ? [
              "linear-gradient(94deg, rgba(248,243,236,0.08) 0%, rgba(248,243,236,0.03) 16%, rgba(248,243,236,0.10) 34%, rgba(246,239,231,0.38) 64%, rgba(246,239,231,0.78) 100%)",
              "linear-gradient(180deg, rgba(255,248,240,0.12) 0%, rgba(255,248,240,0.03) 34%, rgba(35,58,45,0.14) 100%)",
              "radial-gradient(1120px 520px at 8% 14%, rgba(125,165,110,0.12), transparent 64%)",
              "radial-gradient(900px 380px at 88% 18%, rgba(215,151,95,0.18), transparent 68%)",
              "radial-gradient(620px 260px at 74% 8%, rgba(255,209,138,0.20), transparent 72%)"
            ].join(",")
          : [
              "linear-gradient(94deg, rgba(24,32,42,0.16) 0%, rgba(24,32,42,0.06) 18%, rgba(24,32,42,0.12) 34%, rgba(38,49,64,0.42) 66%, rgba(56,68,84,0.64) 100%)",
              "linear-gradient(180deg, rgba(34,40,52,0.10) 0%, rgba(34,40,52,0.04) 30%, rgba(18,26,36,0.22) 100%)",
              "radial-gradient(1020px 420px at 16% 14%, rgba(80,135,108,0.12), transparent 64%)",
              "radial-gradient(820px 340px at 84% 18%, rgba(164,114,91,0.14), transparent 68%)",
              "radial-gradient(620px 280px at 78% 6%, rgba(255,176,110,0.12), transparent 72%)"
            ].join(","),
    }
  }, [templateMode])

  const accentGlowStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      opacity: templateMode === "dawn" ? 0.96 : 0.8,
      transition: cinematicTransition,
      background:
        templateMode === "dawn"
          ? [
              "radial-gradient(circle at 14% 18%, rgba(123,176,120,0.13), transparent 0 24%)",
              "radial-gradient(circle at 28% 82%, rgba(94,138,100,0.10), transparent 0 24%)",
              "radial-gradient(circle at 86% 24%, rgba(220,150,92,0.16), transparent 0 22%)",
              "radial-gradient(circle at 72% 10%, rgba(255,214,150,0.20), transparent 0 18%)"
            ].join(",")
          : [
              "radial-gradient(circle at 16% 20%, rgba(74,163,120,0.11), transparent 0 24%)",
              "radial-gradient(circle at 28% 82%, rgba(52,211,153,0.08), transparent 0 24%)",
              "radial-gradient(circle at 84% 24%, rgba(244,144,96,0.12), transparent 0 22%)",
              "radial-gradient(circle at 72% 12%, rgba(255,190,120,0.12), transparent 0 18%)"
            ].join(","),
    }
  }, [templateMode])

  const appGlassStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      zIndex: 1,
      opacity: templateMode === "dawn" ? 0.54 : 0.42,
      transition: cinematicTransition,
      background:
        templateMode === "dawn"
          ? [
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 28%, rgba(255,255,255,0.00) 56%)",
              "radial-gradient(760px 280px at 22% 0%, rgba(255,255,255,0.09), transparent 70%)"
            ].join(",")
          : [
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.028) 28%, rgba(255,255,255,0.00) 56%)",
              "radial-gradient(760px 280px at 22% 0%, rgba(255,255,255,0.05), transparent 70%)"
            ].join(","),
      backdropFilter: "blur(2px)",
      WebkitBackdropFilter: "blur(2px)",
    }
  }, [templateMode])

  const cinematicVeilStyle = useMemo<CSSProperties>(() => {
    return {
      position: "absolute",
      inset: 0,
      zIndex: 1,
      pointerEvents: "none",
      transition: cinematicTransition,
      opacity: templateMode === "dawn" ? 0.82 : 0.72,
      background:
        templateMode === "dawn"
          ? [
              "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.04) 100%)",
              "linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.01) 22%, rgba(255,255,255,0) 42%)"
            ].join(",")
          : [
              "linear-gradient(180deg, rgba(255,255,255,0.015) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.03) 100%)",
              "linear-gradient(120deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 22%, rgba(255,255,255,0) 42%)"
            ].join(","),
      mixBlendMode: "screen",
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
          <div style={appGlassStyle} />
          <div style={cinematicVeilStyle} />

          <div className="hero-art-layer hero-art-layer-a" />
          <div className="hero-art-layer hero-art-layer-b" />
          <div className="hero-art-layer hero-art-layer-c" />
          <div className="hero-art-grid" />
          <div className="hero-art-rings" />
          <div className="hero-art-glow hero-art-glow-a" />
          <div className="hero-art-glow hero-art-glow-b" />
          <div className="hero-art-beam hero-art-beam-a" />
          <div className="hero-art-beam hero-art-beam-b" />
          <div className="hero-art-noise" />
        </div>

        <div className="hero-content">
          <div className="hero-shell">
            <div className="hero-shell-top">
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

              <div className="hero-live-panel" aria-label={ui.live}>
                <span className="hero-live-dot" aria-hidden="true" />
                <span className="hero-live-text">{liveNote}</span>
              </div>
            </div>

            <div className="hero-copy">
              <h1 className="hero-title">{content.hero.headline}</h1>
              <p className="hero-subtitle">{content.hero.subheadline}</p>
            </div>

            <div className="hero-actions-wrap">
              <div className="hero-actions" role="group" aria-label={ui.actions}>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cta-button"
                  aria-label={ui.whatsapp}
                >
                  <span className="cta-button-label">{content.hero.primaryCta}</span>
                  <span className="cta-button-trace" aria-hidden="true" />
                </a>

                <a className="ghost-button" href={servicesHref} aria-label={ui.services}>
                  <span>{content.hero.secondaryCta}</span>
                </a>
              </div>

              <div
                className={`hero-flow-card ${isCompactMobile ? "hero-flow-card-compact" : ""}`}
                aria-label={ui.flow}
              >
                <div className="hero-flow-header">
                  <span className="hero-flow-badge">{flowCardTitle}</span>
                </div>

                <div className="hero-flow-example" aria-label={ui.example}>
                  <span className="hero-flow-example-label">{flowExampleLabel}</span>{" "}
                  <span className="hero-flow-example-text">{flowExampleText}</span>
                </div>

                <div className="hero-flow-steps">
                  {flowSteps.map((step, index) => (
                    <div key={`${step}-${index}`} className="hero-flow-step">
                      <span className="hero-flow-index" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="hero-flow-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
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
      </div>
    </section>
  )
}