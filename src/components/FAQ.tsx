import { useEffect, useMemo, useState } from "react"

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

export default function FAQ() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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

  const content = useMemo<FaqContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const items = useMemo<FaqItem[]>(() => {
    if (Array.isArray(content.faq?.items) && content.faq.items.length) {
      return content.faq.items as FaqItem[]
    }
    return []
  }, [content])

  const ui = useMemo(() => {
    return {
      listAria: lang === "en" ? "Frequently asked questions list" : "Lista de perguntas frequentes",
      itemAria: lang === "en" ? "Frequently asked question" : "Pergunta frequente",
      empty:
        lang === "en"
          ? "No questions available right now."
          : "Nenhuma pergunta disponível no momento.",
      expand: lang === "en" ? "Expand answer" : "Expandir resposta",
      collapse: lang === "en" ? "Collapse answer" : "Fechar resposta",
    }
  }, [lang])

  function toggleItem(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  if (!items.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <div className="grid faq-grid" role="list" aria-label={ui.listAria}>
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const buttonId = `faq-button-${index}`
        const panelId = `faq-panel-${index}`

        return (
          <div
            key={`${item.q}-${index}`}
            className="card faq-card"
            role="listitem"
            aria-label={`${ui.itemAria}: ${item.q}`}
          >
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
          </div>
        )
      })}
    </div>
  )
}