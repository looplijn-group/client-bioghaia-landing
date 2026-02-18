import SectionShell from "./SectionShell"
import { getWhatsAppLink } from "../config/client"

export default function WhatsAppCTA() {
  return (
    <SectionShell
      title="Ready to talk?"
      subtitle="Send a quick message on WhatsApp and we’ll respond as soon as possible."
    >
      <div className="cta-row">
        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-button"
        >
          Talk on WhatsApp
        </a>
      </div>
    </SectionShell>
  )
}
