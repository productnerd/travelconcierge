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
  centroid_lat: number
  centroid_lon: number
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

// Create a circle polygon with configurable radius (in degrees)
function createCirclePolygon(lat: number, lon: number, radiusDeg = 0.5): number[][][] {
  const points: number[][] = []
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
// Only for islands truly OUTSIDE their parent country's NE 110m polygon.
// Do NOT add islands already covered by NE (Sicily, Crete, Hainan, Borneo, etc.)
const REGION_OVERRIDES: Record<string, [number, number]> = {
  // Portugal - Atlantic islands (1000+ km from mainland)
  'pt-azores-sao-miguel': [37.749, -25.668],
  'pt-azores-pico-faial': [38.468, -28.530],
  'pt-azores-flores': [39.451, -31.187],
  'pt-madeira': [32.651, -16.908],
  // Spain - Canary Islands (1100 km from mainland)
  'es-islands': [28.291, -16.630],
  // Ecuador - Galápagos (1000 km offshore)
  'ec-galapagos': [-0.953, -90.966],
  // Brazil - Fernando de Noronha (350 km offshore)
  'br-noronha': [-3.854, -32.424],
  // Chile - Easter Island (3500 km offshore)
  'cl-easter': [-27.113, -109.350],
  // USA - Hawaii (3800 km from CONUS)
  'us-hawaii': [20.798, -156.331],
  // South Korea - Jeju (below KR polygon southern edge)
  'kr-jeju': [33.400, 126.570],
  // Japan - Okinawa / Miyako-Yaeyama (far south of JP polygons)
  'jp-okinawa-main': [26.335, 127.800],
  'jp-miyako-yaeyama': [24.340, 124.157],
  // Philippines - Batanes (north of PH polygon)
  'ph-batanes': [20.449, 121.970],
  // Indonesia - islands between NE polygons
  'id-lombok-gili': [-8.565, 116.351],
  'id-raja-ampat': [-0.230, 130.524],
  // Malaysia - Langkawi (west of peninsular polygon edge)
  'my-langkawi': [6.350, 99.800],
  // Greece - Dodecanese & Ionian (outside NE polygon edges)
  'gr-dodecanese': [36.435, 27.125],
  'gr-ionian': [39.620, 19.920],
}

// Extra island polygons missing from NE 110m that should mirror an existing region
const EXTRA_ISLANDS: { geojson_id: string; country_code: string; name: string; lat: number; lon: number }[] = [
  { geojson_id: 'fr-provence', country_code: 'FR', name: 'Corsica', lat: 42.039, lon: 9.013 },
]

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
    .select('slug, geojson_id, country_code, name, centroid_lat, centroid_lon')

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
    // Two-pass: prefer exact ISO match over ADM0_A3 prefix (avoids N. Cyprus shadowing Cyprus)
    const neFeature =
      neData.features.find(f => f.properties.ISO_A2 === countryCode || f.properties.ISO_A2_EH === countryCode) ||
      neData.features.find(f => f.properties.ISO_A2 === '-99' && typeof f.properties.ADM0_A3 === 'string' && f.properties.ADM0_A3.substring(0, 2) === countryCode)

    if (!neFeature) {
      // No NE polygon — use circle fallback (small island nations / microstates)
      const centroid = CENTROIDS[countryCode]
      if (!centroid) {
        console.warn(`  WARNING: No NE match and no centroid for ${countryCode}, skipping`)
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

      // Use full NE country polygon (works for single AND multi-region countries)
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

  // Add extra island features (islands missing from NE 110m that mirror an existing region)
  for (const island of EXTRA_ISLANDS) {
    outputFeatures.push({
      type: 'Feature',
      properties: {
        NAME: island.name,
        geojson_id: island.geojson_id,
        region_slug: island.geojson_id,
        country_code: island.country_code,
      },
      geometry: {
        type: 'Polygon',
        coordinates: createCirclePolygon(island.lat, island.lon),
      },
    })
    fallback++
    console.log(`  + ${island.name} -> ${island.geojson_id} (extra island circle)`)
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
