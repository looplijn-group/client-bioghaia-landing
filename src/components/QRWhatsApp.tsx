import { useEffect, useMemo, useState } from "react"
import { toDataURL } from "qrcode"
import { getWhatsAppLink } from "../config/client"

export default function QRWhatsApp() {
  const link = useMemo(() => getWhatsAppLink(), [])
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function buildQr() {
      try {
        const url = await toDataURL(link, {
          margin: 1,
          width: 320,
          errorCorrectionLevel: "M",
        })
        if (!cancelled) setDataUrl(url)
      } catch {
        if (!cancelled) setDataUrl(null)
      }
    }

    void buildQr()

    return () => {
      cancelled = true
    }
  }, [link])

  return (
    <section className="qr" aria-label="QR Code para WhatsApp">
      <div className="qr-inner">
        <h3 className="qr-title">Aponte a câmera e fale no WhatsApp</h3>
        <p className="qr-text">
          Ideal para compartilhar em cartão, obra, escritório ou atendimento presencial.
        </p>

        {dataUrl ? (
          <img
            src={dataUrl}
            alt="QR Code para abrir conversa no WhatsApp com a Bioghaia"
            className="qr-img"
            loading="lazy"
          />
        ) : (
          <div className="qr-fallback" role="status" aria-live="polite">
            QR indisponível no momento.
          </div>
        )}

        <a
          className="qr-link"
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir link do WhatsApp em nova aba"
        >
          Abrir WhatsApp manualmente
        </a>
      </div>
    </section>
  )
}
