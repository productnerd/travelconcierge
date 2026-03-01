import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/store/filterStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useVisitedStore } from '@/store/visitedStore'
import type { RegionWithMonths } from '@/types'
import { goodWeatherScore, bestTimeScore, type ClimateInput } from '@/utils/scoring'
import { SAFETY_TIER, COUNTRY_CONTINENT, overallScore } from '@/data/costIndex'
import { seasonalPenalty } from '@/data/seasonalAdvisories'

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
  const visitedSlugs = useVisitedStore((s) => s.visitedSlugs)

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
      // Daytime-weighted avg: 75% max (day) + 25% min (night)
      const avgTemp = avg(selectedMonthData.map((m) =>
        m.temp_max_c !== null && m.temp_min_c !== null
          ? 0.75 * m.temp_max_c + 0.25 * m.temp_min_c
          : m.temp_avg_c
      ))
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
        temp_min_c: avgTempMin,
        temp_max_c: avgTempMax,
        rainfall_mm: avgRainfall,
        sunshine_hours_day: avgSunshine,
        cloud_cover_pct: avgCloud,
        humidity_pct: avgHumidity,
        wind_speed_kmh: avgWind,
        has_monsoon: hasMonsoon,
        sea_temp_c: avgSeaTemp,
        busyness: Math.round(avgBusyness),
        latitude: region.centroid_lat,
      }

      // Compute bestTimeScore per-month (for bloom accuracy) then average
      const perMonthScores = selectedMonthData.map((m) => {
        const mInput: ClimateInput = {
          temp_avg_c: m.temp_avg_c, temp_min_c: m.temp_min_c, temp_max_c: m.temp_max_c,
          rainfall_mm: m.rainfall_mm, sunshine_hours_day: m.sunshine_hours_day,
          cloud_cover_pct: m.cloud_cover_pct, humidity_pct: m.humidity_pct,
          wind_speed_kmh: m.wind_speed_kmh, has_monsoon: m.has_monsoon,
          sea_temp_c: m.sea_temp_c, busyness: m.busyness,
          month: m.month, latitude: region.centroid_lat,
        }
        return bestTimeScore(mInput, algorithmPreset, filters.selectedActivities, region.country_code)
      })
      const avgBestTime = perMonthScores.reduce((a, b) => a + b, 0) / perMonthScores.length

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
        weatherScore: Math.round(goodWeatherScore(climateInput, filters.selectedActivities)),
        bestTimeScore: Math.round(avgBestTime * seasonalPenalty(region.slug, filters.selectedMonths, filters.selectedActivities)),
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

      // Continent filter
      if (filters.selectedContinents.length > 0) {
        const continent = COUNTRY_CONTINENT[r.country_code]
        if (!continent || !filters.selectedContinents.includes(continent)) return false
      }

      // Safety filter — hide Risky (tier 3) and Avoid (tier 4)
      if (filters.hideRisky && (SAFETY_TIER[r.country_code] ?? 1) > 2) return false

      // Shortlist-only filter
      if (filters.showShortlistOnly && !shortlistedSlugs.includes(r.slug)) return false

      // Visited filters
      if (filters.hideVisited && visitedSlugs.includes(r.slug)) return false
      if (filters.showVisitedOnly && !visitedSlugs.includes(r.slug)) return false

      // Score-tier filter (from clickable legend)
      if (filters.hiddenScoreTiers.length > 0) {
        if (filters.colorMode === 'busyness') {
          if (filters.hiddenScoreTiers.includes(r.avg_busyness)) return false
        } else {
          const score = filters.colorMode === 'weather'
            ? r.weatherScore
            : filters.colorMode === 'bestTime'
            ? r.bestTimeScore
            : Math.round(overallScore(r.bestTimeScore, r.country_code, filters.selectedActivities))
          const tier = score >= 80 ? 80 : score >= 60 ? 60 : score >= 40 ? 40 : score >= 20 ? 20 : 10
          if (filters.hiddenScoreTiers.includes(tier)) return false
        }
      }

      return true
    })

  return { regions: filtered, allRegions, loading, error }
}
