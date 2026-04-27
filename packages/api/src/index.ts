import { Hono } from "hono"
import { cors } from "hono/cors"
import { initProviders, batchGeocode, getProvider, listCountries } from "./geocoding"
import type { BatchGeocodeRequest } from "./geocoding/types"

const app = new Hono()

app.use("/*", cors())

const apiKey = process.env.MML_API_KEY
if (!apiKey) {
  console.error("MML_API_KEY environment variable is required")
  process.exit(1)
}

initProviders({ mmlApiKey: apiKey })

app.get("/", (c) => {
  return c.json({
    name: "Geocoding API",
    version: "0.1.0",
    countries: listCountries(),
  })
})

app.get("/api/geocode", async (c) => {
  const query = c.req.query("q")
  const country = c.req.query("country") || "FI"

  if (!query) {
    return c.json({ error: "Query parameter 'q' is required" }, 400)
  }

  const provider = getProvider(country)
  if (!provider) {
    return c.json({ error: `Unsupported country: ${country}` }, 400)
  }

  const result = await provider.geocode(query)
  return c.json(result)
})

app.post("/api/geocode", async (c) => {
  const body = await c.req.json<BatchGeocodeRequest>()

  if (!body.addresses || !Array.isArray(body.addresses)) {
    return c.json({ error: "Request body must include 'addresses' array" }, 400)
  }

  if (body.addresses.length > 1000) {
    return c.json({ error: "Maximum 1000 addresses per request" }, 400)
  }

  const response = await batchGeocode(body)
  return c.json(response)
})

const port = parseInt(process.env.PORT || "3000")

console.log(`Geocoding API running on http://localhost:${port}`)

export default {
  port,
  fetch: app.fetch,
}
