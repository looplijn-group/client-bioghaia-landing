// Business-hours configuration for Bia.
//
// DECISION (approved): No verified business hours exist in the Bioghaia
// configuration, so Bia does NOT invent any. Until real hours are provided,
// `configured` stays false and Bia always allows the visitor to prepare and
// open WhatsApp with no time-based messaging.
//
// To enable off-hours behaviour later, set `configured: true` and fill
// `timezone` + `schedule` with the client's real hours. `isWithinBusinessHours`
// is written to honour that config the moment it is supplied.

export type DaySchedule = { open: string; close: string } | null // "HH:MM" 24h, or null = closed

export type BusinessHoursConfig = {
  configured: boolean
  timezone: string
  // Index 0 = Sunday ... 6 = Saturday.
  schedule: [DaySchedule, DaySchedule, DaySchedule, DaySchedule, DaySchedule, DaySchedule, DaySchedule]
}

export const businessHours: BusinessHoursConfig = {
  configured: false,
  timezone: "America/Sao_Paulo",
  schedule: [null, null, null, null, null, null, null],
}

function minutesFromHHMM(value: string): number {
  const [h, m] = value.split(":").map((part) => Number.parseInt(part, 10))
  return h * 60 + m
}

// When hours are not configured, Bia is always "open" (always route to WhatsApp).
export function isWithinBusinessHours(config: BusinessHoursConfig, now: Date): boolean {
  if (!config.configured) return true
  const day = config.schedule[now.getDay()]
  if (!day) return false
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  return minutesNow >= minutesFromHHMM(day.open) && minutesNow < minutesFromHHMM(day.close)
}
