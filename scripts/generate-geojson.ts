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

// Centroid lookup for countries missing from Natural Earth 110m
// Format: [lat, lon]
const CENTROIDS: Record<string, [number, number]> = {
  // Previously existing
  MV: [3.2, 73.22],
  // European microstates
  AD: [42.546, 1.602],      // Andorra
  LI: [47.166, 9.555],      // Liechtenstein
  MC: [43.738, 7.425],      // Monaco
  SM: [43.942, 12.458],     // San Marino
  VA: [41.902, 12.453],     // Vatican City
  MT: [35.937, 14.375],     // Malta
  // Caribbean islands
  AG: [17.061, -61.796],    // Antigua & Barbuda
  BB: [13.194, -59.543],    // Barbados
  DM: [15.415, -61.371],    // Dominica
  GD: [12.116, -61.679],    // Grenada
  KN: [17.357, -62.783],    // Saint Kitts & Nevis
  LC: [13.909, -60.979],    // Saint Lucia
  VC: [13.254, -61.197],    // Saint Vincent & Grenadines
  // African islands
  CV: [16.002, -24.013],    // Cabo Verde
  KM: [-11.875, 43.872],    // Comoros
  MU: [-20.348, 57.552],    // Mauritius
  SC: [-4.679, 55.492],     // Seychelles
  ST: [0.186, 6.613],       // Sao Tome & Principe
  // Pacific islands
  FM: [6.916, 158.185],     // Micronesia
  KI: [1.870, -157.363],    // Kiribati (Tarawa)
  MH: [7.131, 171.184],     // Marshall Islands
  NR: [-0.522, 166.932],    // Nauru
  PW: [7.515, 134.583],     // Palau
  TO: [-21.179, -175.198],  // Tonga
  TV: [-8.520, 179.198],    // Tuvalu
  WS: [-13.759, -171.762],  // Samoa
  // Asian
  BH: [26.066, 50.558],     // Bahrain
  SG: [1.352, 103.820],     // Singapore
}

// Region-level centroid overrides for sub-national island regions
// These get their own circle polygon instead of sharing the parent country polygon
const REGION_OVERRIDES: Record<string, [number, number]> = {
  // Portugal - Atlantic islands
  'pt-azores-sao-miguel': [37.749, -25.668],
  'pt-azores-pico-faial': [38.468, -28.530],
  'pt-azores-flores': [39.451, -31.187],
  'pt-madeira': [32.651, -16.908],
  // Spain - island groups
  'es-islands': [28.291, -16.630],  // Canary Islands centroid
  // Ecuador - Galápagos
  'ec-galapagos': [-0.953, -90.966],
  // Brazil - Fernando de Noronha
  'br-noronha': [-3.854, -32.424],
  // Chile - Easter Island
  'cl-easter': [-27.113, -109.350],
  // Tanzania - Zanzibar
  'tz-zanzibar': [-6.165, 39.187],
  // USA - Hawaii
  'us-hawaii': [20.798, -156.331],
  // China - Hainan
  'cn-hainan': [19.200, 109.735],
  // South Korea - Jeju
  'kr-jeju': [33.400, 126.570],
  // Japan - Okinawa / Miyako-Yaeyama
  'jp-okinawa-main': [26.335, 127.800],
  'jp-miyako-yaeyama': [24.340, 124.157],
  // Philippines - remote islands
  'ph-batanes': [20.449, 121.970],
  'ph-siargao': [9.848, 126.045],
  'ph-palawan': [9.835, 118.738],
  // Indonesia - spread out archipelago
  'id-bali': [-8.340, 115.092],
  'id-lombok-gili': [-8.565, 116.351],
  'id-komodo-flores': [-8.548, 119.889],
  'id-raja-ampat': [-0.230, 130.524],
  'id-sulawesi-togean': [-0.355, 121.954],
  // Malaysia - island regions
  'my-langkawi': [6.350, 99.800],
  'my-borneo-sabah': [5.978, 116.075],
  'my-borneo-sarawak': [2.471, 111.846],
  'my-perhentian-east': [5.925, 102.731],
  // Vietnam - Phu Quoc
  'vn-phu-quoc': [10.227, 103.967],
  // Greece - island groups (distinct from mainland)
  'gr-crete': [35.240, 24.470],
  'gr-cyclades': [36.883, 25.133],
  'gr-dodecanese': [36.435, 27.125],
  'gr-ionian': [39.620, 19.920],
  // Italy - Sicily & Sardinia
  'it-sicily': [37.600, 14.015],
  // Madagascar - coast (Nosy Be)
  'mg-coast': [-13.333, 48.268],
  // Fiji - main island
  'fj-islands': [-17.771, 177.951],
  // New Zealand - distinct islands
  'nz-auckland': [-36.848, 174.763],
  'nz-fiordland': [-45.414, 167.718],
  'nz-queenstown': [-44.501, 168.749],
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
      // Check if this specific region has a centroid override (island sub-regions)
      const override = REGION_OVERRIDES[region.geojson_id]
      if (override) {
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
            coordinates: createCirclePolygon(override[0], override[1]),
          },
        })
        fallback++
        console.log(`  + ${region.geojson_id} (region override circle)`)
        continue
      }

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
