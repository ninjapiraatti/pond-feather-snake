# pond-feather-snake

Finnish address geocoding service using Maanmittauslaitos API.

## Prerequisites

- [Bun](https://bun.sh/) v1.0+
- Maanmittauslaitos API key ([register here](https://www.maanmittauslaitos.fi/rajapinnat/api-avaimen-ohje))

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd pond-feather-snake

# Install dependencies
bun install

# Configure API key
cp .env.example packages/api/.env
# Edit packages/api/.env and add your MML_API_KEY
```

## Running

```bash
# Terminal 1 - Start API (port 3000)
bun run dev:api

# Terminal 2 - Start frontend (port 5173)
bun run dev:web
```

Open http://localhost:5173 in your browser.

## Usage

1. Paste Finnish addresses into the textarea (one per line)
2. Adjust delay between requests if needed
3. Click "Geocode"
4. Export results as CSV or JSON

## API

### Single address

```
GET /api/geocode?q=Mannerheimintie+10+Helsinki&country=FI
```

### Batch geocoding

```bash
curl -X POST http://localhost:3000/api/geocode \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["Mannerheimintie 10, Helsinki", "Vanttitie 5 Kuopio"],
    "country": "FI",
    "delayMs": 100
  }'
```

## Project Structure

```
packages/
  api/     Bun + Hono backend
  web/     Vue 3 + Vite frontend
```
