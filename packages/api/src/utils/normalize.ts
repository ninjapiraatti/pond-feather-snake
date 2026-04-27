import type { NormalizedAddress } from "../geocoding/types"

const FINNISH_POSTAL_CODE = /\b(\d{5})\b/

export function normalizeAddress(raw: string): NormalizedAddress {
  const trimmed = raw.trim().replace(/\s+/g, " ")

  const postalMatch = trimmed.match(FINNISH_POSTAL_CODE)
  const postalCode = postalMatch ? postalMatch[1] : null

  const streetMatch = trimmed.match(/^([^,\d]*\d+[a-zA-Z]?\s*\d*)/i)
  const streetPart = streetMatch ? streetMatch[1].trim() : null

  let street: string | null = null
  let number: string | null = null

  if (streetPart) {
    const parts = streetPart.match(/^(.+?)\s+(\d+.*)$/)
    if (parts) {
      street = parts[1]
      number = parts[2]
    } else {
      street = streetPart
    }
  }

  let city: string | null = null
  if (postalCode) {
    const afterPostal = trimmed.split(postalCode)[1]
    if (afterPostal) {
      city = afterPostal.replace(/^[\s,]+/, "").split(/[,\n]/)[0].trim() || null
    }
  }

  return {
    raw: trimmed,
    street,
    number,
    postalCode,
    city,
  }
}

export function validateFinnishPostalCode(code: string): boolean {
  return /^\d{5}$/.test(code)
}
