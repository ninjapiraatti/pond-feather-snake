import type { GeocodingProvider, BatchGeocodeRequest, BatchGeocodeResponse } from "./types"
import { FinlandProvider } from "./providers/finland"
import { getMaakunta } from "../utils/maakunta"

const providers = new Map<string, GeocodingProvider>()

export function initProviders(config: { mmlApiKey: string }) {
  providers.set("FI", new FinlandProvider(config.mmlApiKey))
}

export function getProvider(country: string): GeocodingProvider | undefined {
  return providers.get(country.toUpperCase())
}

export function listCountries(): string[] {
  return Array.from(providers.keys())
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function batchGeocode(request: BatchGeocodeRequest): Promise<BatchGeocodeResponse> {
  const country = request.country?.toUpperCase() || "FI"
  const delayMs = request.delayMs ?? 100
  const provider = getProvider(country)

  if (!provider) {
    return {
      results: request.addresses.map((addr) => ({
        input: addr,
        coordinates: null,
        confidence: null,
        label: null,
        source: null,
        maakunta: null,
        error: `Unsupported country: ${country}`,
      })),
      processed: 0,
      failed: request.addresses.length,
    }
  }

  const results = []
  let failed = 0

  for (let i = 0; i < request.addresses.length; i++) {
    const address = request.addresses[i]

    if (i > 0 && delayMs > 0) {
      await sleep(delayMs)
    }

    const result = await provider.geocode(address)
    const maakunta = result.coordinates
      ? getMaakunta(result.coordinates.lat, result.coordinates.lng)
      : null
    results.push({ ...result, maakunta })

    if (result.error) {
      failed++
    }
  }

  return {
    results,
    processed: results.length,
    failed,
  }
}
