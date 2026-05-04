// src/components/WhyChoose.tsx

import { useEffect, useMemo, useState } from "react"
import "./SectionShell.css"
import "./WhyChoose.css"

import pt from "../content/bioghaia.pt.json"
import en from "../content/bioghaia.en.json"

type Lang = "pt" | "en"

type Reason = {
  label?: string
  title: string
  description: string
}

type WhyChooseData = {
  listAria?: string
  itemAria?: string
  empty?: string
  reasons?: unknown
}

type WhyChooseContent = {
  whyChoose?: WhyChooseData
}

const LS_LANG = "bioghaia_lang"

const CONTENT_BY_LANG: Record<Lang, WhyChooseContent> = {
  pt: pt as WhyChooseContent,
  en: en as WhyChooseContent,
}

function safeGetLS(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function normalizeLang(value: string | null): Lang {
  if (!value) return "pt"

  const normalized = value.toLowerCase().trim()

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en"
  }

  return "pt"
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function safeReasons(value: unknown): Reason[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.reduce<Reason[]>((acc, item) => {
    if (!item || typeof item !== "object") {
      return acc
    }

    const reason = item as Record<string, unknown>

    const label = getStringValue(reason.label)
    const title = getStringValue(reason.title)
    const description = getStringValue(reason.description)

    if (!title || !description) {
      return acc
    }

    acc.push(
      label
        ? {
            label,
            title,
            description,
          }
        : {
            title,
            description,
          },
    )

    return acc
  }, [])
}

function getReasonTone(index: number): string {
  const tones = ["is-emerald", "is-sky", "is-amber"]
  return tones[index % tones.length]
}

export default function WhyChoose() {
  const [lang, setLang] = useState<Lang>(() => normalizeLang(safeGetLS(LS_LANG)))

  useEffect(() => {
    const checkLang = () => {
      const current = normalizeLang(safeGetLS(LS_LANG))

      setLang((previousLang) => {
        return previousLang === current ? previousLang : current
      })
    }

    checkLang()

    window.addEventListener("storage", checkLang)
    const intervalId = window.setInterval(checkLang, 300)

    return () => {
      window.removeEventListener("storage", checkLang)
      window.clearInterval(intervalId)
    }
  }, [])

  const content = useMemo<WhyChooseContent>(() => {
    return CONTENT_BY_LANG[lang]
  }, [lang])

  const whyChoose = content.whyChoose

  const reasons = useMemo<Reason[]>(() => {
    return safeReasons(whyChoose?.reasons)
  }, [whyChoose?.reasons])

  const listAria =
    getStringValue(whyChoose?.listAria) ||
    (lang === "en"
      ? "Reasons to choose Bioghaia"
      : "Motivos para escolher a Bioghaia")

  const itemAria =
    getStringValue(whyChoose?.itemAria) ||
    (lang === "en" ? "Reason" : "Motivo")

  const empty =
    getStringValue(whyChoose?.empty) ||
    (lang === "en"
      ? "No reasons available right now."
      : "Nenhum motivo disponível no momento.")

  if (reasons.length === 0) {
    return <p className="note">{empty}</p>
  }

  return (
    <div className="why-choose-block">
      <div className="why-choose-grid" role="list" aria-label={listAria}>
        {reasons.map((reason, index) => {
          const toneClass = getReasonTone(index)

          return (
            <article
              key={`${reason.title}-${index}`}
              className={`why-choose-card ${toneClass}`}
              role="listitem"
              aria-label={`${itemAria}: ${reason.title}`}
            >
              <div className="why-choose-card-top">
                {reason.label && (
                  <span className="why-choose-card-pill">
                    {reason.label}
                  </span>
                )}

                <span className="why-choose-card-orb" aria-hidden="true" />
              </div>

              <h3 className="why-choose-card-title">{reason.title}</h3>
              <p className="why-choose-card-text">{reason.description}</p>

              <div className="why-choose-card-footer" aria-hidden="true">
                <span className="why-choose-card-line" />
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}