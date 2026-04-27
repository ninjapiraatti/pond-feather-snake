# Geocoding Service

Finnish address to coordinates service using Maanmittauslaitos API.

## Structure

```
packages/
  api/     - Bun + Hono backend
  web/     - Vue 3 + Vite frontend
```

## Setup

```bash
# Install dependencies
bun install

# Copy env and add your MML API key
cp .env.example .env
```

## Running

```bash
# Terminal 1 - API (port 3000)
bun run dev:api

# Terminal 2 - Web (port 5173)
bun run dev:web
```

## API Endpoints

- `GET /api/geocode?q=<address>&country=FI` - Single address
- `POST /api/geocode` - Batch geocoding
  ```json
  {
    "addresses": ["Mannerheimintie 10, Helsinki"],
    "country": "FI",
    "delayMs": 100
  }
  ```

## Adding Countries

1. Create provider in `packages/api/src/geocoding/providers/<country>.ts`
2. Implement `GeocodingProvider` interface
3. Register in `packages/api/src/geocoding/index.ts`
