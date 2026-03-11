// src/components/WhyChoose.tsx
import { useEffect, useMemo, useState } from "react"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type Reason = {
  title: string
  description: string
}

type WhyChooseContent = typeof pt

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

function safeReasons(value: unknown): Reason[] {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      const title = String((item as Reason)?.title || "").trim()
      const description = String((item as Reason)?.description || "").trim()

      if (!title || !description) return null
      return { title, description }
    })
    .filter(Boolean) as Reason[]
}

export default function WhyChoose() {
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

  const content = useMemo<WhyChooseContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const reasons = useMemo(() => {
    return safeReasons(content.whyChoose?.reasons)
  }, [content.whyChoose?.reasons])

  const ui = useMemo(() => {
    return {
      listAria: lang === "en" ? "Why choose Bioghaia list" : "Lista de motivos para escolher a Bioghaia",
      itemAria: lang === "en" ? "Reason to choose Bioghaia" : "Motivo para escolher a Bioghaia",
      empty:
        lang === "en"
          ? "No reasons available right now."
          : "Nenhum motivo disponível no momento."
    }
  }, [lang])

  if (!reasons.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <div className="grid" role="list" aria-label={ui.listAria}>
      {reasons.map((reason, index) => (
        <article
          key={`${reason.title}-${index}`}
          className="card"
          role="listitem"
          aria-label={`${ui.itemAria}: ${reason.title}`}
        >
          <h3 className="card-title">{reason.title}</h3>
          <p className="card-text">{reason.description}</p>
        </article>
      ))}
    </div>
  )
}