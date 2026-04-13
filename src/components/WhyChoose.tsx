// src/components/WhyChoose.tsx
import { useEffect, useMemo, useState } from "react"
import "./SectionShell.css"

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

function getReasonTone(index: number) {
  const tones = ["is-emerald", "is-sky", "is-amber", "is-earth"]
  return tones[index % tones.length]
}

function getReasonLabel(lang: Lang, index: number) {
  const ptLabels = [
    "Atendimento direto",
    "Clareza aplicada",
    "Confiança técnica",
    "Acompanhamento real",
  ]

  const enLabels = [
    "Direct support",
    "Applied clarity",
    "Technical trust",
    "Real follow-through",
  ]

  return lang === "en"
    ? enLabels[index % enLabels.length]
    : ptLabels[index % ptLabels.length]
}

export default function WhyChoose() {
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

  const content = useMemo<WhyChooseContent>(() => {
    return lang === "en" ? en : pt
  }, [lang])

  const reasons = useMemo(() => {
    return safeReasons(content.whyChoose?.reasons)
  }, [content.whyChoose?.reasons])

  const ui = useMemo(() => {
    return {
      listAria:
        lang === "en"
          ? "Why choose Bioghaia list"
          : "Lista de motivos para escolher a Bioghaia",
      itemAria:
        lang === "en"
          ? "Reason to choose Bioghaia"
          : "Motivo para escolher a Bioghaia",
      empty:
        lang === "en"
          ? "No reasons available right now."
          : "Nenhum motivo disponível no momento.",
      introEyebrow: lang === "en" ? "Why clients trust Bioghaia" : "Por que clientes confiam na Bioghaia",
      introTitle:
        lang === "en"
          ? "A more direct and reliable technical experience"
          : "Uma experiência técnica mais direta e confiável",
      introText:
        lang === "en"
          ? "Beyond technical delivery, Bioghaia focuses on clear communication, fast understanding, and practical direction for each case."
          : "Além da entrega técnica, a Bioghaia prioriza comunicação clara, entendimento rápido do cenário e direcionamento prático para cada caso.",
    }
  }, [lang])

  if (!reasons.length) {
    return <p className="note">{ui.empty}</p>
  }

  return (
    <>
      <div className="section-intro">
        <p className="section-eyebrow">{ui.introEyebrow}</p>
        <h3 className="section-mini-title">{ui.introTitle}</h3>
        <p className="section-mini-text">{ui.introText}</p>
      </div>

      <div className="grid grid-services" role="list" aria-label={ui.listAria}>
        {reasons.map((reason, index) => (
          <article
            key={`${reason.title}-${index}`}
            className={`card card-service ${getReasonTone(index)}`}
            role="listitem"
            aria-label={`${ui.itemAria}: ${reason.title}`}
          >
            <div className="card-service-top">
              <span className="card-service-pill">{getReasonLabel(lang, index)}</span>
              <span className="card-service-orb" aria-hidden="true" />
            </div>

            <h3 className="card-title">{reason.title}</h3>
            <p className="card-text">{reason.description}</p>

            <div className="card-service-footer" aria-hidden="true">
              <span className="card-service-line" />
            </div>
          </article>
        ))}
      </div>
    </>
  )
}