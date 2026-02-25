import type { FilteredRegion } from '@/hooks/useRegions'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { countryFlag } from '@/types'
import { scoreColor } from '@/utils/scoring'
import { COST_INDEX, costLabel, safetyLabel, safetyMultiplier } from '@/data/costIndex'

interface Props {
  region: FilteredRegion
}

export default function RegionCard({ region }: Props) {
  const selectRegion = useUIStore((s) => s.selectRegion)
  const selectedSlug = useUIStore((s) => s.selectedRegionSlug)
  const toggle = useShortlistStore((s) => s.toggle)
  const isShortlisted = useShortlistStore((s) => s.shortlistedSlugs.includes(region.slug))

  const costTier = COST_INDEX[region.country_code] ?? 3
  const overallScore = Math.round(
    (region.bestTimeScore * 0.75 + (120 - costTier * 20) * 0.25) * safetyMultiplier(region.country_code)
  )

  return (
    <div
      onClick={() => selectRegion(region.slug)}
      className={`
        relative bg-cream border-2 rounded-xl p-6 cursor-pointer transition-colors
        ${selectedSlug === region.slug ? 'border-red' : 'border-off-black hover:border-red'}
      `}
    >
      {/* Heart button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggle(region.slug)
        }}
        className="absolute top-4 right-4 text-sm"
      >
        {isShortlisted ? (
          <span className="text-red">&#10084;</span>
        ) : (
          <span className="text-off-black/30 hover:text-red">&#9825;</span>
        )}
      </button>

      {/* Region name */}
      <h3 className="font-display font-bold text-sm pr-6 leading-tight">{region.name}</h3>

      {/* Country */}
      <p className="text-xs text-off-black/60 mt-0.5">
        {countryFlag(region.country_code)} {region.country_name}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-2.5 mt-3">
        {/* Seasonal score pill — always shows overall score */}
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-display font-bold rounded border border-off-black text-white"
          style={{ backgroundColor: scoreColor(overallScore) }}
          title="Combines weather, crowds, cost, and safety"
        >
          Seasonal {overallScore}
        </span>

        {/* Busyness */}
        <span className="text-[10px] font-mono text-off-black/70">{region.avg_busyness}/5</span>

        {/* Temp */}
        {region.avg_temp_c !== null && (
          <span className="text-[10px] font-mono">{Math.round(region.avg_temp_c)}°C</span>
        )}

        {/* Sunshine */}
        {region.avg_sunshine_hours !== null && (
          <span className="text-[10px] font-mono">{region.avg_sunshine_hours}h sun</span>
        )}

        {/* Cost */}
        <span className="text-[10px] font-mono text-off-black/50">
          {costLabel(COST_INDEX[region.country_code] ?? 3)}
        </span>

        {/* Safety advisory */}
        {safetyLabel(region.country_code) && (
          <span className={`text-[9px] font-display font-bold px-1 py-0.5 rounded ${
            safetyLabel(region.country_code) === 'Avoid' ? 'bg-red/20 text-red' :
            safetyLabel(region.country_code) === 'Risky' ? 'bg-orange-200 text-orange-700' :
            'bg-yellow-100 text-yellow-700'
          }`}>
            {safetyLabel(region.country_code)}
          </span>
        )}
      </div>
    </div>
  )
}
