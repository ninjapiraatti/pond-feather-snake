export interface Coordinates {
  lat: number
  lng: number
}

export interface GeocodingResult {
  input: string
  coordinates: Coordinates | null
  confidence: {
    matchType?: string
    accuracy?: string
  } | null
  label: string | null
  source: "MML" | "Nominatim" | null
  error: string | null
}

export interface NormalizedAddress {
  raw: string
  street: string | null
  number: string | null
  postalCode: string | null
  city: string | null
}

export interface GeocodingProvider {
  country: string
  geocode(address: string): Promise<GeocodingResult>
  normalizeAddress(raw: string): NormalizedAddress
  validatePostalCode(code: string): boolean
}

export interface BatchGeocodeRequest {
  addresses: string[]
  country?: string
  delayMs?: number
}

export interface BatchGeocodeResponse {
  results: GeocodingResult[]
  processed: number
  failed: number
}
