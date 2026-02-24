import { createClient } from '@supabase/supabase-js'
import { REGIONS } from './regions.js'
import { busynessData } from './busyness.js'
import { fetchClimate } from './fetchClimate.js'
import { getSeaTemp } from './fetchSeaTemp.js'

const SUPABASE_URL = 'https://knftyqkhampkqchoncel.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnR5cWtoYW1wa3FjaG9uY2VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTQ0ODgzNiwiZXhwIjoyMDY3MDI0ODM2fQ.placeholder'

// We'll use the anon key for inserts since RLS allows it
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnR5cWtoYW1wa3FjaG9uY2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDg4MzYsImV4cCI6MjA2NzAyNDgzNn0.fugiTRvgoD3YqAZPQMV3R6Eu0Wx_9vgE6ZK8zjqFutg'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

const BUSYNESS_LABELS: Record<number, string> = {
  1: 'Very Quiet',
  2: 'Quiet',
  3: 'Moderate',
  4: 'Busy',
  5: 'Peak Season',
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function seedActivities() {
  const activities = [
    { slug: 'freediving', name: 'Freediving', icon: '🤿' },
    { slug: 'surfing', name: 'Surfing', icon: '🏄' },
    { slug: 'hiking', name: 'Hiking', icon: '🥾' },
    { slug: 'safari', name: 'Safari', icon: '🦁' },
    { slug: 'skiing', name: 'Skiing', icon: '⛷️' },
    { slug: 'beach', name: 'Beach', icon: '🏖️' },
    { slug: 'snorkeling', name: 'Snorkeling', icon: '🐠' },
    { slug: 'cultural', name: 'Cultural', icon: '🏛️' },
    { slug: 'wildlife', name: 'Wildlife', icon: '🐘' },
    { slug: 'food', name: 'Food', icon: '🍜' },
    { slug: 'nightlife', name: 'Nightlife', icon: '🎶' },
    { slug: 'adventure', name: 'Adventure', icon: '🧗' },
    { slug: 'diving', name: 'Diving', icon: '🤿' },
    { slug: 'cycling', name: 'Cycling', icon: '🚴' },
    { slug: 'kayaking', name: 'Kayaking', icon: '🛶' },
    { slug: 'climbing', name: 'Climbing', icon: '🧗' },
    { slug: 'photography', name: 'Photography', icon: '📷' },
  ]

  const { error } = await supabase
    .from('travel_activities')
    .upsert(activities, { onConflict: 'slug' })

  if (error) {
    console.error('Error seeding activities:', error)
  } else {
    console.log(`✓ Seeded ${activities.length} activities`)
  }
}

async function seedRegions() {
  let successCount = 0
  let errorCount = 0
  const total = REGIONS.length

  for (let i = 0; i < REGIONS.length; i++) {
    const region = REGIONS[i]
    console.log(`[${i + 1}/${total}] Processing ${region.name} (${region.country_name})...`)

    // 1. Insert region
    const { data: inserted, error: regionError } = await supabase
      .from('travel_regions')
      .upsert({
        slug: region.slug,
        name: region.name,
        country_code: region.country_code,
        country_name: region.country_name,
        geojson_id: region.geojson_id,
        description: region.description,
        landscape_type: region.landscape_type,
        activities: region.activities,
        cuisine_tags: region.cuisine_tags,
        centroid_lat: region.centroid_lat,
        centroid_lon: region.centroid_lon,
        is_coastal: region.is_coastal,
      }, { onConflict: 'slug' })
      .select('id')
      .single()

    if (regionError) {
      console.error(`  ✗ Error inserting region ${region.slug}:`, regionError.message)
      errorCount++
      continue
    }

    const regionId = inserted.id

    // 2. Fetch climate data from Open-Meteo
    let climateData
    try {
      climateData = await fetchClimate(region.centroid_lat, region.centroid_lon, region.country_code)
      console.log(`  ✓ Climate data fetched`)
    } catch (err) {
      console.error(`  ✗ Climate fetch failed for ${region.slug}:`, err)
      // Create placeholder data
      climateData = Array.from({ length: 12 }, (_, m) => ({
        month: m + 1,
        temp_avg_c: 20,
        temp_min_c: 15,
        temp_max_c: 25,
        rainfall_mm: 50,
        sunshine_hours_day: 6,
        humidity_pct: 60,
        wind_speed_kmh: 15,
        cloud_cover_pct: 50,
        has_monsoon: false,
      }))
    }

    // 3. Get busyness data
    const busyness = busynessData[region.slug]
    if (!busyness) {
      console.warn(`  ⚠ No busyness data for ${region.slug}, using defaults`)
    }

    // 4. Build monthly rows
    const monthRows = climateData.map((c) => {
      const busynessScore = busyness ? busyness[c.month - 1] : 3
      const seaTemp = region.is_coastal ? getSeaTemp(region.slug, c.month) : null

      return {
        region_id: regionId,
        month: c.month,
        busyness: busynessScore,
        busyness_label: BUSYNESS_LABELS[busynessScore] || 'Moderate',
        temp_avg_c: c.temp_avg_c,
        temp_min_c: c.temp_min_c,
        temp_max_c: c.temp_max_c,
        rainfall_mm: c.rainfall_mm,
        sunshine_hours_day: c.sunshine_hours_day,
        humidity_pct: c.humidity_pct,
        wind_speed_kmh: c.wind_speed_kmh,
        cloud_cover_pct: c.cloud_cover_pct,
        has_monsoon: c.has_monsoon,
        sea_temp_c: seaTemp,
        summary: null,
      }
    })

    // 5. Delete existing months for this region (for idempotent re-runs)
    await supabase
      .from('travel_region_months')
      .delete()
      .eq('region_id', regionId)

    // 6. Insert monthly data
    const { error: monthError } = await supabase
      .from('travel_region_months')
      .insert(monthRows)

    if (monthError) {
      console.error(`  ✗ Error inserting months for ${region.slug}:`, monthError.message)
      errorCount++
    } else {
      console.log(`  ✓ 12 months inserted`)
      successCount++
    }

    // Rate limit: 200ms between API calls
    await sleep(200)
  }

  console.log(`\n========================================`)
  console.log(`Seeding complete: ${successCount} regions OK, ${errorCount} errors`)
  console.log(`========================================`)
}

async function main() {
  console.log('Travel Season Visualizer — Seed Script')
  console.log('======================================\n')

  // Check connection
  const { count, error } = await supabase
    .from('travel_regions')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Cannot connect to Supabase:', error.message)
    process.exit(1)
  }

  console.log(`Connected to Supabase. Existing regions: ${count}\n`)

  await seedActivities()
  console.log('')
  await seedRegions()
}

main().catch(console.error)
