import { useEffect, useMemo, useRef, useState } from "react"
import { getWhatsAppLink } from "../config/client"

type Msg = { role: "user" | "assistant"; text: string }

export default function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Olá! Sou o assistente da Bioghaia. Você precisa de Topografia, Geoprocessamento ou Licenciamento ambiental? Diga também a cidade/região do projeto.",
    },
  ])

  const listRef = useRef<HTMLDivElement | null>(null)
  const whatsappLink = useMemo(() => getWhatsAppLink(), [])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, messages.length])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    setMessages((m) => [...m, { role: "user", text }])
    setLoading(true)

    try {
      const res = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) {
        throw new Error("api_error")
      }

      const data = (await res.json()) as { text?: string }
      const reply =
        (data?.text && String(data.text)) ||
        "Entendi. Você pode me dizer a cidade/região do projeto e o prazo desejado?"

      setMessages((m) => [...m, { role: "assistant", text: reply }])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text:
            "No momento, posso te encaminhar direto para o WhatsApp. Clique no botão abaixo e me diga: serviço, cidade/região e prazo.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") void send()
    if (e.key === "Escape") setOpen(false)
  }

  return (
    <div className="assistant-floating" aria-label="Assistente virtual">
      {open ? (
        <div className="assistant-panel" role="dialog" aria-modal="false" aria-label="Chat do assistente">
          <div className="assistant-header">
            <div>
              <div className="assistant-name">Assistente Bioghaia</div>
              <div className="assistant-status" aria-live="polite">
                {loading ? "Digitando…" : "Online"}
              </div>
            </div>
            <button className="assistant-close" onClick={() => setOpen(false)} aria-label="Fechar chat">
              ✕
            </button>
          </div>

          <div ref={listRef} className="assistant-messages" role="log" aria-label="Mensagens">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={m.role === "user" ? "msg msg-user" : "msg msg-assistant"}
                aria-label={m.role === "user" ? "Sua mensagem" : "Mensagem do assistente"}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="assistant-actions" aria-label="Entrada de mensagem">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="assistant-input"
              placeholder="Escreva aqui…"
              aria-label="Digite sua mensagem"
            />
            <button className="assistant-send" onClick={() => void send()} aria-label="Enviar mensagem">
              Enviar
            </button>
          </div>

          <div className="assistant-footer">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="assistant-whats"
              aria-label="Ir para WhatsApp"
            >
              Ir para WhatsApp
            </a>
          </div>
        </div>
      ) : null}

      <button
        className="assistant-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar assistente" : "Abrir assistente"}
      >
        {open ? "—" : "💬"}
      </button>
    </div>
  )
}
