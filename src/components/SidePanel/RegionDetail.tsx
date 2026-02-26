import { useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import { busynessColor, busynessLabel, countryFlag } from '@/types'
import { useFilterStore } from '@/store/filterStore'
import { scoreColor, goodWeatherScore, bestTimeScore, estimateSnowCm, type ClimateInput } from '@/utils/scoring'
import { COST_INDEX, costLabel, skiCostLabel } from '@/data/costIndex'
import { cuisineScore } from '@/data/cuisineScore'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const BUDGET_LABELS: Record<number, string> = { 1: '$15–25/day', 2: '$25–50/day', 3: '$50–100/day', 4: '$100–200/day', 5: '$200+/day' }

interface Props {
  region: FilteredRegion
}

export default function RegionDetail({ region }: Props) {
  const selectRegion = useUIStore((s) => s.selectRegion)
  const toggle = useShortlistStore((s) => s.toggle)
  const isShortlisted = useShortlistStore((s) => s.shortlistedSlugs.includes(region.slug))
  const selectedMonths = useFilterStore((s) => s.selectedMonths)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)

  // Sort months by month number
  const sortedMonths = [...region.months].sort((a, b) => a.month - b.month)

  // Compute per-month scores
  const monthlyScores = useMemo(() => {
    return sortedMonths.map((m) => {
      const input: ClimateInput = {
        temp_avg_c: m.temp_avg_c,
        temp_min_c: m.temp_min_c,
        temp_max_c: m.temp_max_c,
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
        weather: Math.round(goodWeatherScore(input, selectedActivities)),
        bestTime: Math.round(bestTimeScore(input, algorithmPreset, selectedActivities)),
      }
    })
  }, [sortedMonths, algorithmPreset, selectedActivities])

  // Top 3 months by bestTime score
  const top3Months = useMemo(() => {
    const indexed = monthlyScores.map((s, i) => ({ score: s.bestTime, month: i + 1 }))
    return indexed.sort((a, b) => b.score - a.score).slice(0, 3)
  }, [monthlyScores])
  const top3Set = new Set(top3Months.map((m) => m.month))

  const costTier = COST_INDEX[region.country_code] ?? 3

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={() => selectRegion(null)}
        className="flex items-center gap-1 text-[10px] font-display text-off-black/60 hover:text-off-black mb-3 uppercase"
      >
        &#8592; Back to regions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-lg leading-tight uppercase">{region.name}</h2>
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
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-display font-bold rounded-lg border-2 border-off-black text-white uppercase"
          style={{ backgroundColor: busynessColor(region.avg_busyness) }}
        >
          {busynessLabel(region.avg_busyness)}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-display font-bold rounded-lg border-2 border-off-black text-white uppercase"
          style={{ backgroundColor: scoreColor(region.weatherScore) }}
        >
          Weather {region.weatherScore}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-display font-bold rounded-lg border-2 border-off-black text-white uppercase"
          style={{ backgroundColor: scoreColor(region.bestTimeScore) }}
        >
          Best Time {region.bestTimeScore}
        </span>
      </div>

      {/* Description */}
      {region.description && (
        <p className="text-sm text-off-black/80 mt-3 leading-relaxed">{region.description}</p>
      )}

      {/* Cuisine tags + score — when food activity selected */}
      {selectedActivities.includes('food') && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-display text-off-black/60">🍽️ Cuisine</span>
            <span
              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: scoreColor(cuisineScore(region.country_code)) }}
              title={`TasteAtlas 2025 cuisine rating: ${(cuisineScore(region.country_code) / 10).toFixed(1)}/10`}
            >
              {(cuisineScore(region.country_code) / 10).toFixed(1)}/10
            </span>
            <span className="text-[9px] text-off-black/30 italic">TasteAtlas 2025</span>
          </div>
          {region.cuisine_tags && region.cuisine_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {region.cuisine_tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-[10px] font-display bg-cream border border-off-black/20 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Climate stats */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60">Temp High / Low</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_temp_max_c !== null
              ? `${Math.round(region.avg_temp_max_c)}° / ${Math.round(region.avg_temp_min_c!)}°`
              : region.avg_temp_c !== null ? `${Math.round(region.avg_temp_c)}°C` : '—'}
          </div>
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60">Sunshine</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_sunshine_hours !== null ? `${region.avg_sunshine_hours}h` : '—'}
          </div>
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60">Rainfall</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_rainfall_mm !== null ? `${region.avg_rainfall_mm}mm` : '—'}
          </div>
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60">Sea Temp</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_sea_temp_c !== null ? `${region.avg_sea_temp_c}°C` : '—'}
          </div>
        </div>
      </div>

      {/* Cost & Best Months */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60">Cost</div>
          <div className="text-lg font-mono font-bold">{costLabel(costTier)}</div>
          <div className="text-[10px] font-display text-off-black/50">{BUDGET_LABELS[costTier]}</div>
          {selectedActivities.includes('skiing') && skiCostLabel(region.country_code) && (
            <div className="text-[10px] font-display text-sky-600 mt-0.5">❄️ {skiCostLabel(region.country_code)}</div>
          )}
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60">Best Months</div>
          <div className="flex flex-col gap-0.5 mt-0.5">
            {top3Months.map((m, i) => (
              <div key={m.month} className="flex items-center justify-between">
                <span className="text-sm font-display font-bold">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {MONTH_LABELS[m.month - 1]}
                </span>
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white"
                  style={{ backgroundColor: scoreColor(m.score) }}
                >
                  {m.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly table */}
      <div className="mt-4">
        <h3 className="font-display font-bold text-xs mb-2 uppercase">Monthly Climate</h3>
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
          <div className="col-span-12 text-[9px] text-off-black/40 mt-1 cursor-help" title="Daytime-weighted temperature (75% high + 25% low)">🌡️ Temp</div>
          {sortedMonths.map((m) => {
            const wt = m.temp_max_c !== null && m.temp_min_c !== null
              ? 0.75 * m.temp_max_c + 0.25 * m.temp_min_c
              : m.temp_avg_c
            return (
              <div
                key={`temp-${m.month}`}
                className={`text-[9px] font-mono py-0.5 rounded ${
                  selectedMonths.includes(m.month)
                    ? 'bg-red/10 font-bold'
                    : ''
                }`}
                title={wt !== null ? `${Math.round(wt)}°C` : undefined}
              >
                {wt !== null ? `${Math.round(wt)}°` : '—'}
              </div>
            )
          })}

          {/* Rainfall row */}
          <div className="col-span-12 text-[9px] text-off-black/40 mt-1 cursor-help" title="Monthly rainfall in millimeters. Red = heavy rain (>150mm)">🌧️ Rain</div>
          {sortedMonths.map((m) => (
            <div
              key={`rain-${m.month}`}
              className={`text-[9px] font-mono py-0.5 ${
                m.rainfall_mm !== null && m.rainfall_mm > 150
                  ? 'text-red font-bold'
                  : 'text-off-black/50'
              }`}
              title={m.rainfall_mm !== null ? `${Math.round(m.rainfall_mm)}mm rainfall` : undefined}
            >
              {m.rainfall_mm !== null ? `${Math.round(m.rainfall_mm)}` : '—'}
            </div>
          ))}

          {/* Humidity row */}
          <div className="col-span-12 text-[9px] text-off-black/40 mt-1 cursor-help" title="Average humidity percentage. Red = oppressive (>75%)">💧 Humidity</div>
          {sortedMonths.map((m) => (
            <div
              key={`hum-${m.month}`}
              className={`text-[9px] font-mono py-0.5 ${
                m.humidity_pct !== null && m.humidity_pct > 75
                  ? 'text-red font-bold'
                  : 'text-off-black/50'
              }`}
              title={m.humidity_pct !== null ? `${Math.round(m.humidity_pct)}% humidity` : undefined}
            >
              {m.humidity_pct !== null ? `${Math.round(m.humidity_pct)}%` : '—'}
            </div>
          ))}

          {/* Monsoon row — only if any month has monsoon */}
          {sortedMonths.some((m) => m.has_monsoon) && <>
            <div className="col-span-12 text-[9px] text-off-black/40 mt-1 cursor-help" title="Monsoon season: heavy sustained rainfall with flooding risk">⛈️ Monsoon</div>
            {sortedMonths.map((m) => (
              <div key={`monsoon-${m.month}`} className="text-[9px] py-0.5 text-center" title={m.has_monsoon ? 'Monsoon season' : ''}>
                {m.has_monsoon ? '⛈' : ''}
              </div>
            ))}
          </>}

          {/* Snow estimate row — only when skiing selected */}
          {selectedActivities.includes('skiing') && <>
            <div className="col-span-12 text-[9px] text-off-black/40 mt-1 cursor-help" title="Estimated snow depth based on temperature and precipitation">❄️ Snow</div>
            {sortedMonths.map((m) => {
              const snowCm = estimateSnowCm(m.temp_min_c, m.rainfall_mm)
              return (
                <div
                  key={`snow-${m.month}`}
                  className={`text-[9px] font-mono py-0.5 ${
                    snowCm > 30 ? 'text-sky-600 font-bold' : snowCm > 0 ? 'text-sky-400' : 'text-off-black/30'
                  }`}
                  title={snowCm > 0 ? `~${snowCm}cm estimated snow` : 'No snow expected'}
                >
                  {snowCm > 0 ? `${snowCm}` : '—'}
                </div>
              )
            })}
          </>}

          {/* Sea temp row — when beach/diving activities selected + coastal */}
          {(selectedActivities.includes('beach') || selectedActivities.includes('diving') || selectedActivities.includes('freediving')) && region.is_coastal && <>
            <div className="col-span-12 text-[9px] text-off-black/40 mt-1 cursor-help" title="Sea surface temperature">🌊 Sea</div>
            {sortedMonths.map((m) => (
              <div
                key={`sea-${m.month}`}
                className={`text-[9px] font-mono py-0.5 ${
                  m.sea_temp_c !== null && m.sea_temp_c >= 24 ? 'text-sky-600 font-bold' : 'text-off-black/50'
                }`}
                title={m.sea_temp_c !== null ? `${Math.round(m.sea_temp_c)}°C sea temp` : undefined}
              >
                {m.sea_temp_c !== null ? `${Math.round(m.sea_temp_c)}°` : '—'}
              </div>
            ))}
          </>}
        </div>
      </div>

      {/* Monthly Scores */}
      <div className="mt-4 space-y-3">
        {/* Weather Score */}
        <div>
          <h3 className="font-display font-bold text-xs mb-1.5 uppercase">Monthly Weather</h3>
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
                  <span className={`text-[9px] font-mono ${selectedMonths.includes(m.month) ? 'font-bold text-red' : 'text-off-black/50'}`}>
                    {score}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Crowds */}
        <div>
          <h3 className="font-display font-bold text-xs mb-1.5 uppercase">Monthly Crowds</h3>
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
                  <span className={`text-[9px] font-mono ${selectedMonths.includes(m.month) ? 'font-bold text-red' : 'text-off-black/50'}`}>
                    {m.busyness}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Best Time Score */}
        <div>
          <h3 className="font-display font-bold text-xs mb-1.5 uppercase">Best Time ™️</h3>
          <div className="grid grid-cols-12 gap-0.5">
            {sortedMonths.map((m, i) => {
              const score = monthlyScores[i].bestTime
              const isTop3 = top3Set.has(m.month)
              return (
                <div key={`best-${m.month}`} className="flex flex-col items-center gap-0.5">
                  <div
                    className={`w-full h-8 rounded-sm relative overflow-hidden ${
                      isTop3
                        ? 'bg-amber/15 border-2 border-amber'
                        : 'bg-off-black/5 border border-off-black/10'
                    }`}
                  >
                    <div
                      className="absolute bottom-0 w-full rounded-sm transition-all"
                      style={{
                        height: `${Math.max(score, 4)}%`,
                        backgroundColor: scoreColor(score),
                        opacity: isTop3 ? 0.9 : 0.7,
                      }}
                    />
                  </div>
                  <span className={`text-[9px] font-mono ${
                    isTop3
                      ? 'font-bold text-off-black'
                      : selectedMonths.includes(m.month) ? 'font-bold text-red' : 'text-off-black/50'
                  }`}>
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
          <h3 className="font-display font-bold text-xs mb-2 uppercase">Activities</h3>
          <div className="flex flex-wrap gap-1">
            {region.activities.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 text-[10px] font-display font-bold bg-cream border-2 border-off-black rounded-lg uppercase"
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
          <h3 className="font-display font-bold text-xs mb-2 uppercase">Landscape</h3>
          <div className="flex flex-wrap gap-1">
            {region.landscape_type.map((l) => (
              <span
                key={l}
                className="px-2 py-0.5 text-[10px] font-display font-bold bg-cream border-2 border-off-black rounded-lg uppercase"
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
