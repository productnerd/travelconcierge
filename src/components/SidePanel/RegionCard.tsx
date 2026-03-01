import { useMemo } from 'react'
import type { FilteredRegion } from '@/hooks/useRegions'
import { useUIStore } from '@/store/uiStore'
import { useFilterStore } from '@/store/filterStore'
import { countryFlag } from '@/types'
import { scoreColor, bestTimeScore as computeBestTime, type ClimateInput } from '@/utils/scoring'
import { COST_INDEX, costLabel, safetyLabel, overallScore as computeOverall } from '@/data/costIndex'
import { cuisineScore } from '@/data/cuisineScore'
import { activeAdvisories } from '@/data/seasonalAdvisories'
import { useSocialStore } from '@/store/socialStore'
import { useAuthStore } from '@/store/authStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useVisitedStore } from '@/store/visitedStore'

interface Props {
  region: FilteredRegion
}

export default function RegionCard({ region }: Props) {
  const selectRegion = useUIStore((s) => s.selectRegion)
  const selectedSlug = useUIStore((s) => s.selectedRegionSlug)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)
  const selectedMonths = useFilterStore((s) => s.selectedMonths)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const enabledFriendIds = useSocialStore((s) => s.enabledFriendIds)
  const friends = useSocialStore((s) => s.friends)
  const friendData = useSocialStore((s) => s.friendData)
  const profile = useAuthStore((s) => s.profile)
  const myShortlisted = useShortlistStore((s) => s.shortlistedSlugs)
  const myVisited = useVisitedStore((s) => s.visitedSlugs)

  const overall = Math.round(computeOverall(region.bestTimeScore, region.country_code, selectedActivities))

  // Check if any selected month is in this region's top 3 best months
  const isBestMonth = useMemo(() => {
    const monthScores = region.months.map((m) => {
      const input: ClimateInput = {
        temp_avg_c: m.temp_avg_c, temp_min_c: m.temp_min_c, temp_max_c: m.temp_max_c,
        rainfall_mm: m.rainfall_mm, sunshine_hours_day: m.sunshine_hours_day,
        cloud_cover_pct: m.cloud_cover_pct, humidity_pct: m.humidity_pct,
        wind_speed_kmh: m.wind_speed_kmh, has_monsoon: m.has_monsoon,
        sea_temp_c: m.sea_temp_c, busyness: m.busyness,
      }
      return { month: m.month, score: computeBestTime(input, algorithmPreset, selectedActivities, region.country_code) }
    })
    const top3 = monthScores.sort((a, b) => b.score - a.score).slice(0, 3).map((m) => m.month)
    return selectedMonths.some((m) => top3.includes(m))
  }, [region.months, region.country_code, selectedMonths, algorithmPreset, selectedActivities])

  return (
    <div
      onClick={() => selectRegion(region.slug)}
      className={`
        relative bg-cream border rounded-xl p-4 cursor-pointer transition-colors
        ${selectedSlug === region.slug ? 'border-red' : 'border-off-black/30 hover:border-red'}
      `}
    >
      {/* Header row: name + avatars + best month */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-xs leading-tight uppercase">{region.name}</h3>
          <p className="text-xs text-off-black/60 mt-0.5">
            {countryFlag(region.country_code)} {region.country_name}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* User + Friend avatars (only when friends toggled on) */}
          {enabledFriendIds.length > 0 && (() => {
            const myHearted = myShortlisted.includes(region.slug)
            const myVisitedHere = myVisited.includes(region.slug)
            const avatars: { emoji: string; color: string; name: string; hearted: boolean; visited: boolean; key: string }[] = []
            if (profile && (myHearted || myVisitedHere)) {
              avatars.push({ emoji: profile.avatar_emoji, color: profile.avatar_color, name: 'You', hearted: myHearted, visited: myVisitedHere, key: 'me' })
            }
            for (const fId of enabledFriendIds) {
              const friend = friends.find((f) => f.userId === fId)
              const data = friendData[fId]
              if (!friend || !data) continue
              const hearted = data.shortlistedSlugs.includes(region.slug)
              const visited = data.visitedSlugs.includes(region.slug)
              if (hearted || visited) avatars.push({ emoji: friend.avatarEmoji, color: friend.avatarColor, name: friend.displayName, hearted, visited, key: fId })
            }
            if (avatars.length === 0) return null
            return avatars.map((a) => (
              <div key={a.key} className="flex items-center gap-0.5" title={`${a.name}: ${a.hearted ? '❤️' : ''} ${a.visited ? '✓' : ''}`}>
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-off-black/20"
                  style={{ backgroundColor: a.color }}
                >
                  {a.emoji}
                </span>
                <span className="text-[8px]">
                  {a.hearted && <span className="text-red">❤</span>}
                  {a.visited && <span className="text-green">✓</span>}
                </span>
              </div>
            ))
          })()}

          {isBestMonth && (
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-display font-bold rounded bg-green/15 text-green border border-green/30 uppercase">
              Best Month
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Weather score pill */}
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-display font-bold rounded border border-off-black text-white uppercase"
          style={{ backgroundColor: scoreColor(overall) }}
          title="Combines weather, crowds, cost, and safety"
        >
          Weather {overall}
        </span>

        {/* Temp — show high/low if available, fallback to avg */}
        {region.avg_temp_max_c !== null ? (
          <span className="text-[10px] font-mono">{Math.round(region.avg_temp_max_c)}°/{Math.round(region.avg_temp_min_c!)}°</span>
        ) : region.avg_temp_c !== null ? (
          <span className="text-[10px] font-mono">{Math.round(region.avg_temp_c)}°C</span>
        ) : null}

        {/* Cuisine score — when food selected */}
        {selectedActivities.includes('food') && (
          <span className="text-[10px] font-mono" title="TasteAtlas 2025 cuisine rating">
            🍽️ {(cuisineScore(region.country_code) / 10).toFixed(1)}
          </span>
        )}

        {/* Cost — bigger Euro signs */}
        <span className="text-sm font-mono text-off-black/60">
          {costLabel(COST_INDEX[region.country_code] ?? 3)}
        </span>

        {/* Spacer — push warnings to the right */}
        <span className="ml-auto" />

        {/* Safety advisory */}
        {safetyLabel(region.country_code) && (
          <span className={`text-[10px] font-display font-bold px-1 py-0.5 rounded uppercase ${
            safetyLabel(region.country_code) === 'Avoid' ? 'bg-red/20 text-red' :
            safetyLabel(region.country_code) === 'Risky' ? 'bg-orange-200 text-orange-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {safetyLabel(region.country_code)}
          </span>
        )}

        {/* Seasonal advisories */}
        {activeAdvisories(region.slug, selectedMonths, selectedActivities).map((adv) => (
          <span
            key={adv.label}
            className={`text-[10px] font-display font-bold px-1 py-0.5 rounded uppercase ${
              adv.penalty > 1
                ? 'bg-green/15 text-green'
                : adv.penalty < 0.5
                ? 'bg-red/15 text-red'
                : 'bg-amber/20 text-amber-700'
            }`}
            title={adv.label}
          >
            {adv.emoji} {adv.label}
          </span>
        ))}

      </div>

    </div>
  )
}
