// src/components/Services.tsx

import { useEffect, useMemo, useState } from "react"
import "./SectionShell.css"
import "./Services.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type ServiceItem = {
  title: string
  description: string
  label?: string
}

type ServicesContent = {
  services?: {
    showcaseKicker?: string
    showcaseTitle?: string
    showcaseNote?: string
    items?: unknown
    listAria?: string
    itemAria?: string
    empty?: string
  }
}

const LS_LANG = "bioghaia_lang"

const CONTENT_BY_LANG: Record<Lang, ServicesContent> = {
  pt: pt as ServicesContent,
  en: en as ServicesContent,
}

/* =========================================================
   UTILS
========================================================= */

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

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function safeServiceItems(value: unknown): ServiceItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const rawItem = item as Partial<ServiceItem>

      const title = String(rawItem?.title || "").trim()
      const description = String(rawItem?.description || "").trim()
      const label = String(rawItem?.label || "").trim()

      if (!title || !description) return null

      return {
        title,
        description,
        ...(label ? { label } : {}),
      }
    })
    .filter((item): item is ServiceItem => item !== null)
}

function getFallbackServices(lang: Lang): ServiceItem[] {
  if (lang === "en") {
    return [
      {
        label: "Primary solution",
        title: "Environmental Permitting & Compliance",
        description:
          "Technical guidance to avoid fines, delays and regulatory issues, supporting each step with clarity and confidence.",
      },
      {
        label: "Technical precision",
        title: "Land Surveying",
        description:
          "Accurate measurements for land, construction and property planning, creating a reliable technical foundation.",
      },
      {
        label: "Land intelligence",
        title: "Geospatial Analysis",
        description:
          "Technical reading of the land and surrounding area to identify constraints, environmental risks and project opportunities.",
      },
      {
        label: "Environmental assessment",
        title: "Environmental Assessment",
        description:
          "Evaluation of the area to understand legal requirements, potential impacts and viable paths before moving forward.",
      },
      {
        label: "Field and forest",
        title: "Agriculture & Reforestation",
        description:
          "Technical support for rural management, crops and reforestation, helping reduce losses and improve field decisions.",
      },
    ]
  }

  return [
    {
      label: "Solução principal",
      title: "Regularização e Licenciamento Ambiental",
      description:
        "Orientação técnica para evitar multas, atrasos e bloqueios, conduzindo cada etapa com mais clareza e segurança.",
    },
    {
      label: "Precisão técnica",
      title: "Topografia",
      description:
        "Levantamentos precisos para terrenos, obras e propriedades, criando uma base confiável para o planejamento do projeto.",
    },
    {
      label: "Análise territorial",
      title: "Geoprocessamento",
      description:
        "Leitura técnica do terreno e da região para identificar restrições, riscos ambientais e oportunidades antes de decidir.",
    },
    {
      label: "Avaliação ambiental",
      title: "Diagnóstico Ambiental",
      description:
        "Avaliação da área para entender exigências legais, possíveis impactos e caminhos viáveis antes de avançar.",
    },
    {
      label: "Campo e floresta",
      title: "Agricultura e Reflorestamento",
      description:
        "Apoio técnico para manejo rural, lavouras e reflorestamento, ajudando a reduzir perdas e melhorar decisões no campo.",
    },
  ]
}

function getServiceTone(index: number) {
  const tones = [
    "is-primary",
    "is-lime",
    "is-orange",
    "is-earth",
    "is-forest",
  ]

  return tones[index % tones.length]
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Services() {
  const [lang, setLang] = useState<Lang>(() => resolveLang())

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

  const content = useMemo<ServicesContent>(() => {
    return CONTENT_BY_LANG[lang]
  }, [lang])

  const services = useMemo(() => {
    const fromJson = safeServiceItems(content.services?.items)

    return fromJson.length ? fromJson : getFallbackServices(lang)
  }, [content.services?.items, lang])

  const showcaseKicker = getText(
    content.services?.showcaseKicker,
    lang === "en" ? "How Bioghaia helps" : "Como a Bioghaia ajuda",
  )

  const showcaseTitle = getText(
    content.services?.showcaseTitle,
    lang === "en"
      ? "Technical clarity before important environmental decisions."
      : "Clareza técnica antes de decisões ambientais importantes.",
  )

  const showcaseNote = getText(
    content.services?.showcaseNote,
    lang === "en"
      ? "Integrated environmental services to reduce uncertainty, prevent avoidable risks and guide each project with technical precision."
      : "Serviços ambientais integrados para reduzir incertezas, evitar riscos desnecessários e conduzir cada projeto com precisão técnica.",
  )

  const listAria = getText(
    content.services?.listAria,
    lang === "en"
      ? "Bioghaia technical services list"
      : "Lista de serviços técnicos da Bioghaia",
  )

  const itemAria = getText(
    content.services?.itemAria,
    lang === "en" ? "Technical service" : "Serviço técnico",
  )

  const emptyMessage = getText(
    content.services?.empty,
    lang === "en"
      ? "No services are available right now."
      : "Nenhum serviço disponível no momento.",
  )

  if (!services.length) {
    return <p className="note">{emptyMessage}</p>
  }

  return (
    <div className="services-block">
      <header className="services-showcase-head">
        <div className="services-showcase-glow" aria-hidden="true" />

        <div className="services-showcase-kicker-row">
          <span className="services-showcase-kicker-dot" aria-hidden="true" />
          <p className="services-showcase-kicker">{showcaseKicker}</p>
        </div>

        <h3 className="services-showcase-title">{showcaseTitle}</h3>

        <p className="services-showcase-note">{showcaseNote}</p>
      </header>

      <div className="services-grid" role="list" aria-label={listAria}>
        {services.map((service, index) => {
          const isFeatured = index === 0

          return (
            <article
              key={`${service.title}-${index}`}
              className={`services-card ${getServiceTone(index)} ${
                isFeatured ? "services-card-featured" : ""
              }`}
              role="listitem"
              aria-label={`${itemAria}: ${service.title}`}
            >
              <div className="services-card-glow" aria-hidden="true" />

              <div className="services-card-top">
                <div className="services-card-meta">
                  {service.label ? (
                    <span className="services-card-pill">{service.label}</span>
                  ) : null}
                </div>

                <span className="services-card-orb" aria-hidden="true" />
              </div>

              <div className="services-card-body">
                <h3 className="services-card-title">{service.title}</h3>

                <p className="services-card-text">{service.description}</p>
              </div>

              <div className="services-card-footer" aria-hidden="true">
                <span className="services-card-line" />
                <span className="services-card-endpoint" />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}