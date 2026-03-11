// src/components/SectionShell.tsx
import type { ReactNode } from "react"

type SectionVariant = "default" | "band" | "forest"

type Props = {
  id?: string
  title: string
  subtitle?: string
  children: ReactNode
  variant?: SectionVariant
  className?: string
  headerExtra?: ReactNode
}

function getSectionClassName(variant: SectionVariant, className?: string) {
  const base =
    variant === "forest"
      ? "section section-forest"
      : variant === "band"
        ? "section section-band"
        : "section"

  return className ? `${base} ${className}` : base
}

export default function SectionShell({
  id,
  title,
  subtitle,
  children,
  variant = "default",
  className,
  headerExtra
}: Props) {
  const titleId = id ? `${id}-title` : undefined
  const subtitleId = id && subtitle ? `${id}-subtitle` : undefined

  const sectionClassName = getSectionClassName(variant, className)

  const ariaProps = titleId
    ? {
        "aria-labelledby": titleId,
        ...(subtitleId ? { "aria-describedby": subtitleId } : {})
      }
    : {
        "aria-label": title
      }

  return (
    <section id={id} className={sectionClassName} {...ariaProps}>
      <div className="section-inner">
        <header className="section-header">
          <h2 id={titleId} className="section-title">
            {title}
          </h2>

          {subtitle ? (
            <p id={subtitleId} className="section-subtitle">
              {subtitle}
            </p>
          ) : null}

          {headerExtra ? headerExtra : null}
        </header>

        {children}
      </div>
    </section>
  )
}