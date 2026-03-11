import { useEffect, useMemo, useState } from "react"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type Props = {
  onStartConversation: (message: string) => void
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

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

export default function AIAssistantHero({ onStartConversation }: Props) {
  const [value, setValue] = useState("")
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))

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

  const content = useMemo(() => {
    const base = lang === "en" ? en : pt

    return {
      badge: lang === "en" ? "Smart project intake" : "Triagem inteligente do projeto",
      title:
        lang === "en"
          ? "Describe your case before moving to WhatsApp."
          : "Descreva seu caso antes de seguir para o WhatsApp.",
      subtitle:
        lang === "en"
          ? "A simpler way to organize the main details about your project, timeline and location before the direct handoff."
          : "Uma forma mais simples de organizar os principais dados do seu projeto, prazo e localização antes do encaminhamento direto.",
      placeholder:
        lang === "en"
          ? "Example: I need environmental licensing for a rural property in Rio Grande do Sul..."
          : "Exemplo: preciso de licenciamento ambiental para uma propriedade rural no Rio Grande do Sul...",
      button: lang === "en" ? "Start" : "Iniciar",
      formAria:
        lang === "en"
          ? "Start a conversation with the assistant"
          : "Iniciar uma conversa com o assistente",
      inputAria:
        lang === "en"
          ? "Describe your environmental project"
          : "Descreva seu projeto ambiental",
      suggestionsAria:
        lang === "en"
          ? "Suggested conversation starters"
          : "Sugestões para iniciar a conversa",
      chips:
        lang === "en"
          ? [
              "I need environmental licensing in RS",
              "How much does a topographic survey cost?",
              "Can you help with GIS analysis?",
            ]
          : [
              "Preciso de licenciamento ambiental no RS",
              "Quanto custa um levantamento topográfico?",
              "Vocês podem ajudar com geoprocessamento?",
            ],
      helper:
        lang === "en"
          ? "Quick intake first. Direct specialist contact right after."
          : "Primeiro uma triagem rápida. Depois, contato direto com especialista.",
      mini:
        lang === "en"
          ? "Technical guidance with a lighter, faster first step."
          : "Orientação técnica com uma primeira etapa mais leve e rápida.",
      companyName: base.brand.name,
    }
  }, [lang])

  function submit(e: React.FormEvent) {
    e.preventDefault()

    const clean = normalizeWhitespace(value)
    if (!clean) return

    onStartConversation(clean)
    setValue("")
  }

  function startFromChip(message: string) {
    onStartConversation(message)
    setValue("")
  }

  return (
    <section className="ai-hero" aria-label={content.badge}>
      <div className="ai-hero-inner ai-hero-compact">
        <div className="ai-hero-shell">
          <div className="ai-hero-copy">
            <div className="ai-hero-badge">{content.badge}</div>

            <h2 className="ai-hero-title">{content.title}</h2>

            <p className="ai-hero-subtitle">{content.subtitle}</p>

            <p className="ai-hero-mini">{content.mini}</p>
          </div>

          <div className="ai-hero-visual" aria-hidden="true">
            <div className="ai-orb">
              <span className="ai-orb-ring ai-orb-ring-a" />
              <span className="ai-orb-ring ai-orb-ring-b" />
              <span className="ai-orb-core" />
              <span className="ai-orb-dot ai-orb-dot-a" />
              <span className="ai-orb-dot ai-orb-dot-b" />
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="ai-hero-inputrow" aria-label={content.formAria}>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="ai-hero-input"
            placeholder={content.placeholder}
            aria-label={content.inputAria}
          />

          <button className="ai-hero-button" type="submit">
            {content.button}
          </button>
        </form>

        <div className="ai-hero-helper">{content.helper}</div>

        <div className="ai-hero-chips" aria-label={content.suggestionsAria}>
          {content.chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => startFromChip(chip)}
              className="ai-hero-chip"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}