// src/components/Services.tsx
import { useEffect, useMemo, useState } from "react"

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

export default function Services() {
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

  const content = useMemo<ServicesContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const services = useMemo(() => {
    return safeServiceItems(content.services?.items)
  }, [content.services?.items])

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
          : "Nenhum serviço disponível no momento."
    }
  }, [lang])

  if (!services.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <>
      <div className="grid" role="list" aria-label={ui.listAria}>
        {services.map((service, index) => (
          <article
            key={`${service.title}-${index}`}
            className="card"
            role="listitem"
            aria-label={`${ui.itemAria}: ${service.title}`}
          >
            <h3 className="card-title">{service.title}</h3>
            <p className="card-text">{service.description}</p>
          </article>
        ))}
      </div>

      {note ? <p className="note">{note}</p> : null}
    </>
  )
}