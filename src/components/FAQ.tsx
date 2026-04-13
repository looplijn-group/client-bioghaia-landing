import { useEffect, useMemo, useState } from "react"
import "./FAQ.css"
import "./SectionShell.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"
type FaqItem = { q: string; a: string }

type FaqContent = typeof pt

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

function safeFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const q = String((item as FaqItem)?.q || "").trim()
      const a = String((item as FaqItem)?.a || "").trim()

      if (!q || !a) return null
      return { q, a }
    })
    .filter(Boolean) as FaqItem[]
}

function getFaqTone(index: number) {
  const tones = ["is-emerald", "is-sky", "is-amber", "is-earth"]
  return tones[index % tones.length]
}

function getFaqLabel(lang: Lang, index: number) {
  const ptLabels = [
    "Pergunta comum",
    "Esclarecimento técnico",
    "Orientação inicial",
    "Dúvida frequente",
  ]

  const enLabels = [
    "Common question",
    "Technical clarification",
    "Initial guidance",
    "Frequent question",
  ]

  return lang === "en"
    ? enLabels[index % enLabels.length]
    : ptLabels[index % ptLabels.length]
}

export default function FAQ() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [openIndex, setOpenIndex] = useState<number | null>(0)

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

  const content = useMemo<FaqContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const items = useMemo<FaqItem[]>(() => {
    return safeFaqItems(content.faq?.items)
  }, [content.faq?.items])

  const ui = useMemo(() => {
    return {
      listAria:
        lang === "en"
          ? "Frequently asked questions list"
          : "Lista de perguntas frequentes",
      itemAria:
        lang === "en"
          ? "Frequently asked question"
          : "Pergunta frequente",
      empty:
        lang === "en"
          ? "No questions available right now."
          : "Nenhuma pergunta disponível no momento.",
      expand: lang === "en" ? "Expand answer" : "Expandir resposta",
      collapse: lang === "en" ? "Collapse answer" : "Fechar resposta",
      introEyebrow:
        lang === "en"
          ? "Questions before getting started"
          : "Perguntas antes de começar",
      introTitle:
        lang === "en"
          ? "Clear answers before the first step"
          : "Respostas claras antes do primeiro passo",
      introText:
        lang === "en"
          ? "These are some of the most common questions clients have before starting a technical or environmental process with Bioghaia."
          : "Estas são algumas das dúvidas mais comuns de clientes antes de iniciar um processo técnico ou ambiental com a Bioghaia.",
    }
  }, [lang])

  function toggleItem(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  if (!items.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <>
      <div className="section-intro">
        <p className="section-eyebrow">{ui.introEyebrow}</p>
        <h3 className="section-mini-title">{ui.introTitle}</h3>
        <p className="section-mini-text">{ui.introText}</p>
      </div>

      <div className="grid faq-grid" role="list" aria-label={ui.listAria}>
        {items.map((item, index) => {
          const isOpen = openIndex === index
          const buttonId = `faq-button-${index}`
          const panelId = `faq-panel-${index}`

          return (
            <div
              key={`${item.q}-${index}`}
              className={`card card-service faq-card ${getFaqTone(index)}${isOpen ? " is-open" : ""}`}
              role="listitem"
              aria-label={`${ui.itemAria}: ${item.q}`}
            >
              <div className="card-service-top faq-card-top">
                <span className="card-service-pill">{getFaqLabel(lang, index)}</span>
                <span className="card-service-orb" aria-hidden="true" />
              </div>

              <button
                id={buttonId}
                type="button"
                className="faq-summary"
                aria-expanded={isOpen}
                aria-controls={panelId}
                aria-label={`${item.q} — ${isOpen ? ui.collapse : ui.expand}`}
                onClick={() => toggleItem(index)}
              >
                <span className="faq-summary-text">{item.q}</span>
                <span className={`faq-summary-icon${isOpen ? " is-open" : ""}`} aria-hidden="true">
                  +
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`faq-answer${isOpen ? " is-open" : ""}`}
                hidden={!isOpen}
              >
                <p className="card-text">{item.a}</p>
              </div>

              <div className="card-service-footer faq-card-footer" aria-hidden="true">
                <span className="card-service-line" />
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}