import { useEffect, useMemo, useState } from "react"
import "./App.css"
import "./components/NatureBand.css"

import Hero from "./components/Hero"
import AIAssistantHero from "./components/AIAssistantHero"
import Services from "./components/Services"
import WhyChoose from "./components/WhyChoose"
import WhatsAppCTA from "./components/WhatsAppCTA"
import QRWhatsApp from "./components/QRWhatsApp"
import FAQ from "./components/FAQ"
import AssistantWidget from "./components/AssistantWidget"
import Footer from "./components/Footer"
import SectionShell from "./components/SectionShell"

import pt from "./content/bioghaia.pt.json"
import en from "./content/bioghaia.en.json"
import araucariaForest from "./assets/bioghaia-hero-araucaria-forest.png"

type Lang = "pt" | "en"
type TemplateMode = "dawn" | "dusk"

const LS_LANG = "bioghaia_lang"
const LS_TEMPLATE = "bioghaia_template"

function safeGetLS(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore
  }
}

function normalizeLang(x: string | null): Lang {
  if (!x) return "pt"
  const v = x.toLowerCase()
  if (v === "en" || v.startsWith("en")) return "en"
  return "pt"
}

function normalizeTemplate(x: string | null): TemplateMode {
  if (!x) return "dawn"
  return x === "dusk" ? "dusk" : "dawn"
}

export type BioghaiaContent = typeof pt & {
  natureBand?: {
    eyebrow?: string
    title?: string
    body?: string
    chips?: string[]
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [templateMode, setTemplateMode] = useState<TemplateMode>(() =>
    normalizeTemplate(safeGetLS(LS_TEMPLATE))
  )
  const [assistantPrompt, setAssistantPrompt] = useState<string | null>(null)

  const content = useMemo<BioghaiaContent>(() => {
    return lang === "en" ? (en as BioghaiaContent) : (pt as BioghaiaContent)
  }, [lang])

  useEffect(() => {
    safeSetLS(LS_LANG, lang)
    document.documentElement.setAttribute("lang", lang === "en" ? "en" : "pt-BR")
  }, [lang])

  useEffect(() => {
    safeSetLS(LS_TEMPLATE, templateMode)
    document.documentElement.setAttribute("data-template", templateMode)
  }, [templateMode])

  const labels = useMemo(() => {
    const fallbackEyebrow =
      lang === "en"
        ? "Environmental intelligence meets visual precision"
        : "Inteligência ambiental com precisão visual"

    const fallbackTitle =
      lang === "en"
        ? "Nature and technology working in the same layer."
        : "Natureza e tecnologia operando na mesma camada."

    const fallbackBody =
      lang === "en"
        ? "This fixed visual band introduces a stronger premium identity for the landing page. It combines the organic logic of tree rings with subtle data-grid accents, reinforcing Bioghaia’s positioning between environmental understanding and technical execution."
        : "Esta faixa visual fixa cria uma identidade mais premium para a landing page. Ela combina a lógica orgânica dos anéis da madeira com detalhes sutis de grade técnica, reforçando o posicionamento da Bioghaia entre compreensão ambiental e execução técnica."

    const fallbackChips =
      lang === "en"
        ? ["Nature-first vision", "Technical clarity", "Premium presence"]
        : ["Visão orientada pela natureza", "Clareza técnica", "Presença premium"]

    const jsonChips =
      Array.isArray(content.natureBand?.chips) && content.natureBand?.chips.length
        ? content.natureBand.chips.map(String)
        : fallbackChips

    return {
      controlsAria: lang === "en" ? "Controls" : "Controles",
      langToggleAria: lang === "en" ? "Switch language" : "Alternar idioma",
      templateToggleAria: lang === "en" ? "Switch visual template" : "Alternar template visual",
      navAria: lang === "en" ? "Navigation" : "Navegação",
      headerAria:
        lang === "en"
          ? "Bioghaia header"
          : "Cabeçalho da Bioghaia Engenharia Ambiental",
      mainAria: content.sections.mainAriaLabel,

      bannerEyebrow: content.natureBand?.eyebrow || fallbackEyebrow,
      bannerTitle: content.natureBand?.title || fallbackTitle,
      bannerBody: content.natureBand?.body || fallbackBody,
      bannerChips: jsonChips,

      servicesEyebrow:
        lang === "en" ? "Technical services" : "Serviços técnicos",
      whyEyebrow:
        lang === "en" ? "Why work with Bioghaia" : "Por que trabalhar com a Bioghaia",
      faqEyebrow:
        lang === "en" ? "Before you start" : "Antes de começar",
      contactEyebrow:
        lang === "en" ? "Direct contact" : "Contato direto",
    }
  }, [lang, content])

  function toggleLang() {
    setLang((prev) => (prev === "pt" ? "en" : "pt"))
  }

  function toggleTemplate() {
    setTemplateMode((prev) => (prev === "dawn" ? "dusk" : "dawn"))
  }

  function startAssistant(message: string) {
    setAssistantPrompt(message)
  }

  return (
    <div className="page">
      <header className="topbar" role="banner" aria-label={labels.headerAria}>
        <div className="topbar-inner">
          <div className="brand" aria-label={content.brand.ariaLabel}>
            <span className="brand-dot" aria-hidden="true" />
            <span className="brand-text">{content.brand.name}</span>
          </div>

          <nav className="topbar-nav" aria-label={labels.navAria}>
            <a className="nav-link" href={`#${content.sections.servicesId}`}>
              {content.nav.services}
            </a>
            <a className="nav-link" href={`#${content.sections.whyId}`}>
              {content.nav.why}
            </a>
            <a className="nav-link" href={`#${content.sections.faqId}`}>
              {content.nav.faq}
            </a>
            <a className="nav-link" href={`#${content.sections.contactId}`}>
              {content.nav.contact}
            </a>
          </nav>

          <div className="topbar-controls" aria-label={labels.controlsAria}>
            <button
              type="button"
              className="chip-btn"
              onClick={toggleTemplate}
              aria-label={labels.templateToggleAria}
              title={labels.templateToggleAria}
            >
              {templateMode === "dawn"
                ? content.controls.templateDawn
                : content.controls.templateDusk}
            </button>

            <button
              type="button"
              className="chip-btn"
              onClick={toggleLang}
              aria-label={labels.langToggleAria}
              title={labels.langToggleAria}
            >
              {lang === "pt" ? content.controls.langEN : content.controls.langPT}
            </button>
          </div>
        </div>
      </header>

      <main id="content" className="main" role="main" aria-label={labels.mainAria}>
        <Hero />

        <AIAssistantHero onStartConversation={startAssistant} />

        <SectionShell
          id={content.sections.servicesId}
          title={content.services.title}
          subtitle={content.services.subtitle}
          eyebrow={labels.servicesEyebrow}
          variant="forest"
        >
          <Services />
        </SectionShell>

        <section className="nature-band-section" aria-label={labels.bannerTitle}>
          <div className="nature-band-track">
            <div className="nature-band-sticky">
              <div className="nature-band-panel">
                <img
                  src={araucariaForest}
                  alt=""
                  aria-hidden="true"
                  className="nature-band-image"
                  loading="lazy"
                  decoding="async"
                />

                <div className="nature-band-image-overlay" aria-hidden="true" />
                <div className="nature-band-grid" aria-hidden="true" />
                <div className="nature-band-bark" aria-hidden="true" />
                <div className="nature-band-rings" aria-hidden="true" />
                <div className="nature-band-glow nature-band-glow-a" aria-hidden="true" />
                <div className="nature-band-glow nature-band-glow-b" aria-hidden="true" />

                <div className="nature-band-content">
                  <span className="nature-band-eyebrow">{labels.bannerEyebrow}</span>

                  <h2 className="nature-band-title">{labels.bannerTitle}</h2>

                  <p className="nature-band-body">{labels.bannerBody}</p>

                  <div className="nature-band-chips" aria-label={labels.bannerEyebrow}>
                    {labels.bannerChips.map((chip) => (
                      <span key={chip} className="nature-band-chip">
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionShell
          id={content.sections.whyId}
          title={content.whyChoose.title}
          subtitle={content.whyChoose.subtitle}
          eyebrow={labels.whyEyebrow}
          variant="default"
        >
          <WhyChoose />
        </SectionShell>

        <SectionShell
          id={content.sections.faqId}
          title={content.faq.title}
          subtitle={content.faq.subtitle}
          eyebrow={labels.faqEyebrow}
          variant="band"
        >
          <FAQ />
        </SectionShell>

        <SectionShell
          id={content.sections.contactId}
          title={content.whatsAppCta.title}
          subtitle={content.whatsAppCta.subtitle}
          eyebrow={labels.contactEyebrow}
          variant="default"
        >
          <div className="split">
            <div>
              <WhatsAppCTA />
            </div>
            <div>
              <QRWhatsApp />
            </div>
          </div>
        </SectionShell>
      </main>

      <Footer />
      <AssistantWidget initialMessage={assistantPrompt} />
    </div>
  )
}