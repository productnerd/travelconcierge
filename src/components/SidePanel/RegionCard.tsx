import type { FilteredRegion } from '@/hooks/useRegions'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useFilterStore } from '@/store/filterStore'
import { busynessColor, busynessLabel, countryFlag } from '@/types'
import { scoreColor } from '@/utils/scoring'
import { COST_INDEX, costLabel } from '@/data/costIndex'

interface Props {
  region: FilteredRegion
}

export default function RegionCard({ region }: Props) {
  const selectRegion = useUIStore((s) => s.selectRegion)
  const selectedSlug = useUIStore((s) => s.selectedRegionSlug)
  const toggle = useShortlistStore((s) => s.toggle)
  const isShortlisted = useShortlistStore((s) => s.shortlistedSlugs.includes(region.slug))
  const colorMode = useFilterStore((s) => s.colorMode)

  return (
    <div
      onClick={() => selectRegion(region.slug)}
      className={`
        relative bg-cream border-2 rounded-xl p-3 cursor-pointer transition-colors
        ${selectedSlug === region.slug ? 'border-red' : 'border-off-black hover:border-red'}
      `}
    >
      {/* Heart button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggle(region.slug)
        }}
        className="absolute top-2 right-2 text-sm"
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
      <div className="flex items-center gap-2 mt-2">
        {/* Primary pill: depends on color mode */}
        {colorMode === 'busyness' ? (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-display font-bold rounded border border-off-black text-white"
            style={{ backgroundColor: busynessColor(region.avg_busyness) }}
          >
            {busynessLabel(region.avg_busyness)}
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-display font-bold rounded border border-off-black text-white"
            style={{ backgroundColor: scoreColor(colorMode === 'weather' ? region.weatherScore : region.bestTimeScore) }}
          >
            {colorMode === 'weather' ? `Weather ${region.weatherScore}` : `Best ${region.bestTimeScore}`}
          </span>
        )}

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
      </div>
    </div>
  )
}
