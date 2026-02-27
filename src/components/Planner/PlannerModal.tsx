import { useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useFilterStore } from '@/store/filterStore'
import { bestTimeScore, type ClimateInput } from '@/utils/scoring'
import { countryFlag } from '@/types/index'
import { COUNTRY_CONTINENT, type Continent } from '@/data/costIndex'
import type { FilteredRegion } from '@/hooks/useRegions'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const CONTINENT_COLORS: Record<Continent, string> = {
  'Europe': '#4A90D9',
  'Asia': '#D94A7A',
  'Africa': '#D9A04A',
  'North America': '#4AD99A',
  'South America': '#9A4AD9',
  'Oceania': '#D96A4A',
}

interface Props {
  regions: FilteredRegion[]
}

export default function PlannerModal({ regions }: Props) {
  const plannerOpen = useUIStore((s) => s.plannerOpen)
  const togglePlanner = useUIStore((s) => s.togglePlanner)
  const shortlistedSlugs = useShortlistStore((s) => s.shortlistedSlugs)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)

  // Build month → regions mapping for shortlisted regions
  const monthMap = useMemo(() => {
    const map: Record<number, { slug: string; name: string; countryCode: string; score: number }[]> = {}
    for (let i = 1; i <= 12; i++) map[i] = []

    const shortlisted = regions.filter((r) => shortlistedSlugs.includes(r.slug))

    for (const region of shortlisted) {
      // Score all 12 months
      const monthScores = region.months.map((m) => {
        const input: ClimateInput = {
          temp_avg_c: m.temp_avg_c, temp_min_c: m.temp_min_c, temp_max_c: m.temp_max_c,
          rainfall_mm: m.rainfall_mm, sunshine_hours_day: m.sunshine_hours_day,
          cloud_cover_pct: m.cloud_cover_pct, humidity_pct: m.humidity_pct,
          wind_speed_kmh: m.wind_speed_kmh, has_monsoon: m.has_monsoon,
          sea_temp_c: m.sea_temp_c, busyness: m.busyness,
        }
        return { month: m.month, score: bestTimeScore(input, algorithmPreset, selectedActivities, region.country_code) }
      })

      // Top 3 months
      const top3 = monthScores.sort((a, b) => b.score - a.score).slice(0, 3)
      for (const { month, score } of top3) {
        map[month].push({ slug: region.slug, name: region.name, countryCode: region.country_code, score })
      }
    }

    return map
  }, [regions, shortlistedSlugs, algorithmPreset, selectedActivities])

  if (!plannerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={togglePlanner}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        className="relative bg-cream border-2 border-off-black rounded-xl max-w-[900px] w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-off-black">
          <h2 className="font-display font-bold text-sm uppercase tracking-wide">
            &#128197; Trip Planner
          </h2>
          <button
            onClick={togglePlanner}
            className="text-off-black/60 hover:text-off-black text-lg leading-none"
          >
            &#10005;
          </button>
        </div>

        {/* Calendar grid */}
        {shortlistedSlugs.length === 0 ? (
          <div className="px-4 py-12 text-center text-off-black/40 font-display text-xs uppercase">
            Heart some regions to see your trip calendar
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4">
            {MONTH_NAMES.map((name, i) => {
              const month = i + 1
              const entries = monthMap[month]
              return (
                <div key={month} className="border-b border-r border-off-black/20 p-2 min-h-[100px]">
                  <div className="font-display font-bold text-[10px] uppercase text-off-black/50 mb-1.5">
                    {name}
                  </div>
                  <div className="flex flex-col gap-1">
                    {entries.map((entry) => {
                      const continent = COUNTRY_CONTINENT[entry.countryCode] as Continent | undefined
                      const color = continent ? CONTINENT_COLORS[continent] : '#888'
                      return (
                        <div
                          key={entry.slug}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded border text-[10px] font-display font-bold"
                          style={{ borderColor: color, backgroundColor: color + '18' }}
                        >
                          <span>{countryFlag(entry.countryCode)}</span>
                          <span className="truncate uppercase" style={{ color }}>{entry.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        {shortlistedSlugs.length > 0 && (
          <div className="flex flex-wrap gap-3 px-4 py-2 border-t border-off-black/20">
            {Object.entries(CONTINENT_COLORS).map(([continent, color]) => {
              // Only show continents that appear in the calendar
              const hasEntries = Object.values(monthMap).some((entries) =>
                entries.some((e) => COUNTRY_CONTINENT[e.countryCode] === continent)
              )
              if (!hasEntries) return null
              return (
                <div key={continent} className="flex items-center gap-1 text-[9px] font-display uppercase text-off-black/60">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  {continent}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
