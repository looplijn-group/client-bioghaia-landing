// src/components/Services.tsx
import { useEffect, useMemo, useState } from "react"
import "./SectionShell.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type ServiceItem = {
  title: string
  description: string
}

type ServicesContent = typeof pt

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

function safeServiceItems(value: unknown): ServiceItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const title = String((item as ServiceItem)?.title || "").trim()
      const description = String((item as ServiceItem)?.description || "").trim()

      if (!title || !description) return null
      return { title, description }
    })
    .filter(Boolean) as ServiceItem[]
}

function getFallbackSanitationService(lang: Lang): ServiceItem {
  return lang === "en"
    ? {
        title: "Coastal Sanitation & Environmental Diagnosis",
        description:
          "Technical support for coastal areas involving sewage, drainage, environmental diagnosis, georeferenced mapping, territorial analysis, and planning guidance for safer and better-structured interventions.",
      }
    : {
        title: "Saneamento Costeiro e Diagnóstico Ambiental",
        description:
          "Suporte técnico para áreas costeiras com demandas ligadas a esgoto, drenagem, diagnóstico ambiental, mapeamento georreferenciado, análise territorial e orientação para intervenções mais seguras e bem estruturadas.",
      }
}

function hasSimilarSanitationService(items: ServiceItem[]) {
  return items.some((item) => {
    const title = item.title.toLowerCase()
    const description = item.description.toLowerCase()

    return (
      title.includes("saneamento") ||
      title.includes("sanitation") ||
      title.includes("esgoto") ||
      title.includes("sewage") ||
      title.includes("drenagem") ||
      title.includes("drainage") ||
      title.includes("coastal") ||
      title.includes("costeiro") ||
      description.includes("saneamento") ||
      description.includes("sanitation") ||
      description.includes("esgoto") ||
      description.includes("sewage") ||
      description.includes("drenagem") ||
      description.includes("drainage")
    )
  })
}

function getServiceTone(index: number) {
  const tones = ["is-emerald", "is-amber", "is-sky", "is-earth"]
  return tones[index % tones.length]
}

function getMicroLabel(lang: Lang, index: number) {
  const ptLabels = [
    "Serviço estratégico",
    "Precisão técnica",
    "Planejamento aplicado",
    "Suporte especializado",
  ]

  const enLabels = [
    "Strategic service",
    "Technical precision",
    "Applied planning",
    "Specialized support",
  ]

  return lang === "en"
    ? enLabels[index % enLabels.length]
    : ptLabels[index % ptLabels.length]
}

export default function Services() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))

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

  const content = useMemo<ServicesContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const services = useMemo(() => {
    const baseServices = safeServiceItems(content.services?.items)

    if (!baseServices.length) return [getFallbackSanitationService(lang)]

    if (hasSimilarSanitationService(baseServices)) return baseServices

    return [...baseServices, getFallbackSanitationService(lang)]
  }, [content.services?.items, lang])

  const note = useMemo(() => {
    return String(content.services?.note || "").trim()
  }, [content.services?.note])

  const ui = useMemo(() => {
    return {
      listAria: lang === "en" ? "Services list" : "Lista de serviços",
      itemAria: lang === "en" ? "Service item" : "Item de serviço",
      empty:
        lang === "en"
          ? "No services available right now."
          : "Nenhum serviço disponível no momento.",
      introEyebrow: lang === "en" ? "Technical capabilities" : "Capacidades técnicas",
      introTitle: lang === "en" ? "Services designed for real environmental decisions" : "Serviços pensados para decisões ambientais reais",
      introText:
        lang === "en"
          ? "Bioghaia combines field knowledge, environmental intelligence, and technical clarity to support projects from diagnosis to direction."
          : "A Bioghaia combina conhecimento de campo, inteligência ambiental e clareza técnica para apoiar projetos desde o diagnóstico até o direcionamento.",
    }
  }, [lang])

  if (!services.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <>
      <div className="section-intro section-intro-services">
        <p className="section-eyebrow">{ui.introEyebrow}</p>
        <h3 className="section-mini-title">{ui.introTitle}</h3>
        <p className="section-mini-text">{ui.introText}</p>
      </div>

      <div className="grid grid-services" role="list" aria-label={ui.listAria}>
        {services.map((service, index) => (
          <article
            key={`${service.title}-${index}`}
            className={`card card-service ${getServiceTone(index)}`}
            role="listitem"
            aria-label={`${ui.itemAria}: ${service.title}`}
          >
            <div className="card-service-top">
              <span className="card-service-pill">{getMicroLabel(lang, index)}</span>
              <span className="card-service-orb" aria-hidden="true" />
            </div>

            <h3 className="card-title">{service.title}</h3>
            <p className="card-text">{service.description}</p>

            <div className="card-service-footer" aria-hidden="true">
              <span className="card-service-line" />
            </div>
          </article>
        ))}
      </div>

      {note ? <p className="note">{note}</p> : null}
    </>
  )
}