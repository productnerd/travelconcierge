// Re-seeds climate data for regions that still have placeholder data
// Uses 5-second delays and aggressive backoff to avoid Open-Meteo rate limits

import { createClient } from '@supabase/supabase-js'
import { fetchClimate } from './fetchClimate.js'
import { getSeaTemp } from './fetchSeaTemp.js'

const SUPABASE_URL = 'https://knftyqkhampkqchoncel.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnR5cWtoYW1wa3FjaG9uY2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDg4MzYsImV4cCI6MjA2NzAyNDgzNn0.fugiTRvgoD3YqAZPQMV3R6Eu0Wx_9vgE6ZK8zjqFutg'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchWithRetry(lat: number, lon: number, countryCode: string): Promise<Awaited<ReturnType<typeof fetchClimate>>> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await fetchClimate(lat, lon, countryCode)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('429') && attempt < 5) {
        const delay = Math.min(attempt * 10000, 60000) // 10s, 20s, 30s, 40s
        console.log(`    Rate limited, waiting ${delay / 1000}s (attempt ${attempt}/5)...`)
        await sleep(delay)
      } else {
        throw err
      }
    }
  }
  throw new Error('Max retries exceeded')
}

async function main() {
  console.log('Re-seeding climate data (v2 with longer delays)...\n')

  // Find regions with placeholder data (temp=20, rain=50, sun=6)
  const { data: allRegions, error } = await supabase
    .from('travel_regions')
    .select('id, slug, name, country_code, centroid_lat, centroid_lon, is_coastal')
    .order('slug')

  if (error || !allRegions) {
    console.error('Failed to fetch regions:', error)
    return
  }

  const regionsToReseed = []
  for (const r of allRegions) {
    const { data: months } = await supabase
      .from('travel_region_months')
      .select('temp_avg_c, rainfall_mm, sunshine_hours_day')
      .eq('region_id', r.id)
      .eq('month', 1)
      .single()

    if (months && months.temp_avg_c === 20 && months.rainfall_mm === 50 && months.sunshine_hours_day === 6) {
      regionsToReseed.push(r)
    }
  }

  console.log(`Found ${regionsToReseed.length} regions still needing real climate data\n`)
  if (regionsToReseed.length === 0) {
    console.log('All regions have real data!')
    return
  }

  let success = 0
  let failed = 0

  for (let i = 0; i < regionsToReseed.length; i++) {
    const region = regionsToReseed[i]
    console.log(`[${i + 1}/${regionsToReseed.length}] ${region.name} (${region.slug})`)

    try {
      const climateData = await fetchWithRetry(region.centroid_lat, region.centroid_lon, region.country_code)
      console.log(`  Climate fetched: Jan temp=${climateData[0].temp_avg_c}°C`)

      const { data: existingMonths } = await supabase
        .from('travel_region_months')
        .select('id, month, busyness')
        .eq('region_id', region.id)
        .order('month')

      if (!existingMonths) {
        console.log(`  No existing months found, skipping`)
        failed++
        continue
      }

      for (const climate of climateData) {
        const existing = existingMonths.find(m => m.month === climate.month)
        if (!existing) continue

        const seaTemp = region.is_coastal ? getSeaTemp(region.slug, climate.month) : null

        await supabase
          .from('travel_region_months')
          .update({
            temp_avg_c: climate.temp_avg_c,
            temp_min_c: climate.temp_min_c,
            temp_max_c: climate.temp_max_c,
            rainfall_mm: climate.rainfall_mm,
            sunshine_hours_day: climate.sunshine_hours_day,
            humidity_pct: climate.humidity_pct,
            wind_speed_kmh: climate.wind_speed_kmh,
            cloud_cover_pct: climate.cloud_cover_pct,
            has_monsoon: climate.has_monsoon,
            sea_temp_c: seaTemp,
          })
          .eq('id', existing.id)
      }

      console.log(`  ✓ 12 months updated`)
      success++
    } catch (err) {
      console.error(`  ✗ Failed:`, err instanceof Error ? err.message : err)
      failed++
    }

    // 5 second delay between regions to respect rate limits
    await sleep(5000)
  }

  console.log(`\n========================================`)
  console.log(`Re-seed v2 complete: ${success} updated, ${failed} failed`)
  console.log(`========================================`)
}

main().catch(console.error)
