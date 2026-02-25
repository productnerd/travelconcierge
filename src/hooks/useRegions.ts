import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/store/filterStore'
import { useShortlistStore } from '@/store/shortlistStore'
import type { RegionWithMonths } from '@/types'
import { goodWeatherScore, bestTimeScore, type ClimateInput } from '@/utils/scoring'
import { SAFETY_TIER } from '@/data/costIndex'

export interface FilteredRegion {
  id: string
  slug: string
  name: string
  country_code: string
  country_name: string
  geojson_id: string
  description: string | null
  landscape_type: string[]
  activities: string[]
  cuisine_tags: string[]
  centroid_lat: number
  centroid_lon: number
  is_coastal: boolean
  // Averaged month data for selected months
  avg_busyness: number
  avg_temp_c: number | null
  avg_temp_min_c: number | null
  avg_temp_max_c: number | null
  avg_rainfall_mm: number | null
  avg_sunshine_hours: number | null
  avg_humidity_pct: number | null
  avg_sea_temp_c: number | null
  has_monsoon: boolean
  // Scores (0–100)
  weatherScore: number
  bestTimeScore: number
  // All month data
  months: RegionWithMonths['travel_region_months']
}

function avg(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null)
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}

export function useRegions() {
  const [allRegions, setAllRegions] = useState<RegionWithMonths[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const filters = useFilterStore()
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const shortlistedSlugs = useShortlistStore((s) => s.shortlistedSlugs)

  // Fetch all regions + all months once
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data, error: err } = await supabase
        .from('travel_regions')
        .select('*, travel_region_months(*)')

      if (err) {
        setError(err.message)
        setLoading(false)
        return
      }

      setAllRegions(data as RegionWithMonths[])
      setLoading(false)
    }
    load()
  }, [])

  // Apply client-side filtering
  const filtered: FilteredRegion[] = allRegions
    .map((region) => {
      // Get month data for selected months
      const selectedMonthData = region.travel_region_months.filter((m) =>
        filters.selectedMonths.includes(m.month)
      )

      if (selectedMonthData.length === 0) return null

      const avgBusyness = avg(selectedMonthData.map((m) => m.busyness)) ?? 3
      const avgTemp = avg(selectedMonthData.map((m) => m.temp_avg_c))
      const avgTempMin = avg(selectedMonthData.map((m) => m.temp_min_c))
      const avgTempMax = avg(selectedMonthData.map((m) => m.temp_max_c))
      const avgRainfall = avg(selectedMonthData.map((m) => m.rainfall_mm))
      const avgSunshine = avg(selectedMonthData.map((m) => m.sunshine_hours_day))
      const avgHumidity = avg(selectedMonthData.map((m) => m.humidity_pct))
      const avgSeaTemp = avg(selectedMonthData.map((m) => m.sea_temp_c))
      const hasMonsoon = selectedMonthData.some((m) => m.has_monsoon)

      const avgWind = avg(selectedMonthData.map((m) => m.wind_speed_kmh))
      const avgCloud = avg(selectedMonthData.map((m) => m.cloud_cover_pct))

      const climateInput: ClimateInput = {
        temp_avg_c: avgTemp,
        rainfall_mm: avgRainfall,
        sunshine_hours_day: avgSunshine,
        cloud_cover_pct: avgCloud,
        humidity_pct: avgHumidity,
        wind_speed_kmh: avgWind,
        has_monsoon: hasMonsoon,
        sea_temp_c: avgSeaTemp,
        busyness: Math.round(avgBusyness),
      }

      return {
        ...region,
        avg_busyness: Math.round(avgBusyness),
        avg_temp_c: avgTemp !== null ? Math.round(avgTemp * 10) / 10 : null,
        avg_temp_min_c: avgTempMin !== null ? Math.round(avgTempMin * 10) / 10 : null,
        avg_temp_max_c: avgTempMax !== null ? Math.round(avgTempMax * 10) / 10 : null,
        avg_rainfall_mm: avgRainfall !== null ? Math.round(avgRainfall) : null,
        avg_sunshine_hours: avgSunshine !== null ? Math.round(avgSunshine * 10) / 10 : null,
        avg_humidity_pct: avgHumidity !== null ? Math.round(avgHumidity) : null,
        avg_sea_temp_c: avgSeaTemp !== null ? Math.round(avgSeaTemp * 10) / 10 : null,
        has_monsoon: hasMonsoon,
        weatherScore: Math.round(goodWeatherScore(climateInput)),
        bestTimeScore: Math.round(bestTimeScore(climateInput, algorithmPreset)),
        months: region.travel_region_months,
      } as FilteredRegion
    })
    .filter((r): r is FilteredRegion => {
      if (!r) return false

      // Busyness filter
      if (r.avg_busyness > filters.busynessMax) return false

      // Temperature filter
      if (filters.tempMin !== null && r.avg_temp_c !== null && r.avg_temp_c < filters.tempMin) return false
      if (filters.tempMax !== null && r.avg_temp_c !== null && r.avg_temp_c > filters.tempMax) return false

      // Sunshine filter
      if (filters.sunshineMin !== null && r.avg_sunshine_hours !== null && r.avg_sunshine_hours < filters.sunshineMin) return false

      // Rainfall filter
      if (filters.rainfallMax !== null && r.avg_rainfall_mm !== null && r.avg_rainfall_mm > filters.rainfallMax) return false

      // Activity filter
      if (filters.selectedActivities.length > 0) {
        const hasActivity = filters.selectedActivities.some((a) => r.activities.includes(a))
        if (!hasActivity) return false
      }

      // Landscape filter
      if (filters.selectedLandscapes.length > 0) {
        const hasLandscape = filters.selectedLandscapes.some((l) => r.landscape_type.includes(l))
        if (!hasLandscape) return false
      }

      // Safety filter — hide Risky (tier 3) and Avoid (tier 4)
      if (filters.hideRisky && (SAFETY_TIER[r.country_code] ?? 1) > 2) return false

      // Shortlist-only filter
      if (filters.showShortlistOnly && !shortlistedSlugs.includes(r.slug)) return false

      return true
    })

  return { regions: filtered, allRegions, loading, error }
}
