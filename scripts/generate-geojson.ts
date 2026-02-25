import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { union } from '@turf/union'
import { simplify } from '@turf/simplify'
import { featureCollection, polygon, multiPolygon } from '@turf/helpers'

const SUPABASE_URL = 'https://knftyqkhampkqchoncel.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnR5cWtoYW1wa3FjaG9uY2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDg4MzYsImV4cCI6MjA2NzAyNDgzNn0.fugiTRvgoD3YqAZPQMV3R6Eu0Wx_9vgE6ZK8zjqFutg'

const NE_COUNTRIES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const NE_ADMIN1_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson'
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
const CENTROIDS: Record<string, [number, number]> = {
  MV: [3.2, 73.22],
  AD: [42.546, 1.602], LI: [47.166, 9.555], MC: [43.738, 7.425],
  SM: [43.942, 12.458], VA: [41.902, 12.453], MT: [35.937, 14.375],
  AG: [17.061, -61.796], BB: [13.194, -59.543], DM: [15.415, -61.371],
  GD: [12.116, -61.679], KN: [17.357, -62.783], LC: [13.909, -60.979],
  VC: [13.254, -61.197],
  CV: [16.002, -24.013], KM: [-11.875, 43.872], MU: [-20.348, 57.552],
  SC: [-4.679, 55.492], ST: [0.186, 6.613],
  FM: [6.916, 158.185], KI: [1.870, -157.363], MH: [7.131, 171.184],
  NR: [-0.522, 166.932], PW: [7.515, 134.583], TO: [-21.179, -175.198],
  TV: [-8.520, 179.198], WS: [-13.759, -171.762],
  BH: [26.066, 50.558], SG: [1.352, 103.820],
  PF: [-17.687, -149.406], AW: [12.509, -69.969], TC: [21.694, -71.798],
  CK: [-21.237, -159.778], FO: [61.892, -6.912], RE: [-21.115, 55.536],
  CW: [12.170, -68.984], GP: [16.265, -61.551], MQ: [14.641, -61.024],
  BM: [32.308, -64.751], PR: [18.221, -66.590],
}

// Region-level centroid overrides for sub-national island regions
// These get their own circle polygon instead of sharing the parent country polygon
const REGION_OVERRIDES: Record<string, [number, number]> = {
  'pt-azores-sao-miguel': [37.749, -25.668],
  'pt-azores-pico-faial': [38.468, -28.530],
  'pt-azores-flores': [39.451, -31.187],
  'pt-madeira': [32.651, -16.908],
  'es-canary': [28.291, -16.630],
  'es-balearic': [39.571, 2.654],
  'ec-galapagos': [-0.953, -90.966],
  'br-noronha': [-3.854, -32.424],
  'cl-easter': [-27.113, -109.350],
  'us-hawaii': [20.798, -156.331],
  'kr-jeju': [33.400, 126.570],
  'jp-okinawa-main': [26.335, 127.800],
  'jp-miyako-yaeyama': [24.340, 124.157],
  'ph-batanes': [20.449, 121.970],
  'id-lombok-gili': [-8.565, 116.351],
  'id-raja-ampat': [-0.230, 130.524],
  'my-langkawi': [6.350, 99.800],
  'gr-dodecanese': [36.435, 27.125],
  'gr-ionian': [39.620, 19.920],
  'gr-ne-aegean': [39.100, 26.300],
  'hr-islands': [43.172, 16.441],
  'it-aeolian': [38.560, 14.960],
  'hn-roatan': [16.320, -86.530],
  'fr-corsica': [42.039, 9.013],
  'it-sardinia': [40.121, 9.013],
}

// Force specific admin_1 provinces to specific regions (overrides centroid-based assignment)
// Key: "CC:admin1_name" → region geojson_id
const ADMIN1_FORCE: Record<string, string> = {
  'ZA:Western Cape': 'za-cape-town',
  'ZA:Northern Cape': 'za-cape-town',
}

// Get iso_a2 from an admin_1 feature (handles both upper/lowercase property names)
function getAdmin1CountryCode(f: GeoJSONFeature): string {
  return (f.properties.iso_a2 ?? f.properties.ISO_A2 ?? '') as string
}

// Squared distance between two points (for comparison only, no need for sqrt)
function distSq(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dlat = lat2 - lat1
  const dlon = lon2 - lon1
  return dlat * dlat + dlon * dlon
}

// Union multiple GeoJSON features into a single simplified feature
function unionFeatures(features: GeoJSONFeature[]): GeoJSONFeature | null {
  if (features.length === 0) return null
  if (features.length === 1) {
    // Still simplify single features
    return simplifyFeature(features[0])
  }

  try {
    const turfFeatures = features.map(f => {
      if (f.geometry.type === 'Polygon') {
        return polygon(f.geometry.coordinates as number[][][])
      } else if (f.geometry.type === 'MultiPolygon') {
        return multiPolygon(f.geometry.coordinates as number[][][][])
      }
      return null
    }).filter(Boolean) as ReturnType<typeof polygon>[]

    if (turfFeatures.length === 0) return null
    if (turfFeatures.length === 1) return simplifyFeature(features[0])

    const fc = featureCollection(turfFeatures)
    const result = union(fc)
    if (!result) return null

    // Simplify to reduce vertex count (~0.05 degrees ≈ 5km tolerance)
    const simplified = simplify(result, { tolerance: 0.05, highQuality: true })

    return {
      type: 'Feature',
      properties: {},
      geometry: simplified.geometry as GeoJSONFeature['geometry'],
    }
  } catch (e) {
    console.warn(`    Union failed: ${(e as Error).message}, using first feature`)
    return simplifyFeature(features[0])
  }
}

function simplifyFeature(f: GeoJSONFeature): GeoJSONFeature {
  try {
    let turfF
    if (f.geometry.type === 'Polygon') {
      turfF = polygon(f.geometry.coordinates as number[][][])
    } else if (f.geometry.type === 'MultiPolygon') {
      turfF = multiPolygon(f.geometry.coordinates as number[][][][])
    } else {
      return f
    }
    const simplified = simplify(turfF, { tolerance: 0.05, highQuality: true })
    return {
      type: 'Feature',
      properties: f.properties,
      geometry: simplified.geometry as GeoJSONFeature['geometry'],
    }
  } catch {
    return f
  }
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

  // 2. Download Natural Earth datasets
  console.log('Downloading Natural Earth 110m countries...')
  const neCountriesRes = await fetch(NE_COUNTRIES_URL)
  if (!neCountriesRes.ok) {
    console.error(`Failed to download countries: ${neCountriesRes.status}`)
    process.exit(1)
  }
  const neCountries: GeoJSONCollection = await neCountriesRes.json()
  console.log(`  Downloaded ${neCountries.features.length} country features`)

  console.log('Downloading Natural Earth 10m admin_1 states/provinces (~38MB)...')
  const neAdmin1Res = await fetch(NE_ADMIN1_URL)
  if (!neAdmin1Res.ok) {
    console.error(`Failed to download admin_1: ${neAdmin1Res.status}`)
    process.exit(1)
  }
  const neAdmin1: GeoJSONCollection = await neAdmin1Res.json()
  console.log(`  Downloaded ${neAdmin1.features.length} admin_1 features\n`)

  // 3. Build admin_1 lookup by country code
  const admin1ByCountry = new Map<string, GeoJSONFeature[]>()
  for (const f of neAdmin1.features) {
    const cc = getAdmin1CountryCode(f)
    if (!cc || cc === '-99') continue
    const arr = admin1ByCountry.get(cc) || []
    arr.push(f)
    admin1ByCountry.set(cc, arr)
  }
  console.log(`  Admin_1 data available for ${admin1ByCountry.size} countries\n`)

  // 4. Group regions by country_code
  const regionsByCountry = new Map<string, Region[]>()
  for (const region of regions as Region[]) {
    const existing = regionsByCountry.get(region.country_code) || []
    existing.push(region)
    regionsByCountry.set(region.country_code, existing)
  }

  // 5. Build output features
  const outputFeatures: GeoJSONFeature[] = []
  let countPolygon = 0
  let countAdmin1 = 0
  let countCircle = 0

  for (const [countryCode, countryRegions] of regionsByCountry) {
    // Find NE 110m country feature
    const neFeature =
      neCountries.features.find(f => f.properties.ISO_A2 === countryCode || f.properties.ISO_A2_EH === countryCode) ||
      neCountries.features.find(f => f.properties.ISO_A2 === '-99' && typeof f.properties.ADM0_A3 === 'string' && f.properties.ADM0_A3.substring(0, 2) === countryCode)

    if (!neFeature) {
      // No NE country polygon — use circle fallback (small island nations / microstates)
      const centroid = CENTROIDS[countryCode]
      if (!centroid) {
        console.warn(`  WARNING: No NE match and no centroid for ${countryCode}, skipping`)
        continue
      }
      for (const region of countryRegions) {
        outputFeatures.push({
          type: 'Feature',
          properties: { NAME: region.name, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
          geometry: { type: 'Polygon', coordinates: createCirclePolygon(centroid[0], centroid[1]) },
        })
        countCircle++
      }
      console.log(`  ${countryCode}: ${countryRegions.length} region(s) — circle fallback (no NE polygon)`)
      continue
    }

    // Handle region overrides first (island sub-regions get circles regardless)
    const nonOverrideRegions: Region[] = []
    for (const region of countryRegions) {
      const override = REGION_OVERRIDES[region.geojson_id]
      if (override) {
        outputFeatures.push({
          type: 'Feature',
          properties: { NAME: region.name, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
          geometry: { type: 'Polygon', coordinates: createCirclePolygon(override[0], override[1]) },
        })
        countCircle++
        console.log(`  ${countryCode}/${region.geojson_id}: circle (island override)`)
      } else {
        nonOverrideRegions.push(region)
      }
    }

    if (nonOverrideRegions.length === 0) continue

    if (nonOverrideRegions.length === 1) {
      // Single mainland region: use full NE 110m country polygon
      const region = nonOverrideRegions[0]
      outputFeatures.push({
        type: 'Feature',
        properties: { NAME: neFeature.properties.NAME as string, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
        geometry: { type: neFeature.geometry.type, coordinates: simplifyCoords(neFeature.geometry.coordinates) },
      })
      countPolygon++
      console.log(`  ${countryCode}/${region.geojson_id}: full country polygon`)
      continue
    }

    // Multi-region country: try admin_1 approach
    const admin1Features = admin1ByCountry.get(countryCode)
    if (!admin1Features || admin1Features.length === 0) {
      // No admin_1 data — use full country polygon for all regions (not ideal but better than nothing)
      console.warn(`  ${countryCode}: no admin_1 data for ${nonOverrideRegions.length} regions — using country polygon`)
      for (const region of nonOverrideRegions) {
        outputFeatures.push({
          type: 'Feature',
          properties: { NAME: region.name, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
          geometry: { type: neFeature.geometry.type, coordinates: simplifyCoords(neFeature.geometry.coordinates) },
        })
        countPolygon++
      }
      continue
    }

    // Assign each admin_1 feature to the closest region centroid
    const regionAdmin1Map = new Map<string, GeoJSONFeature[]>()
    for (const region of nonOverrideRegions) {
      regionAdmin1Map.set(region.geojson_id, [])
    }

    for (const a1 of admin1Features) {
      const a1Lat = (a1.properties.latitude ?? a1.properties.Latitude) as number | undefined
      const a1Lon = (a1.properties.longitude ?? a1.properties.Longitude) as number | undefined
      if (a1Lat == null || a1Lon == null) continue

      // Check for forced assignment override
      const a1Name = (a1.properties.name ?? a1.properties.NAME ?? '') as string
      const forceKey = `${countryCode}:${a1Name}`
      const forcedRegion = ADMIN1_FORCE[forceKey]
      if (forcedRegion && regionAdmin1Map.has(forcedRegion)) {
        regionAdmin1Map.get(forcedRegion)!.push(a1)
        continue
      }

      // Find closest region by centroid distance
      let closestRegion = nonOverrideRegions[0]
      let closestDist = Infinity
      for (const region of nonOverrideRegions) {
        const d = distSq(a1Lat, a1Lon, region.centroid_lat, region.centroid_lon)
        if (d < closestDist) {
          closestDist = d
          closestRegion = region
        }
      }

      regionAdmin1Map.get(closestRegion.geojson_id)!.push(a1)
    }

    // Build polygons per region
    for (const region of nonOverrideRegions) {
      const assigned = regionAdmin1Map.get(region.geojson_id)!
      if (assigned.length === 0) {
        // No admin_1 features assigned — circle fallback
        outputFeatures.push({
          type: 'Feature',
          properties: { NAME: region.name, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
          geometry: { type: 'Polygon', coordinates: createCirclePolygon(region.centroid_lat, region.centroid_lon, 1.5) },
        })
        countCircle++
        console.log(`  ${countryCode}/${region.geojson_id}: circle (no admin_1 assigned)`)
        continue
      }

      // Union assigned admin_1 features
      const unioned = unionFeatures(assigned)
      if (!unioned) {
        outputFeatures.push({
          type: 'Feature',
          properties: { NAME: region.name, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
          geometry: { type: 'Polygon', coordinates: createCirclePolygon(region.centroid_lat, region.centroid_lon, 1.5) },
        })
        countCircle++
        console.log(`  ${countryCode}/${region.geojson_id}: circle (union failed)`)
        continue
      }

      outputFeatures.push({
        type: 'Feature',
        properties: { NAME: region.name, geojson_id: region.geojson_id, region_slug: region.geojson_id, country_code: region.country_code },
        geometry: { type: unioned.geometry.type, coordinates: simplifyCoords(unioned.geometry.coordinates) },
      })
      countAdmin1++
      console.log(`  ${countryCode}/${region.geojson_id}: admin_1 union (${assigned.length} provinces)`)
    }
  }

  console.log(`\nCountry polygons: ${countPolygon}, Admin_1 unions: ${countAdmin1}, Circles: ${countCircle}`)
  console.log(`Total features: ${outputFeatures.length}\n`)

  // 6. Write output
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
