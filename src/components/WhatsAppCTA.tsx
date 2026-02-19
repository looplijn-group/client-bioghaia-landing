import SectionShell from "./SectionShell"
import { getWhatsAppLink } from "../config/client"

export default function WhatsAppCTA() {
  return (
    <div id="contact">
      <SectionShell
        title="Vamos conversar?"
        subtitle="Envie uma mensagem no WhatsApp com o tipo de serviço e a cidade do projeto. Respondemos o quanto antes."
      >
        <div className="cta-row">
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-button"
            aria-label="Abrir WhatsApp e conversar com a Bioghaia"
          >
            Falar no WhatsApp
          </a>
        </div>
      </SectionShell>
    </div>
  )
}
