import { client } from "../config/client"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer" role="contentinfo" aria-label="Rodapé">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-dot" aria-hidden="true" />
          <div>
            <div className="footer-title">{client.name}</div>
            <div className="footer-subtitle">Engenharia Ambiental • {client.city}</div>
          </div>
        </div>

        <div className="footer-meta">
          <span>© {year} • Todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  )
}
