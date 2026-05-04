// src/components/TopBar.tsx

import { useMemo, useState } from "react"
import "./TopBar.css"

type TemplateMode = "dawn" | "dusk"
type Lang = "pt" | "en"

type TopBarProps = {
  brandName: string
  brandAria: string
  headerAria: string
  navAria: string
  controlsAria: string

  navServices: string
  navWhy: string
  navFaq: string
  navContact: string

  servicesId: string
  whyId: string
  faqId: string
  contactId: string

  templateMode: TemplateMode
  lang: Lang

  templateDawn: string
  templateDusk: string
  langPT: string
  langEN: string

  topBarSubtitle: string
  themePrefix: string
  languagePrefix: string
  contactAccent: string

  templateToggleAria: string
  langToggleAria: string

  onToggleTemplate: () => void
  onToggleLang: () => void
}

export default function TopBar({
  brandName,
  brandAria,
  headerAria,
  navAria,
  controlsAria,
  navServices,
  navWhy,
  navFaq,
  navContact,
  servicesId,
  whyId,
  faqId,
  contactId,
  templateMode,
  lang,
  templateDawn,
  templateDusk,
  langPT,
  langEN,
  topBarSubtitle,
  themePrefix,
  languagePrefix,
  templateToggleAria,
  langToggleAria,
  onToggleTemplate,
  onToggleLang,
}: TopBarProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const navItems = useMemo(
    () => [
      { id: servicesId, label: navServices },
      { id: whyId, label: navWhy },
      { id: faqId, label: navFaq },
      { id: contactId, label: navContact },
    ],
    [
      servicesId,
      whyId,
      faqId,
      contactId,
      navServices,
      navWhy,
      navFaq,
      navContact,
    ]
  )

  const currentThemeLabel = templateMode === "dawn" ? templateDawn : templateDusk
  const nextLanguageLabel = lang === "pt" ? langEN : langPT

  return (
    <header className="app-topbar" role="banner" aria-label={headerAria}>
      <div className="app-topbar-inner">
        <a
          className="app-brand"
          href="#content"
          aria-label={brandAria}
          onClick={() => setSelectedId(null)}
        >
          <span className="app-brand-mark" aria-hidden="true">
            <span className="app-brand-core" />
          </span>

          <span className="app-brand-copy">
            <span className="app-brand-name">{brandName}</span>
            <span className="app-brand-subtitle">{topBarSubtitle}</span>
          </span>
        </a>

        <nav className="app-nav-dock" aria-label={navAria}>
          <span className="app-nav-indicator" aria-hidden="true" />

          {navItems.map((item) => {
            const isSelected = selectedId === item.id

            return (
              <a
                key={item.id}
                className={`app-nav-link ${isSelected ? "is-active" : ""}`}
                href={`#${item.id}`}
                aria-current={isSelected ? "location" : undefined}
                onClick={() => setSelectedId(item.id)}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="app-controls" aria-label={controlsAria}>
          <button
            type="button"
            className="app-control-btn app-control-theme"
            onClick={onToggleTemplate}
            aria-label={templateToggleAria}
            title={templateToggleAria}
          >
            <span className="app-control-orb" aria-hidden="true" />
            <span className="app-control-prefix">{themePrefix}</span>
            <span className="app-control-value">{currentThemeLabel}</span>
          </button>

          <button
            type="button"
            className="app-control-btn app-control-language"
            onClick={onToggleLang}
            aria-label={langToggleAria}
            title={langToggleAria}
          >
            <span className="app-control-prefix">{languagePrefix}</span>
            <span className="app-control-value">{nextLanguageLabel}</span>
          </button>
        </div>
      </div>
    </header>
  )
}