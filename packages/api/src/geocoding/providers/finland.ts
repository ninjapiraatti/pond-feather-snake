import type { GeocodingProvider, GeocodingResult, NormalizedAddress } from "../types"
import { normalizeAddress, validateFinnishPostalCode } from "../../utils/normalize"

const MML_BASE_URL = "https://avoin-paikkatieto.maanmittauslaitos.fi/geocoding/v2/pelias/search"
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"

interface MMLFeature {
  geometry: {
    coordinates: [number, number]
  }
  properties: {
    confidence?: number
    label: string
    match_type?: string
    accuracy?: string
  }
}

interface MMLResponse {
  features: MMLFeature[]
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  type: string
  importance: number
}

export class FinlandProvider implements GeocodingProvider {
  country = "FI"
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  normalizeAddress(raw: string): NormalizedAddress {
    return normalizeAddress(raw)
  }

  validatePostalCode(code: string): boolean {
    return validateFinnishPostalCode(code)
  }

  async geocode(address: string): Promise<GeocodingResult> {
    const normalized = this.normalizeAddress(address)

    try {
      const result = await this.queryMML(normalized.raw)
      if (result) return { ...result, input: address }

      if (normalized.postalCode && normalized.city) {
        const withoutPostal = normalized.raw.replace(normalized.postalCode, "").trim()
        const fallback = await this.queryMML(withoutPostal)
        if (fallback) return { ...fallback, input: address }
      }

      const nominatimResult = await this.queryNominatim(normalized.raw)
      if (nominatimResult) return { ...nominatimResult, input: address }

      return {
        input: address,
        coordinates: null,
        confidence: null,
        label: null,
        source: null,
        maakunta: null,
        error: "No results found",
      }
    } catch (err) {
      return {
        input: address,
        coordinates: null,
        confidence: null,
        label: null,
        source: null,
        maakunta: null,
        error: err instanceof Error ? err.message : "Unknown error",
      }
    }
  }

  private async queryMML(query: string): Promise<GeocodingResult | null> {
    const url = new URL(MML_BASE_URL)
    url.searchParams.set("text", query)
    url.searchParams.set("size", "1")
    url.searchParams.set("lang", "fi")
    url.searchParams.set("sources", "addresses")
    url.searchParams.set("api-key", this.apiKey)

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`MML API error: ${response.status}`)
    }

    const data = (await response.json()) as MMLResponse

    if (!data.features || data.features.length === 0) {
      return null
    }

    const feature = data.features[0]
    const [lng, lat] = feature.geometry.coordinates

    return {
      input: query,
      coordinates: { lat, lng },
      confidence: {
        matchType: feature.properties.match_type,
        accuracy: feature.properties.accuracy,
      },
      label: feature.properties.label,
      source: "MML",
      maakunta: null,
      error: null,
    }
  }

  private async queryNominatim(query: string): Promise<GeocodingResult | null> {
    const url = new URL(NOMINATIM_BASE_URL)
    url.searchParams.set("q", `${query}, Finland`)
    url.searchParams.set("format", "json")
    url.searchParams.set("limit", "1")
    url.searchParams.set("addressdetails", "1")

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "pond-feather-snake-geocoder/0.1.0",
      },
    })

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as NominatimResult[]

    if (!data || data.length === 0) {
      return null
    }

    const result = data[0]

    return {
      input: query,
      coordinates: {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      },
      confidence: {
        matchType: result.type,
        accuracy: result.importance > 0.5 ? "high" : "low",
      },
      label: result.display_name,
      source: "Nominatim",
      maakunta: null,
      error: null,
    }
  }
}
