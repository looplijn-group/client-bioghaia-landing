import { client, getWhatsAppLink } from "../config/client"

export default function Hero() {
  return (
    <section className="hero" aria-label="Apresentação">
      <div className="hero-inner">
        <p className="hero-kicker">Engenharia Ambiental no {client.city}</p>

        <h1 className="hero-title">
          Topografia e Geoprocessamento para seu empreendimento avançar com segurança
        </h1>

        <p className="hero-subtitle">
          Serviços de inteligência ambiental com consultoria e gestão sustentável.
          Seu empreendimento bem amparado e o meio ambiente em segurança.
        </p>

        <div className="hero-actions" role="group" aria-label="Ações principais">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
            aria-label="Falar com a Bioghaia no WhatsApp"
          >
            Falar no WhatsApp
          </a>

          <a className="ghost-button" href="#services" aria-label="Ver serviços">
            Ver serviços
          </a>
        </div>

        <ul className="hero-highlights" aria-label="Destaques">
          <li>Atendimento rápido</li>
          <li>Orçamentos claros</li>
          <li>Do diagnóstico à entrega</li>
        </ul>
      </div>
    </section>
  )
}
