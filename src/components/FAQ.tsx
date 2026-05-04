// src/components/FAQ.tsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import "./FAQ.css"
import "./SectionShell.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"
type FaqItem = { q: string; a: string }

type FaqContent = {
  faq?: {
    title?: string
    subtitle?: string
    items?: unknown
  }
  company?: {
    whatsappUrl?: string
  }
  whatsAppCta?: {
    buttonLabel?: string
  }
}

const LS_LANG = "bioghaia_lang"
const CLOSE_ANIMATION_MS = 360

const CONTENT_BY_LANG: Record<Lang, FaqContent> = {
  pt: pt as FaqContent,
  en: en as FaqContent,
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

function safeFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const q = String((item as Partial<FaqItem>)?.q || "").trim()
      const a = String((item as Partial<FaqItem>)?.a || "").trim()

      if (!q || !a) return null

      return { q, a }
    })
    .filter((item): item is FaqItem => item !== null)
}

function getFaqTone(index: number) {
  const tones = ["is-emerald", "is-lime", "is-amber", "is-earth", "is-forest"]

  return tones[index % tones.length]
}

export default function FAQ() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [closingIndex, setClosingIndex] = useState<number | null>(null)
  const [motionKey, setMotionKey] = useState(0)

  const closeTimerRef = useRef<number | null>(null)

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

      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const content = useMemo<FaqContent>(() => {
    return CONTENT_BY_LANG[lang]
  }, [lang])

  const items = useMemo<FaqItem[]>(() => {
    return safeFaqItems(content.faq?.items)
  }, [content.faq?.items])

  const ui = useMemo(() => {
    return {
      listAria:
        lang === "en"
          ? "Frequently asked questions list"
          : "Lista de dúvidas frequentes",

      empty:
        lang === "en"
          ? "No questions available right now."
          : "Nenhuma pergunta disponível no momento.",

      helper:
        lang === "en" ? "FAQ" : "Dúvidas frequentes",

      helperText:
        lang === "en"
          ? "Select a question and read the answer directly below it."
          : "Selecione uma pergunta e leia a resposta logo abaixo.",

      open:
        lang === "en" ? "Open answer" : "Abrir resposta",

      close:
        lang === "en" ? "Close answer" : "Fechar resposta",

      answer:
        lang === "en" ? "Answer" : "Resposta",

      support:
        lang === "en" ? "Still unsure?" : "Ainda tem dúvida?",

      supportText:
        lang === "en"
          ? "Bioghaia can review your location, project type, and urgency to suggest the safest next step."
          : "A Bioghaia pode analisar sua localização, tipo de projeto e urgência para indicar o próximo passo mais seguro.",

      contact:
        content.whatsAppCta?.buttonLabel ||
        (lang === "en" ? "Open WhatsApp" : "Abrir WhatsApp"),
    }
  }, [content.whatsAppCta?.buttonLabel, lang])

  const whatsappUrl = content.company?.whatsappUrl || "#"
  const hasOpenAnswer = openIndex !== null || closingIndex !== null

  function clearCloseTimer() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  function openItem(index: number) {
    clearCloseTimer()
    setMotionKey((prev) => prev + 1)
    setClosingIndex(null)
    setOpenIndex(index)
  }

  function closeItem(index: number) {
    clearCloseTimer()
    setMotionKey((prev) => prev + 1)
    setOpenIndex(null)
    setClosingIndex(index)

    closeTimerRef.current = window.setTimeout(() => {
      setClosingIndex(null)
      closeTimerRef.current = null
    }, CLOSE_ANIMATION_MS)
  }

  function toggleItem(index: number) {
    if (openIndex === index) {
      closeItem(index)
      return
    }

    openItem(index)
  }

  function closeActiveItem() {
    if (openIndex !== null) {
      closeItem(openIndex)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>, index: number) {
    if (event.key === "Escape") {
      closeActiveItem()
      return
    }

    if (event.key === "ArrowDown") {
      event.preventDefault()

      const nextButton = document.getElementById(
        `faq-button-${Math.min(index + 1, items.length - 1)}`
      )

      nextButton?.focus()
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()

      const prevButton = document.getElementById(
        `faq-button-${Math.max(index - 1, 0)}`
      )

      prevButton?.focus()
    }
  }

  if (!items.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <section
      className={`faq-app-card${hasOpenAnswer ? " has-open-answer" : ""}`}
      aria-label={ui.listAria}
    >
      <div className="faq-app-top">
        <div className="faq-app-top-copy">
          <span className="faq-app-kicker">{ui.helper}</span>
          <strong>{ui.helperText}</strong>
        </div>

        <div className="faq-flow-indicator" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      <div className="faq-list-shell">
        <div className="faq-list" role="list" aria-label={ui.listAria}>
          {items.map((item, index) => {
            const isOpen = openIndex === index
            const isClosing = closingIndex === index
            const shouldRenderAnswer = isOpen || isClosing

            const buttonId = `faq-button-${index}`
            const panelId = `faq-panel-${index}`
            const tone = getFaqTone(index)

            return (
              <article
                key={`${item.q}-${index}`}
                className={`faq-item ${tone}${isOpen ? " is-open" : ""}${
                  isClosing ? " is-closing" : ""
                }${shouldRenderAnswer ? " has-inline-answer" : ""}`}
                role="listitem"
                onKeyDown={(event) => handleKeyDown(event, index)}
              >
                <button
                  id={buttonId}
                  type="button"
                  className="faq-trigger"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleItem(index)}
                >
                  <span className="faq-question">{item.q}</span>

                  <span
                    key={`${index}-${motionKey}-${isOpen ? "open" : "closed"}`}
                    className={`faq-screw${isOpen ? " is-open" : ""}${
                      isClosing ? " is-closing" : ""
                    }`}
                    aria-hidden="true"
                  >
                    <span className="faq-screw-head">
                      <span className="faq-screw-cross">
                        <span className="faq-screw-cross-line is-horizontal" />
                        <span className="faq-screw-cross-line is-vertical" />
                      </span>
                    </span>

                    <span className="faq-screw-thread" />
                  </span>

                  <span className="sr-only">
                    {isOpen ? ui.close : ui.open}
                  </span>
                </button>

                {shouldRenderAnswer ? (
                  <article
                    id={panelId}
                    className={`faq-inline-answer ${tone}${
                      isOpen ? " is-visible" : ""
                    }${isClosing ? " is-closing" : ""}`}
                    role="region"
                    aria-labelledby={buttonId}
                    aria-hidden={!isOpen}
                    tabIndex={-1}
                    onClick={() => closeItem(index)}
                  >
                    <div className="faq-inline-answer-inner">
                      <div className="faq-inline-answer-top">
                        <span className="faq-answer-label">{ui.answer}</span>
                      </div>

                      <p>{item.a}</p>

                      <div className="faq-answer-footer">
                        <div>
                          <strong>{ui.support}</strong>
                          <span>{ui.supportText}</span>
                        </div>

                        <a
                          className="faq-answer-cta"
                          href={whatsappUrl}
                          onClick={(event) => event.stopPropagation()}
                        >
                          {ui.contact}
                        </a>
                      </div>
                    </div>
                  </article>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}