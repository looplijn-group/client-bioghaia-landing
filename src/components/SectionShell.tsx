// src/components/SectionShell.tsx

import type { ReactNode, ElementType } from "react"
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

  /** Control heading level for SEO / hierarchy */
  as?: ElementType

  /**
   * Allows sections with their own custom header, like Services,
   * to avoid duplicated titles/subtitles.
   */
  hideHeader?: boolean
}

function getSectionClassName(
  variant: SectionVariant,
  align: "left" | "center",
  className?: string
) {
  const variantClass =
    variant === "forest"
      ? "section-forest"
      : variant === "band"
        ? "section-band"
        : "section-default"

  const alignClass =
    align === "center" ? "section-align-center" : "section-align-left"

  return ["section", variantClass, alignClass, className]
    .filter(Boolean)
    .join(" ")
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

  as: HeadingTag = "h2",
  hideHeader = false,
}: Props) {
  const titleId = id ? `${id}-title` : undefined
  const subtitleId = id && subtitle ? `${id}-subtitle` : undefined
  const eyebrowId = id && eyebrow ? `${id}-eyebrow` : undefined

  const sectionClassName = getSectionClassName(variant, align, className)

  const bodyClassName = contentClassName
    ? `section-body ${contentClassName}`
    : "section-body"

  const describedBy = [eyebrowId, subtitleId].filter(Boolean).join(" ") || undefined

  const ariaProps = titleId
    ? {
        "aria-labelledby": titleId,
        ...(describedBy && !hideHeader ? { "aria-describedby": describedBy } : {}),
      }
    : {
        "aria-label": title,
      }

  return (
    <section id={id} className={sectionClassName} {...ariaProps}>
      <div className="section-inner">
        {!hideHeader && (
          <header className="section-header">
            <div className="section-header-copy">
              {eyebrow && (
                <p id={eyebrowId} className="section-eyebrow">
                  {eyebrow}
                </p>
              )}

              <HeadingTag id={titleId} className="section-title">
                {title}
              </HeadingTag>

              {subtitle && (
                <p id={subtitleId} className="section-subtitle">
                  {subtitle}
                </p>
              )}
            </div>

            {headerExtra && (
              <div className="section-header-extra">{headerExtra}</div>
            )}
          </header>
        )}

        {hideHeader && titleId ? (
          <span id={titleId} className="section-sr-title">
            {title}
          </span>
        ) : null}

        <div className={bodyClassName}>{children}</div>
      </div>
    </section>
  )
}