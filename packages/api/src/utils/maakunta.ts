import { readFileSync } from "fs"
import { join } from "path"

interface RegionFeature {
  type: "Feature"
  properties: {
    Maaku_ni1: string
    Maaku_ni2: string
  }
  geometry: {
    type: "Polygon" | "MultiPolygon"
    coordinates: number[][][] | number[][][][]
  }
}

interface RegionsGeoJSON {
  type: "FeatureCollection"
  features: RegionFeature[]
}

let regionsData: RegionsGeoJSON | null = null

function loadRegions(): RegionsGeoJSON {
  if (regionsData) return regionsData

  const filePath = join(import.meta.dir, "../../../../data/finnish_regions.geojson")
  const content = readFileSync(filePath, "utf-8")
  regionsData = JSON.parse(content) as RegionsGeoJSON
  return regionsData
}

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

function pointInMultiPolygon(point: [number, number], coordinates: number[][][] | number[][][][], type: "Polygon" | "MultiPolygon"): boolean {
  if (type === "Polygon") {
    const rings = coordinates as number[][][]
    if (!pointInPolygon(point, rings[0])) return false
    for (let i = 1; i < rings.length; i++) {
      if (pointInPolygon(point, rings[i])) return false
    }
    return true
  } else {
    const polygons = coordinates as number[][][][]
    for (const polygon of polygons) {
      if (pointInPolygon(point, polygon[0])) {
        let inHole = false
        for (let i = 1; i < polygon.length; i++) {
          if (pointInPolygon(point, polygon[i])) {
            inHole = true
            break
          }
        }
        if (!inHole) return true
      }
    }
    return false
  }
}

export function getMaakunta(lat: number, lng: number): string | null {
  const regions = loadRegions()
  const point: [number, number] = [lng, lat]

  for (const feature of regions.features) {
    if (pointInMultiPolygon(point, feature.geometry.coordinates, feature.geometry.type)) {
      return feature.properties.Maaku_ni1
    }
  }

  return null
}
