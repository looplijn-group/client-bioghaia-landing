import type { ReactNode } from "react"

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function SectionShell({ title, subtitle, children }: Props) {
  return (
    <section className="section" aria-label={title}>
      <div className="section-inner">
        <header className="section-header">
          <h2 className="section-title">{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </section>
  )
}
