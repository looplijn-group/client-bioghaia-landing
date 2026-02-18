import { client, getWhatsAppLink } from "../config/client"

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner hero-inner--top">
        <h1 className="hero-title">{client.name}</h1>
        <p className="hero-subtitle">Premium solutions in {client.city}</p>

        <div className="hero-actions">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
          >
            Talk on WhatsApp
          </a>
        </div>
      </div>
    </section>
  )
}
