<script setup lang="ts">
import { ref, computed } from "vue"
import { useGeocode, type GeocodingResult } from "./composables/useGeocode"

const { loading, results, error, stats, geocodeBatch, clear } = useGeocode()

const addressInput = ref("")
const delayMs = ref(100)

const addresses = computed(() =>
  addressInput.value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
)

async function handleSubmit() {
  if (addresses.value.length === 0) return
  await geocodeBatch(addresses.value, { delayMs: delayMs.value })
}

function handleClear() {
  addressInput.value = ""
  clear()
}

function formatConfidence(c: GeocodingResult["confidence"]): string {
  if (!c) return "-"
  const parts = []
  if (c.matchType) parts.push(c.matchType)
  if (c.accuracy) parts.push(c.accuracy)
  return parts.join(" / ") || "-"
}

function downloadCsv() {
  const headers = ["input", "lat", "lng", "matchType", "accuracy", "source", "label", "error"]
  const rows = results.value.map((r) => [
    r.input,
    r.coordinates?.lat ?? "",
    r.coordinates?.lng ?? "",
    r.confidence?.matchType ?? "",
    r.confidence?.accuracy ?? "",
    r.source ?? "",
    r.label ?? "",
    r.error ?? "",
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "geocoding-results.csv"
  a.click()
  URL.revokeObjectURL(url)
}

function downloadJson() {
  const json = JSON.stringify(results.value, null, 2)
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "geocoding-results.json"
  a.click()
  URL.revokeObjectURL(url)
}

function getStatusClass(result: GeocodingResult): string {
  if (result.error) return "status-error"
  if (result.source === "Nominatim") return "status-warning"
  if (result.confidence?.matchType === "exact" && result.confidence?.accuracy === "point") {
    return "status-success"
  }
  if (result.confidence?.matchType === "exact") return "status-success"
  if (result.confidence?.matchType === "interpolated") return "status-warning"
  return "status-low"
}
</script>

<template>
  <div class="container">
    <header>
      <h1>Geocoding Service</h1>
      <p>Convert Finnish addresses to coordinates using Maanmittauslaitos</p>
    </header>

    <main>
      <section class="input-section">
        <label for="addresses">Addresses (one per line)</label>
        <textarea
          id="addresses"
          v-model="addressInput"
          rows="10"
          placeholder="Mannerheimintie 10, 00100 Helsinki
Aleksanterinkatu 52, 00100 Helsinki
Hämeentie 135, 00560 Helsinki"
          :disabled="loading"
        ></textarea>

        <div class="controls">
          <div class="delay-control">
            <label for="delay">Delay between requests (ms)</label>
            <input
              id="delay"
              type="number"
              v-model.number="delayMs"
              min="0"
              max="5000"
              step="50"
              :disabled="loading"
            />
          </div>

          <div class="buttons">
            <button @click="handleClear" :disabled="loading" class="secondary">Clear</button>
            <button @click="handleSubmit" :disabled="loading || addresses.length === 0">
              {{ loading ? "Processing..." : `Geocode ${addresses.length} addresses` }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="error" class="error">
        {{ error }}
      </section>

      <section v-if="stats" class="stats">
        Processed: {{ stats.processed }} | Failed: {{ stats.failed }}
        <div class="export-buttons">
          <button @click="downloadCsv" class="small">Export CSV</button>
          <button @click="downloadJson" class="small">Export JSON</button>
        </div>
      </section>

      <section v-if="results.length > 0" class="results">
        <table>
          <thead>
            <tr>
              <th>Input</th>
              <th>Latitude</th>
              <th>Longitude</th>
              <th>Match</th>
              <th>Source</th>
              <th>Label</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in results" :key="index" :class="getStatusClass(result)">
              <td>{{ result.input }}</td>
              <td>{{ result.coordinates?.lat?.toFixed(6) ?? "-" }}</td>
              <td>{{ result.coordinates?.lng?.toFixed(6) ?? "-" }}</td>
              <td>{{ formatConfidence(result.confidence) }}</td>
              <td>{{ result.source ?? "-" }}</td>
              <td class="label-cell">{{ result.label ?? "-" }}</td>
              <td>{{ result.error ?? "OK" }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 0;
  padding: 20px;
  background: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

header {
  margin-bottom: 24px;
}

header h1 {
  margin: 0 0 8px;
  color: #333;
}

header p {
  margin: 0;
  color: #666;
}

.input-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
}

textarea:focus {
  outline: none;
  border-color: #0066cc;
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.delay-control {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.delay-control input {
  width: 100px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.buttons {
  display: flex;
  gap: 8px;
}

button {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  background: #0066cc;
  color: white;
}

button:hover:not(:disabled) {
  background: #0055aa;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button.secondary {
  background: #666;
}

button.secondary:hover:not(:disabled) {
  background: #555;
}

button.small {
  padding: 6px 12px;
  font-size: 12px;
}

.error {
  margin-top: 16px;
  padding: 12px;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c00;
}

.stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.export-buttons {
  display: flex;
  gap: 8px;
}

.results {
  margin-top: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f9f9f9;
  font-weight: 500;
}

.label-cell {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tr.status-success {
  background: #f0fff0;
}

tr.status-warning {
  background: #fffbf0;
}

tr.status-low {
  background: #fff5f0;
}

tr.status-error {
  background: #fff0f0;
}
</style>
