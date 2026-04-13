// src/components/SectionShell.tsx
import type { ReactNode } from "react"
import "./SectionShell.css"

type SectionVariant = "default" | "band" | "forest"

type Props = {
  id?: string
  title: string
  subtitle?: string
  children: ReactNode
  variant?: SectionVariant
  className?: string
  headerExtra?: ReactNode
  eyebrow?: string
  align?: "left" | "center"
  contentClassName?: string
}

function getSectionClassName(
  variant: SectionVariant,
  align: "left" | "center",
  className?: string
) {
  const base =
    variant === "forest"
      ? "section section-forest"
      : variant === "band"
        ? "section section-band"
        : "section"

  const alignClass = align === "center" ? "section-align-center" : "section-align-left"

  return className ? `${base} ${alignClass} ${className}` : `${base} ${alignClass}`
}

export default function SectionShell({
  id,
  title,
  subtitle,
  children,
  variant = "default",
  className,
  headerExtra,
  eyebrow,
  align = "left",
  contentClassName,
}: Props) {
  const titleId = id ? `${id}-title` : undefined
  const subtitleId = id && subtitle ? `${id}-subtitle` : undefined
  const eyebrowId = id && eyebrow ? `${id}-eyebrow` : undefined

  const sectionClassName = getSectionClassName(variant, align, className)
  const bodyClassName = contentClassName ? `section-body ${contentClassName}` : "section-body"

  const ariaProps = titleId
    ? {
        "aria-labelledby": titleId,
        ...(subtitleId ? { "aria-describedby": subtitleId } : {}),
      }
    : {
        "aria-label": title,
      }

  return (
    <section id={id} className={sectionClassName} {...ariaProps}>
      <div className="section-inner">
        <header className="section-header">
          <div className="section-header-copy">
            {eyebrow ? (
              <p id={eyebrowId} className="section-eyebrow">
                {eyebrow}
              </p>
            ) : null}

            <h2 id={titleId} className="section-title">
              {title}
            </h2>

            {subtitle ? (
              <p id={subtitleId} className="section-subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>

          {headerExtra ? <div className="section-header-extra">{headerExtra}</div> : null}
        </header>

        <div className={bodyClassName}>{children}</div>
      </div>
    </section>
  )
}