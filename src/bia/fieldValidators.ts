// Deterministic field validators for Bia qualification inputs.
// No external dependencies. Imported by both engine.ts and validation.ts
// (kept separate to avoid an import cycle between them).

export type FieldId =
  | "clientType"
  | "name"
  | "contactMethod"
  | "contactValue"
  | "city"
  | "objective"
  | "projectStage"
  | "deadline"
  | "note"

export type ContactMethod = "WhatsApp" | "Phone" | "Email" | string

export type ValidationErrorKey = "invalidEmail" | "invalidPhone" | "invalidContact" | "tooShort"

export type FieldValidation = { ok: true; value: string } | { ok: false; errorKey: ValidationErrorKey }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function digitsOnly(text: string): string {
  return text.replace(/\D+/g, "")
}

export function isValidEmail(text: string): boolean {
  return EMAIL_RE.test(text.trim())
}

// Accepts common Brazilian formats: +55 (54) 99677-8886, 54996778886, (54) 3333-4444, etc.
// After stripping non-digits, a national number is 10 or 11 digits; with country code 12 or 13.
export function isValidBrazilPhone(text: string): boolean {
  const digits = digitsOnly(text)
  if (digits.length === 10 || digits.length === 11) return true
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return true
  return false
}

export function validateField(field: FieldId, rawValue: string, contactMethod?: ContactMethod): FieldValidation {
  const value = rawValue.trim().replace(/\s+/g, " ")

  switch (field) {
    case "name": {
      // At least two characters, not purely numeric.
      if (value.length < 2 || /^\d+$/.test(value)) return { ok: false, errorKey: "tooShort" }
      return { ok: true, value }
    }
    case "city": {
      if (value.length < 2) return { ok: false, errorKey: "tooShort" }
      return { ok: true, value }
    }
    case "objective": {
      if (value.length < 3) return { ok: false, errorKey: "tooShort" }
      return { ok: true, value }
    }
    case "contactValue": {
      const method = (contactMethod || "").toLowerCase()
      if (method.includes("email") || method.includes("e-mail")) {
        return isValidEmail(value) ? { ok: true, value } : { ok: false, errorKey: "invalidEmail" }
      }
      if (method.includes("phone") || method.includes("whatsapp") || method.includes("telefone")) {
        return isValidBrazilPhone(value) ? { ok: true, value } : { ok: false, errorKey: "invalidPhone" }
      }
      // Method unknown: accept a valid email or a valid phone.
      if (isValidEmail(value) || isValidBrazilPhone(value)) return { ok: true, value }
      return { ok: false, errorKey: "invalidContact" }
    }
    // Free-form fields with no strict format.
    case "deadline":
    case "note":
    case "clientType":
    case "projectStage":
    case "contactMethod":
    default: {
      if (value.length < 1) return { ok: false, errorKey: "tooShort" }
      return { ok: true, value }
    }
  }
}
