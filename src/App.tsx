// src/App.tsx

import { useEffect, useMemo, useState } from "react"
import "./App.css"
import "./components/NatureBand.css"

import TopBar from "./components/TopBar"
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
  } catch {}
}

function normalizeLang(value: string | null): Lang {
  if (!value) return "pt"
  const v = value.toLowerCase()
  return v === "en" || v.startsWith("en") ? "en" : "pt"
}

function normalizeTemplate(value: string | null): TemplateMode {
  return value === "dusk" ? "dusk" : "dawn"
}

function text(value: unknown, fallback: string) {
  const clean = String(value || "").trim()
  return clean || fallback
}

function stringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const clean = value.map((v) => String(v || "").trim()).filter(Boolean)
  return clean.length ? clean : fallback
}

type BioghaiaContent = typeof pt & {
  topBar?: {
    subtitle?: string
    themePrefix?: string
    languagePrefix?: string
    contactAccent?: string
  }
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
    const fallbackChips =
      lang === "en"
        ? ["Technical diagnosis", "Environmental compliance", "Clear next steps"]
        : ["Diagnóstico técnico", "Conformidade ambiental", "Próximos passos claros"]

    return {
      controlsAria: lang === "en" ? "Controls" : "Controles",
      langToggleAria: lang === "en" ? "Switch language" : "Alternar idioma",
      templateToggleAria:
        lang === "en" ? "Switch visual template" : "Alternar template visual",
      navAria: lang === "en" ? "Navigation" : "Navegação",
      headerAria:
        lang === "en"
          ? "Bioghaia header"
          : "Cabeçalho da Bioghaia Engenharia Ambiental",

      mainAria: text(
        content.sections?.mainAriaLabel,
        lang === "en" ? "Main content" : "Conteúdo principal"
      ),

      topBarSubtitle: text(
        content.topBar?.subtitle,
        lang === "en" ? "Environmental intelligence" : "Inteligência ambiental"
      ),
      themePrefix: text(
        content.topBar?.themePrefix,
        lang === "en" ? "Theme" : "Tema"
      ),
      languagePrefix: text(
        content.topBar?.languagePrefix,
        lang === "en" ? "Language" : "Idioma"
      ),
      contactAccent: text(
        content.topBar?.contactAccent,
        lang === "en" ? "Direct contact" : "Contato direto"
      ),

      servicesId: text(content.sections?.servicesId, "services"),
      whyId: text(content.sections?.whyId, "why"),
      faqId: text(content.sections?.faqId, "faq"),
      contactId: text(content.sections?.contactId, "contact"),

      navServices: text(content.nav?.services, "Services"),
      navWhy: text(content.nav?.why, "Why"),
      navFaq: text(content.nav?.faq, "FAQ"),
      navContact: text(content.nav?.contact, "Contact"),

      brandName: text(content.brand?.name, "Bioghaia"),
      brandAria: text(content.brand?.ariaLabel, "Bioghaia"),

      templateDawn: text(content.controls?.templateDawn, "Dawn"),
      templateDusk: text(content.controls?.templateDusk, "Dusk"),
      langPT: text(content.controls?.langPT, "PT"),
      langEN: text(content.controls?.langEN, "EN"),

      servicesTitle: text(content.services?.title, "Services"),

      whyTitle: text(content.whyChoose?.title, "Why choose"),
      whySubtitle: text(content.whyChoose?.subtitle, ""),

      faqTitle: text(content.faq?.title, "FAQ"),
      faqSubtitle: text(content.faq?.subtitle, ""),

      bannerEyebrow: text(content.natureBand?.eyebrow, ""),
      bannerTitle: text(content.natureBand?.title, ""),
      bannerBody: text(content.natureBand?.body, ""),
      bannerChips: stringArray(content.natureBand?.chips, fallbackChips),
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
      <TopBar
        brandName={labels.brandName}
        brandAria={labels.brandAria}
        headerAria={labels.headerAria}
        navAria={labels.navAria}
        controlsAria={labels.controlsAria}
        navServices={labels.navServices}
        navWhy={labels.navWhy}
        navFaq={labels.navFaq}
        navContact={labels.navContact}
        servicesId={labels.servicesId}
        whyId={labels.whyId}
        faqId={labels.faqId}
        contactId={labels.contactId}
        templateMode={templateMode}
        lang={lang}
        templateDawn={labels.templateDawn}
        templateDusk={labels.templateDusk}
        langPT={labels.langPT}
        langEN={labels.langEN}
        topBarSubtitle={labels.topBarSubtitle}
        themePrefix={labels.themePrefix}
        languagePrefix={labels.languagePrefix}
        contactAccent={labels.contactAccent}
        templateToggleAria={labels.templateToggleAria}
        langToggleAria={labels.langToggleAria}
        onToggleTemplate={toggleTemplate}
        onToggleLang={toggleLang}
      />

      <main id="content" className="main" role="main" aria-label={labels.mainAria}>
        <Hero />

        <AIAssistantHero onStartConversation={startAssistant} />

        <SectionShell
          id={labels.servicesId}
          title={labels.servicesTitle}
          variant="forest"
          hideHeader
        >
          <Services />
        </SectionShell>

        <section className="nature-band-section" aria-label={labels.bannerTitle}>
          <div className="nature-band-track">
            <div className="nature-band-panel">
              <img src={araucariaForest} alt="" className="nature-band-image" />

              <div className="nature-band-content">
                <span className="nature-band-eyebrow">{labels.bannerEyebrow}</span>
                <h2 className="nature-band-title">{labels.bannerTitle}</h2>
                <p className="nature-band-body">{labels.bannerBody}</p>

                <div className="nature-band-chips">
                  {labels.bannerChips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <SectionShell
          id={labels.whyId}
          title={labels.whyTitle}
          subtitle={labels.whySubtitle}
        >
          <WhyChoose />
        </SectionShell>

        <SectionShell
          id={labels.faqId}
          title={labels.faqTitle}
          subtitle={labels.faqSubtitle}
        >
          <FAQ />
        </SectionShell>

        <SectionShell id={labels.contactId} title="" hideHeader>
          <div className="split">
            <WhatsAppCTA />
            <QRWhatsApp />
          </div>
        </SectionShell>
      </main>

      <Footer />
      <AssistantWidget initialMessage={assistantPrompt} />
    </div>
  )
}