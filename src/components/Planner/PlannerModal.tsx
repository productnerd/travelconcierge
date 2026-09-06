import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useFilterStore } from '@/store/filterStore'
import { bestTimeScore, type ClimateInput } from '@/utils/scoring'
import { countryFlag } from '@/types/index'
import { COUNTRY_CONTINENT, type Continent } from '@/data/costIndex'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import type { RegionWithMonths } from '@/types'
import FriendToggles from '@/components/Social/FriendToggles'

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function isSouthernHemisphere(): boolean {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (/^(Australia|Antarctica)\//.test(tz)) return true
  if (/^Africa\/(Johannesburg|Maputo|Harare|Lusaka)/.test(tz)) return true
  if (/^Pacific\/(Auckland|Fiji|Chatham|Tongatapu)/.test(tz)) return true
  // DST fallback: Southern Hemisphere has smaller offset in January (summer/DST)
  return new Date(2024, 0, 1).getTimezoneOffset() < new Date(2024, 6, 1).getTimezoneOffset()
}

const south = isSouthernHemisphere()
const SEASONAL_ORDER = [
  { label: south ? 'Summer' : 'Winter', months: [12, 1, 2] },
  { label: south ? 'Autumn' : 'Spring', months: [3, 4, 5] },
  { label: south ? 'Winter' : 'Summer', months: [6, 7, 8] },
  { label: south ? 'Spring' : 'Autumn', months: [9, 10, 11] },
]

const CONTINENT_COLORS: Record<Continent, string> = {
  'Europe': '#4A90D9',
  'Asia': '#D94A7A',
  'Africa': '#D9A04A',
  'North America': '#4AD99A',
  'South America': '#9A4AD9',
  'Oceania': '#D96A4A',
}

interface Props {
  regions: RegionWithMonths[]
}

export default function PlannerModal({ regions }: Props) {
  const plannerOpen = useUIStore((s) => s.plannerOpen)
  const togglePlanner = useUIStore((s) => s.togglePlanner)
  const shortlistedSlugs = useShortlistStore((s) => s.shortlistedSlugs)
  const enabledFriendIds = useSocialStore((s) => s.enabledFriendIds)
  const friendData = useSocialStore((s) => s.friendData)
  const friends = useSocialStore((s) => s.friends)
  const profile = useAuthStore((s) => s.profile)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)

  // Combined shortlist: user + enabled friends
  const allShortlistedSlugs = (() => {
    const all = new Set(shortlistedSlugs)
    for (const fId of enabledFriendIds) friendData[fId]?.shortlistedSlugs.forEach((s) => all.add(s))
    return [...all]
  })()

  if (!plannerOpen) return null

  // Build per-region owner avatars (who shortlisted it)
  const getOwners = (slug: string): { emoji: string; color: string; name: string }[] => {
    if (enabledFriendIds.length === 0) return []
    const owners: { emoji: string; color: string; name: string }[] = []
    if (profile && shortlistedSlugs.includes(slug)) {
      owners.push({ emoji: profile.avatar_emoji, color: profile.avatar_color, name: 'You' })
    }
    for (const fId of enabledFriendIds) {
      const friend = friends.find((f) => f.userId === fId)
      const data = friendData[fId]
      if (friend && data?.shortlistedSlugs.includes(slug)) {
        owners.push({ emoji: friend.avatarEmoji, color: friend.avatarColor, name: friend.displayName })
      }
    }
    return owners
  }

  // Build month → regions mapping for shortlisted regions
  // (computed only when modal is open)
  const monthMap = (() => {
    const map: Record<number, { slug: string; name: string; countryCode: string; score: number }[]> = {}
    for (let i = 1; i <= 12; i++) map[i] = []

    const shortlisted = regions.filter((r) => allShortlistedSlugs.includes(r.slug))

    for (const region of shortlisted) {
      if (!region.travel_region_months?.length) continue
      // Score all 12 months
      const monthScores = region.travel_region_months.map((m) => {
        const input: ClimateInput = {
          temp_avg_c: m.temp_avg_c, temp_min_c: m.temp_min_c, temp_max_c: m.temp_max_c,
          rainfall_mm: m.rainfall_mm, sunshine_hours_day: m.sunshine_hours_day,
          cloud_cover_pct: m.cloud_cover_pct, humidity_pct: m.humidity_pct,
          wind_speed_kmh: m.wind_speed_kmh, has_monsoon: m.has_monsoon,
          sea_temp_c: m.sea_temp_c, busyness: m.busyness,
          month: m.month, latitude: region.centroid_lat,
        }
        return { month: m.month, score: bestTimeScore(input, algorithmPreset, selectedActivities, region.country_code) }
      })

      // Top 3 months
      const top3 = [...monthScores].sort((a, b) => b.score - a.score).slice(0, 3)
      for (const { month, score } of top3) {
        map[month].push({ slug: region.slug, name: region.name, countryCode: region.country_code, score })
      }
    }

    return map
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={togglePlanner} onKeyDown={(e) => { if (e.key === 'Escape') togglePlanner() }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="planner-title"
        className="relative bg-cream border-2 border-off-black rounded-xl max-w-[900px] w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: title + friend toggles */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-off-black/20">
          <h2 id="planner-title" className="font-display font-bold text-xs uppercase tracking-widest text-off-black/60">Trip Planner</h2>
          <FriendToggles />
        </div>

        {/* Calendar grid */}
        {allShortlistedSlugs.length === 0 ? (
          <div className="px-4 py-12 text-center text-off-black/40 font-display text-xs uppercase">
            Heart some regions to see your trip calendar
          </div>
        ) : (
          <div>
            {SEASONAL_ORDER.map((season) => (
              <div key={season.label}>
                <div className="px-3 py-1.5 bg-off-black/5 border-b border-off-black/20 font-display font-bold text-[10px] uppercase text-off-black/40 tracking-widest">
                  {season.label}
                </div>
                <div className="grid grid-cols-3">
                  {season.months.map((month) => {
                    const entries = monthMap[month]
                    return (
                      <div key={month} className="border-b border-r border-off-black/20 p-2 min-h-[90px]">
                        <div className="font-display font-bold text-[10px] uppercase text-off-black/50 mb-1.5">
                          {MONTH_NAMES[month]}
                        </div>
                        <div className="flex flex-col gap-1">
                          {entries.map((entry) => {
                            const continent = COUNTRY_CONTINENT[entry.countryCode] as Continent | undefined
                            const color = continent ? CONTINENT_COLORS[continent] : '#888'
                            const owners = getOwners(entry.slug)
                            return (
                              <div
                                key={entry.slug}
                                className="flex items-center gap-1.5 px-1.5 py-1 rounded border text-[10px] font-display font-bold"
                                style={{ borderColor: color, backgroundColor: color + '18' }}
                              >
                                <span>{countryFlag(entry.countryCode)}</span>
                                <span className="truncate uppercase text-off-black flex-1">{entry.name}</span>
                                {owners.length > 0 && (
                                  <span className="flex items-center -space-x-1 shrink-0">
                                    {owners.map((o) => (
                                      <span
                                        key={o.name}
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] border border-white/80"
                                        style={{ backgroundColor: o.color }}
                                        title={o.name}
                                      >
                                        {o.emoji}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        {allShortlistedSlugs.length > 0 && (
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
