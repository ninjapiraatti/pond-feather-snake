import { ref } from "vue"

export interface Coordinates {
  lat: number
  lng: number
}

export interface Confidence {
  matchType?: string
  accuracy?: string
}

export interface GeocodingResult {
  input: string
  coordinates: Coordinates | null
  confidence: Confidence | null
  label: string | null
  source: "MML" | "Nominatim" | null
  maakunta: string | null
  error: string | null
}

export interface BatchGeocodeResponse {
  results: GeocodingResult[]
  processed: number
  failed: number
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000"

export function useGeocode() {
  const loading = ref(false)
  const results = ref<GeocodingResult[]>([])
  const error = ref<string | null>(null)
  const stats = ref<{ processed: number; failed: number } | null>(null)

  async function geocodeBatch(
    addresses: string[],
    options: { country?: string; delayMs?: number } = {}
  ) {
    loading.value = true
    error.value = null
    results.value = []
    stats.value = null

    try {
      const response = await fetch(`${API_BASE}/api/geocode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addresses,
          country: options.country || "FI",
          delayMs: options.delayMs ?? 100,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      const data: BatchGeocodeResponse = await response.json()
      results.value = data.results
      stats.value = { processed: data.processed, failed: data.failed }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Unknown error"
    } finally {
      loading.value = false
    }
  }

  function clear() {
    results.value = []
    error.value = null
    stats.value = null
  }

  return {
    loading,
    results,
    error,
    stats,
    geocodeBatch,
    clear,
  }
}
