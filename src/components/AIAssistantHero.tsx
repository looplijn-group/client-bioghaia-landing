// src/components/AIAssistantHero.tsx

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent
} from "react"
import "./AIAssistantHero.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type Props = {
  onStartConversation: (message: string) => void
}

type PreviewMessage = {
  id: string
  role: "user" | "assistant"
  text: string
  isTyping?: boolean
}

const LS_LANG = "bioghaia_lang"

function safeGetLS(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function normalizeLang(value: string | null): Lang {
  if (!value) return "pt"

  const normalized = value.toLowerCase()

  if (normalized === "en" || normalized.startsWith("en")) {
    return "en"
  }

  return "pt"
}

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function getText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback
}

function getStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback

  const clean = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  )

  return clean.length ? clean : fallback
}

function resizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return

  element.style.height = "auto"
  element.style.height = `${element.scrollHeight}px`
}

export default function AIAssistantHero({ onStartConversation }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)

  const [value, setValue] = useState("")
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))
  const [isCompactScreen, setIsCompactScreen] = useState(false)
  const [activeChip, setActiveChip] = useState<string | null>(null)

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

  useEffect(() => {
    const checkScreen = () => {
      setIsCompactScreen(window.innerWidth <= 620)
    }

    checkScreen()

    window.addEventListener("resize", checkScreen)

    return () => {
      window.removeEventListener("resize", checkScreen)
    }
  }, [])

  useEffect(() => {
    resizeTextarea(textareaRef.current)
  }, [value])

  const content = useMemo(() => {
    const base = lang === "en" ? en : pt
    const assistantHero = (base as any).assistantHero || {}

    const fallback =
      lang === "en"
        ? {
            badge: "AI-powered environmental intake",
            title: "Turn your first project message into clear technical direction.",
            subtitle:
              "Bioghaia’s assistant helps organize licensing, rural regularization, surveying, agriculture and reforestation requests before direct specialist contact.",
            mini: "A faster, smarter and more structured first step before WhatsApp.",
            placeholder:
              "Example: I need environmental licensing for a rural property in Rio Grande do Sul...",
            compactPlaceholder: "Example: environmental licensing in RS...",
            button: "Start",
            formAria: "Start a conversation with the assistant",
            inputAria: "Describe your environmental project",
            suggestionsAria: "Suggested conversation starters",
            flowAria: "How the intake works",
            helper: "Choose a suggestion or describe your case in your own words.",
            flowTitle: "What happens next",
            previewTitle: "Smart project screening",
            previewUser:
              "I need environmental licensing for a rural property and I am not sure where to start.",
            previewAssistant:
              "Understood. I can help organize the first technical details: location, property type, activity, documentation status and the best next step with Bioghaia.",
            typingLabel: "Bioghaia assistant is organizing your request",
            responseAfterAction:
              "Perfect. I will organize the essential details and prepare this request for direct specialist support on WhatsApp.",
            flowSteps: [
              "You describe the situation",
              "The assistant organizes the key details",
              "You continue with direct WhatsApp support"
            ],
            chips: [
              "I need environmental licensing in RS",
              "I need to regularize a rural property",
              "Can you help with land surveying?",
              "I need technical support for agriculture or reforestation"
            ]
          }
        : {
            badge: "Triagem ambiental com AI",
            title: "Transforme sua primeira mensagem em uma orientação técnica mais clara.",
            subtitle:
              "O assistente da Bioghaia ajuda a organizar solicitações de licenciamento, regularização rural, topografia, agricultura e reflorestamento antes do contato direto com especialista.",
            mini: "Uma primeira etapa mais rápida, inteligente e estruturada antes do WhatsApp.",
            placeholder:
              "Exemplo: preciso de licenciamento ambiental para uma propriedade rural no Rio Grande do Sul...",
            compactPlaceholder: "Ex: licenciamento ambiental no RS...",
            button: "Iniciar",
            formAria: "Iniciar uma conversa com o assistente",
            inputAria: "Descreva seu projeto ambiental",
            suggestionsAria: "Sugestões para iniciar a conversa",
            flowAria: "Como a triagem funciona",
            helper: "Escolha uma sugestão ou descreva seu caso com suas próprias palavras.",
            flowTitle: "O que acontece depois",
            previewTitle: "Triagem inteligente do projeto",
            previewUser:
              "Preciso de licenciamento ambiental para uma propriedade rural e não sei por onde começar.",
            previewAssistant:
              "Entendido. Posso ajudar a organizar os primeiros dados técnicos: localização, tipo de propriedade, atividade, situação dos documentos e melhor próximo passo com a Bioghaia.",
            typingLabel: "Assistente Bioghaia organizando sua solicitação",
            responseAfterAction:
              "Perfeito. Vou organizar os dados essenciais e preparar essa solicitação para suporte direto com especialista no WhatsApp.",
            flowSteps: [
              "Você descreve a situação",
              "O assistente organiza os dados principais",
              "Você continua com suporte direto no WhatsApp"
            ],
            chips: [
              "Preciso de licenciamento ambiental no RS",
              "Preciso regularizar uma propriedade rural",
              "Vocês fazem levantamento topográfico?",
              "Preciso de apoio técnico para agricultura ou reflorestamento"
            ]
          }

    return {
      badge: getText(assistantHero.badge, fallback.badge),
      title: getText(assistantHero.title, fallback.title),
      subtitle: getText(assistantHero.subtitle, fallback.subtitle),
      mini: getText(assistantHero.mini, fallback.mini),
      placeholder: getText(assistantHero.placeholder, fallback.placeholder),
      compactPlaceholder: getText(
        assistantHero.compactPlaceholder,
        fallback.compactPlaceholder
      ),
      button: getText(assistantHero.button, fallback.button),
      formAria: getText(assistantHero.formAria, fallback.formAria),
      inputAria: getText(assistantHero.inputAria, fallback.inputAria),
      suggestionsAria: getText(assistantHero.suggestionsAria, fallback.suggestionsAria),
      flowAria: getText(assistantHero.flowAria, fallback.flowAria),
      helper: getText(assistantHero.helper, fallback.helper),
      flowTitle: getText(assistantHero.flowTitle, fallback.flowTitle),
      previewTitle: getText(assistantHero.previewTitle, fallback.previewTitle),
      previewUser: getText(assistantHero.previewUser, fallback.previewUser),
      previewAssistant: getText(
        assistantHero.previewAssistant,
        fallback.previewAssistant
      ),
      typingLabel: getText(assistantHero.typingLabel, fallback.typingLabel),
      responseAfterAction: getText(
        assistantHero.responseAfterAction,
        fallback.responseAfterAction
      ),
      flowSteps: getStringArray(assistantHero.flowSteps, fallback.flowSteps),
      chips: getStringArray(assistantHero.chips, fallback.chips)
    }
  }, [lang])

  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([])

  useEffect(() => {
    setPreviewMessages([
      {
        id: "preview-user",
        role: "user",
        text: content.previewUser
      },
      {
        id: "preview-assistant",
        role: "assistant",
        text: content.previewAssistant
      }
    ])
  }, [content.previewUser, content.previewAssistant])

  useEffect(() => {
    if (!previewRef.current) return

    previewRef.current.scrollTo({
      top: previewRef.current.scrollHeight,
      behavior: "smooth"
    })
  }, [previewMessages])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  function animatePreview(message: string) {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current)
    }

    setPreviewMessages([
      {
        id: `user-${Date.now()}`,
        role: "user",
        text: message
      },
      {
        id: `typing-${Date.now()}`,
        role: "assistant",
        text: content.typingLabel,
        isTyping: true
      }
    ])

    typingTimeoutRef.current = window.setTimeout(() => {
      setPreviewMessages([
        {
          id: `user-final-${Date.now()}`,
          role: "user",
          text: message
        },
        {
          id: `assistant-final-${Date.now()}`,
          role: "assistant",
          text: content.responseAfterAction
        }
      ])
    }, 850)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const clean = normalizeWhitespace(value)
    if (!clean) return

    animatePreview(clean)
    onStartConversation(clean)
    setValue("")
    setActiveChip(null)

    window.requestAnimationFrame(() => {
      resizeTextarea(textareaRef.current)
    })
  }

  function startFromChip(message: string) {
    setActiveChip(message)
    animatePreview(message)
    onStartConversation(message)
    setValue("")

    window.requestAnimationFrame(() => {
      resizeTextarea(textareaRef.current)
    })
  }

  function handleTextareaChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setValue(event.target.value)
    resizeTextarea(event.target)
  }

  function handleTextareaKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return
    if (event.shiftKey) return

    event.preventDefault()

    const form = event.currentTarget.form
    form?.requestSubmit()
  }

  return (
    <section className="ai-hero" aria-label={content.badge}>
      <div className="ai-hero-inner ai-hero-compact">
        <div className="ai-hero-header">
          <div className="ai-hero-badge">{content.badge}</div>

          <div className="ai-hero-status" aria-hidden="true">
            <span className="ai-hero-status-dot" />
            <span>Online</span>
          </div>
        </div>

        <div className="ai-hero-copy">
          <h2 className="ai-hero-title">{content.title}</h2>

          <p className="ai-hero-subtitle">{content.subtitle}</p>

          <p className="ai-hero-mini">{content.mini}</p>
        </div>

        <div className="ai-hero-preview" aria-label={content.previewTitle}>
          <div className="ai-hero-preview-top">
            <div>
              <span className="ai-hero-preview-eyebrow">AI intake</span>
              <h3 className="ai-hero-preview-title">{content.previewTitle}</h3>
            </div>

            <div className="ai-hero-preview-signal" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>

          <div className="ai-hero-preview-chat" ref={previewRef}>
            {previewMessages.map((message) => (
              <div
                key={message.id}
                className={`ai-hero-message ai-hero-message-${message.role}`}
              >
                <div className="ai-hero-message-bubble">
                  {message.isTyping ? (
                    <span className="ai-hero-typing" aria-label={message.text}>
                      <span />
                      <span />
                      <span />
                    </span>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="ai-hero-inputrow" aria-label={content.formAria}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleTextareaKeyDown}
            className="ai-hero-input"
            placeholder={isCompactScreen ? content.compactPlaceholder : content.placeholder}
            aria-label={content.inputAria}
            autoComplete="off"
            rows={1}
            maxLength={220}
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
              className={`ai-hero-chip ${
                activeChip === chip ? "ai-hero-chip-active" : ""
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="ai-hero-flow" aria-label={content.flowAria}>
          <div className="ai-hero-flow-title">{content.flowTitle}</div>

          <div className="ai-hero-flow-steps">
            {content.flowSteps.map((step, index) => (
              <div key={`${step}-${index}`} className="ai-hero-flow-step">
                <span className="ai-hero-flow-index" aria-hidden="true">
                  {index + 1}
                </span>

                <span className="ai-hero-flow-text">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}