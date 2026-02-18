type ClientConfig = {
  name: string
  city: string
  whatsappNumber: string
  whatsappPrefill: string
}

function requiredEnv(key: string): string {
  const v = import.meta.env[key]
  if (!v || typeof v !== "string") {
    throw new Error(`Missing required env var: ${key}`)
  }
  return v
}

export const client: ClientConfig = {
  name: requiredEnv("VITE_CLIENT_NAME"),
  city: requiredEnv("VITE_CLIENT_CITY"),
  whatsappNumber: requiredEnv("VITE_CLIENT_WHATSAPP"),
  whatsappPrefill: requiredEnv("VITE_WHATSAPP_PREFILL"),
}

export function getWhatsAppLink() {
  return `https://wa.me/${client.whatsappNumber}?text=${client.whatsappPrefill}`
}
