import { useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import { busynessColor, busynessLabel, countryFlag } from '@/types'
import { useFilterStore } from '@/store/filterStore'
import { scoreColor, goodWeatherScore, bestTimeScore, type ClimateInput } from '@/utils/scoring'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Props {
  region: FilteredRegion
}

export default function RegionDetail({ region }: Props) {
  const selectRegion = useUIStore((s) => s.selectRegion)
  const toggle = useShortlistStore((s) => s.toggle)
  const isShortlisted = useShortlistStore((s) => s.shortlistedSlugs.includes(region.slug))
  const selectedMonths = useFilterStore((s) => s.selectedMonths)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)

  // Sort months by month number
  const sortedMonths = [...region.months].sort((a, b) => a.month - b.month)

  // Compute per-month scores
  const monthlyScores = useMemo(() => {
    return sortedMonths.map((m) => {
      const input: ClimateInput = {
        temp_avg_c: m.temp_avg_c,
        rainfall_mm: m.rainfall_mm,
        sunshine_hours_day: m.sunshine_hours_day,
        cloud_cover_pct: m.cloud_cover_pct,
        humidity_pct: m.humidity_pct,
        wind_speed_kmh: m.wind_speed_kmh,
        has_monsoon: m.has_monsoon,
        sea_temp_c: m.sea_temp_c,
        busyness: m.busyness,
      }
      return {
        weather: Math.round(goodWeatherScore(input)),
        bestTime: Math.round(bestTimeScore(input, algorithmPreset)),
      }
    })
  }, [sortedMonths, algorithmPreset])

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={() => selectRegion(null)}
        className="flex items-center gap-1 text-xs font-display text-off-black/60 hover:text-off-black mb-3"
      >
        &#8592; Back to regions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-xl leading-tight">{region.name}</h2>
          <p className="text-sm text-off-black/60 mt-0.5">
            {countryFlag(region.country_code)} {region.country_name}
          </p>
        </div>

        <button
          onClick={() => toggle(region.slug)}
          className="text-2xl shrink-0"
        >
          {isShortlisted ? (
            <span className="text-red">&#10084;</span>
          ) : (
            <span className="text-off-black/30 hover:text-red">&#9825;</span>
          )}
        </button>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-display font-bold rounded-lg border-2 border-off-black text-white"
          style={{ backgroundColor: busynessColor(region.avg_busyness) }}
        >
          {busynessLabel(region.avg_busyness)}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-display font-bold rounded-lg border-2 border-off-black text-white"
          style={{ backgroundColor: scoreColor(region.weatherScore) }}
        >
          Weather {region.weatherScore}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-display font-bold rounded-lg border-2 border-off-black text-white"
          style={{ backgroundColor: scoreColor(region.bestTimeScore) }}
        >
          Best Time {region.bestTimeScore}
        </span>
      </div>

      {/* Description */}
      {region.description && (
        <p className="text-sm text-off-black/80 mt-3 leading-relaxed">{region.description}</p>
      )}

      {/* Climate stats */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-cream border-2 border-off-black rounded-lg p-2">
          <div className="text-[10px] font-display text-off-black/60">Avg Temp</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_temp_c !== null ? `${Math.round(region.avg_temp_c)}°C` : '—'}
          </div>
        </div>
        <div className="bg-cream border-2 border-off-black rounded-lg p-2">
          <div className="text-[10px] font-display text-off-black/60">Sunshine</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_sunshine_hours !== null ? `${region.avg_sunshine_hours}h` : '—'}
          </div>
        </div>
        <div className="bg-cream border-2 border-off-black rounded-lg p-2">
          <div className="text-[10px] font-display text-off-black/60">Rainfall</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_rainfall_mm !== null ? `${region.avg_rainfall_mm}mm` : '—'}
          </div>
        </div>
        <div className="bg-cream border-2 border-off-black rounded-lg p-2">
          <div className="text-[10px] font-display text-off-black/60">Sea Temp</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_sea_temp_c !== null ? `${region.avg_sea_temp_c}°C` : '—'}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="mt-4">
        <h3 className="font-display font-bold text-sm mb-2">Monthly Climate</h3>
        <div className="grid grid-cols-12 gap-0.5 text-center overflow-x-auto min-w-[300px]">
          {/* Headers */}
          {MONTH_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-[9px] font-display font-bold py-0.5 ${
                selectedMonths.includes(i + 1) ? 'text-red' : 'text-off-black/40'
              }`}
            >
              {label}
            </div>
          ))}

          {/* Temp row */}
          {sortedMonths.map((m) => (
            <div
              key={`temp-${m.month}`}
              className={`text-[9px] font-mono py-0.5 rounded ${
                selectedMonths.includes(m.month)
                  ? 'bg-red/10 font-bold'
                  : ''
              }`}
            >
              {m.temp_avg_c !== null ? `${Math.round(m.temp_avg_c)}°` : '—'}
            </div>
          ))}

          {/* Busyness row */}
          {sortedMonths.map((m) => (
            <div key={`busy-${m.month}`} className="flex justify-center py-0.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full border border-off-black"
                style={{ backgroundColor: busynessColor(m.busyness), opacity: 0.65 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Scores */}
      <div className="mt-4 space-y-3">
        {/* Crowds */}
        <div>
          <h3 className="font-display font-bold text-sm mb-1.5">Monthly Crowds</h3>
          <div className="grid grid-cols-12 gap-0.5">
            {sortedMonths.map((m) => {
              const pct = ((m.busyness - 1) / 4) * 100
              return (
                <div key={`crowd-${m.month}`} className="flex flex-col items-center gap-0.5">
                  <div className="w-full h-8 bg-off-black/5 rounded-sm relative overflow-hidden border border-off-black/10">
                    <div
                      className="absolute bottom-0 w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(pct, 8)}%`,
                        backgroundColor: busynessColor(m.busyness),
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className={`text-[8px] font-mono ${selectedMonths.includes(m.month) ? 'font-bold text-red' : 'text-off-black/50'}`}>
                    {m.busyness}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Weather Score */}
        <div>
          <h3 className="font-display font-bold text-sm mb-1.5">Monthly Weather</h3>
          <div className="grid grid-cols-12 gap-0.5">
            {sortedMonths.map((m, i) => {
              const score = monthlyScores[i].weather
              return (
                <div key={`weather-${m.month}`} className="flex flex-col items-center gap-0.5">
                  <div className="w-full h-8 bg-off-black/5 rounded-sm relative overflow-hidden border border-off-black/10">
                    <div
                      className="absolute bottom-0 w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(score, 4)}%`,
                        backgroundColor: scoreColor(score),
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className={`text-[8px] font-mono ${selectedMonths.includes(m.month) ? 'font-bold text-red' : 'text-off-black/50'}`}>
                    {score}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Best Time Score */}
        <div>
          <h3 className="font-display font-bold text-sm mb-1.5">Monthly Best Time</h3>
          <div className="grid grid-cols-12 gap-0.5">
            {sortedMonths.map((m, i) => {
              const score = monthlyScores[i].bestTime
              return (
                <div key={`best-${m.month}`} className="flex flex-col items-center gap-0.5">
                  <div className="w-full h-8 bg-off-black/5 rounded-sm relative overflow-hidden border border-off-black/10">
                    <div
                      className="absolute bottom-0 w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(score, 4)}%`,
                        backgroundColor: scoreColor(score),
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className={`text-[8px] font-mono ${selectedMonths.includes(m.month) ? 'font-bold text-red' : 'text-off-black/50'}`}>
                    {score}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Activities */}
      {region.activities.length > 0 && (
        <div className="mt-4">
          <h3 className="font-display font-bold text-sm mb-2">Activities</h3>
          <div className="flex flex-wrap gap-1">
            {region.activities.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 text-[10px] font-display bg-cream border-2 border-off-black rounded-lg capitalize"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Landscape */}
      {region.landscape_type.length > 0 && (
        <div className="mt-3">
          <h3 className="font-display font-bold text-sm mb-2">Landscape</h3>
          <div className="flex flex-wrap gap-1">
            {region.landscape_type.map((l) => (
              <span
                key={l}
                className="px-2 py-0.5 text-[10px] font-display bg-cream border-2 border-off-black rounded-lg capitalize"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Monsoon warning */}
      {region.has_monsoon && (
        <div className="mt-4 bg-amber/20 border-2 border-off-black rounded-lg p-2 text-xs font-display">
          Monsoon conditions possible during selected months
        </div>
      )}
    </div>
  )
}
