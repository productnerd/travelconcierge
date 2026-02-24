import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SUPABASE_URL = 'https://knftyqkhampkqchoncel.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnR5cWtoYW1wa3FjaG9uY2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDg4MzYsImV4cCI6MjA2NzAyNDgzNn0.fugiTRvgoD3YqAZPQMV3R6Eu0Wx_9vgE6ZK8zjqFutg'

const NE_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const OUTPUT_PATH = resolve(import.meta.dirname!, '../public/regions.geojson')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

interface Region {
  slug: string
  geojson_id: string
  country_code: string
  name: string
}

interface GeoJSONFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: {
    type: string
    coordinates: unknown
  }
}

interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// Round coordinates to 2 decimal places to reduce file size
function simplifyCoords(coords: unknown): unknown {
  if (typeof coords === 'number') {
    return Math.round(coords * 100) / 100
  }
  if (Array.isArray(coords)) {
    return coords.map(simplifyCoords)
  }
  return coords
}

// Create a simple circle polygon (~50km radius) for small islands not in Natural Earth
function createCirclePolygon(lat: number, lon: number): number[][][] {
  const points: number[][] = []
  const radiusDeg = 0.5 // ~50km at equator
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI
    points.push([
      Math.round((lon + radiusDeg * Math.cos(angle)) * 100) / 100,
      Math.round((lat + radiusDeg * Math.sin(angle)) * 100) / 100,
    ])
  }
  return [points]
}

// Centroid lookup for fallback polygon generation
const CENTROIDS: Record<string, [number, number]> = {
  MV: [3.2, 73.22],
}

function matchCountry(feature: GeoJSONFeature, countryCode: string): boolean {
  const props = feature.properties
  // Primary: ISO_A2
  if (props.ISO_A2 === countryCode) return true
  // Fallback: ISO_A2_EH (handles Western Sahara edge case and others)
  if (props.ISO_A2_EH === countryCode) return true
  // Fallback: first two chars of ADM0_A3 when ISO_A2 is -99
  if (props.ISO_A2 === '-99' && typeof props.ADM0_A3 === 'string') {
    if (props.ADM0_A3.substring(0, 2) === countryCode) return true
  }
  return false
}

async function main() {
  console.log('Generate GeoJSON for Travel Season Visualizer')
  console.log('==============================================\n')

  // 1. Fetch regions from Supabase
  console.log('Fetching regions from Supabase...')
  const { data: regions, error } = await supabase
    .from('travel_regions')
    .select('slug, geojson_id, country_code, name')

  if (error || !regions) {
    console.error('Failed to fetch regions:', error?.message)
    process.exit(1)
  }
  console.log(`  Found ${regions.length} regions\n`)

  // 2. Download Natural Earth GeoJSON
  console.log('Downloading Natural Earth 110m countries...')
  const response = await fetch(NE_URL)
  if (!response.ok) {
    console.error(`Failed to download: ${response.status} ${response.statusText}`)
    process.exit(1)
  }
  const neData: GeoJSONCollection = await response.json()
  console.log(`  Downloaded ${neData.features.length} country features\n`)

  // 3. Group regions by country_code
  const regionsByCountry = new Map<string, Region[]>()
  for (const region of regions as Region[]) {
    const existing = regionsByCountry.get(region.country_code) || []
    existing.push(region)
    regionsByCountry.set(region.country_code, existing)
  }

  // 4. Build output features
  const outputFeatures: GeoJSONFeature[] = []
  let matched = 0
  let fallback = 0

  for (const [countryCode, countryRegions] of regionsByCountry) {
    // Find the Natural Earth feature for this country
    const neFeature = neData.features.find(f => matchCountry(f, countryCode))

    if (!neFeature) {
      // Fallback: create a circle polygon for small island nations
      console.log(`  No NE match for ${countryCode} - creating fallback polygon`)
      const centroid = CENTROIDS[countryCode]
      if (!centroid) {
        console.warn(`  WARNING: No centroid for ${countryCode}, skipping`)
        continue
      }

      for (const region of countryRegions) {
        outputFeatures.push({
          type: 'Feature',
          properties: {
            NAME: region.name,
            geojson_id: region.geojson_id,
            region_slug: region.geojson_id,
            country_code: region.country_code,
          },
          geometry: {
            type: 'Polygon',
            coordinates: createCirclePolygon(centroid[0], centroid[1]),
          },
        })
        fallback++
        console.log(`    + ${region.geojson_id} (fallback circle)`)
      }
      continue
    }

    const neName = neFeature.properties.NAME as string

    // Duplicate the polygon once per region in this country
    for (const region of countryRegions) {
      outputFeatures.push({
        type: 'Feature',
        properties: {
          NAME: neName,
          geojson_id: region.geojson_id,
          region_slug: region.geojson_id,
          country_code: region.country_code,
        },
        geometry: {
          type: neFeature.geometry.type,
          coordinates: simplifyCoords(neFeature.geometry.coordinates),
        },
      })
      matched++
      console.log(`  + ${region.geojson_id} -> ${neName} (${countryCode})`)
    }
  }

  console.log(`\nMatched: ${matched}, Fallback: ${fallback}, Total features: ${outputFeatures.length}\n`)

  // 5. Write output
  const output: GeoJSONCollection = {
    type: 'FeatureCollection',
    features: outputFeatures,
  }

  const outputDir = resolve(OUTPUT_PATH, '..')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const json = JSON.stringify(output)
  writeFileSync(OUTPUT_PATH, json, 'utf-8')

  const sizeKB = (Buffer.byteLength(json, 'utf-8') / 1024).toFixed(1)
  console.log(`Written to: ${OUTPUT_PATH}`)
  console.log(`File size: ${sizeKB} KB`)
  console.log(`Features: ${outputFeatures.length}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
