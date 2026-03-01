import { useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useVisitedStore } from '@/store/visitedStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import { busynessColor, countryFlag } from '@/types'
import { useFilterStore } from '@/store/filterStore'
import { scoreColor, goodWeatherScore, bestTimeScore, estimateSnowCm, weatherScoreBreakdown, bloomFactor, type ClimateInput } from '@/utils/scoring'
import { COST_INDEX, costLabel, skiCostLabel, overallScoreBreakdown } from '@/data/costIndex'
import { activeAdvisories, seasonalPenalty } from '@/data/seasonalAdvisories'
import { cuisineScore } from '@/data/cuisineScore'
import { getRegionDishes } from '@/data/regionalDishes'
import { BIODIVERSITY, biodiversityScore, biodiversityMetrics } from '@/data/biodiversity'
import { NATIVE_WILDLIFE, NATIVE_FLORA, NATIONAL_PARKS } from '@/data/wildlife'
import { MONTHLY_BRIEFS } from '@/data/monthlyBriefs'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const BUDGET_LABELS: Record<number, string> = { 1: '€15–25/day', 2: '€25–45/day', 3: '€45–95/day', 4: '€95–190/day', 5: '€190+/day' }
const ACTIVITY_LABEL: Record<string, string> = { food: 'good food' }

function Sparkline({ label, unit, values, selectedMonths, showLabels }: {
  label: string; unit: string; values: (number | null)[]; selectedMonths: number[]; showLabels?: boolean
}) {
  const nums = values.map((v) => v ?? 0)
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  const range = max - min || 1
  const pad = range * (showLabels ? 0.4 : 0.2)
  const yMin = min - pad
  const yMax = max + pad
  const W = 300
  const H = showLabels ? 60 : 42
  const toX = (i: number) => (i / 11) * W
  const toY = (v: number) => H - ((v - yMin) / (yMax - yMin)) * H

  const points = nums.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const areaPoints = `0,${H} ${points} ${W},${H}`

  return (
    <div>
      <div className="text-[9px] text-off-black/40 mb-0.5 cursor-help" title={`Monthly ${label} (${unit})`}>{label}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <polygon points={areaPoints} fill="currentColor" className="text-off-black/5" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-off-black/40" />
        {nums.map((v, i) => (
          <circle
            key={i}
            cx={toX(i)}
            cy={toY(v)}
            r={selectedMonths.includes(i + 1) ? 4 : 3}
            className={selectedMonths.includes(i + 1) ? 'fill-red' : 'fill-off-black/30'}
          >
            <title>{MONTH_LABELS[i]}: {values[i] !== null ? `${Math.round(values[i]!)}${unit}` : '—'}</title>
          </circle>
        ))}
        {showLabels && nums.map((v, i) => (
          <text
            key={`lbl-${i}`}
            x={toX(i)}
            y={toY(v) - 7}
            textAnchor="middle"
            fontSize="8"
            className={selectedMonths.includes(i + 1) ? 'fill-red' : 'fill-off-black/50'}
          >
            {values[i] !== null ? `${Math.round(values[i]!)}°` : ''}
          </text>
        ))}
      </svg>
      <div className="grid grid-cols-12 gap-0.5 text-center">
        {MONTH_LABELS.map((m, i) => (
          <span key={m} className={`text-[9px] font-display ${selectedMonths.includes(i + 1) ? 'font-bold text-red' : 'text-off-black/40'}`}>{m}</span>
        ))}
      </div>
    </div>
  )
}

function monsoonSeverity(months: FilteredRegion['months'], selectedMonths: number[]):
  { level: 'heavy' | 'moderate' | 'low'; label: string; icon: string } | null {
  const monsoonMonths = months.filter(m =>
    selectedMonths.includes(m.month) && m.has_monsoon
  )
  if (monsoonMonths.length === 0) return null

  const avgRain = monsoonMonths.reduce((sum, m) => sum + (m.rainfall_mm ?? 0), 0) / monsoonMonths.length

  if (avgRain > 300) return { level: 'heavy', label: 'HEAVY MONSOON RISK', icon: '⛈️' }
  if (avgRain > 150) return { level: 'moderate', label: 'MODERATE MONSOON RISK', icon: '🌧️' }
  return { level: 'low', label: 'LOW MONSOON RISK', icon: '🌦️' }
}

interface Props {
  region: FilteredRegion
}

export default function RegionDetail({ region }: Props) {
  const selectRegion = useUIStore((s) => s.selectRegion)
  const toggle = useShortlistStore((s) => s.toggle)
  const isShortlisted = useShortlistStore((s) => s.shortlistedSlugs.includes(region.slug))
  const toggleVisited = useVisitedStore((s) => s.toggle)
  const isVisited = useVisitedStore((s) => s.visitedSlugs.includes(region.slug))
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
        bestTime: Math.round(bestTimeScore(input, algorithmPreset, selectedActivities, region.country_code) * seasonalPenalty(region.slug, [m.month], selectedActivities)),
      }
    })
  }, [sortedMonths, algorithmPreset, selectedActivities, region.slug, region.country_code])

  // Top 3 months by bestTime score
  const top3Months = useMemo(() => {
    const indexed = monthlyScores.map((s, i) => ({ score: s.bestTime, month: i + 1 }))
    return indexed.sort((a, b) => b.score - a.score).slice(0, 3)
  }, [monthlyScores])
  const top3Set = new Set(top3Months.map((m) => m.month))

  const costTier = COST_INDEX[region.country_code] ?? 3

  // Best Time breakdown: weather sub-factors + crowds, averaged over selected months
  const bestTimeBd = useMemo(() => {
    const selectedMonthData = sortedMonths.filter((m) => selectedMonths.includes(m.month))
    if (selectedMonthData.length === 0) return null
    const breakdowns = selectedMonthData.map((m) => {
      const input: ClimateInput = {
        temp_avg_c: m.temp_avg_c, temp_min_c: m.temp_min_c, temp_max_c: m.temp_max_c,
        rainfall_mm: m.rainfall_mm, sunshine_hours_day: m.sunshine_hours_day,
        cloud_cover_pct: m.cloud_cover_pct, humidity_pct: m.humidity_pct,
        wind_speed_kmh: m.wind_speed_kmh, has_monsoon: m.has_monsoon,
        sea_temp_c: m.sea_temp_c, busyness: m.busyness,
      }
      return weatherScoreBreakdown(input, selectedActivities)
    })
    // Average weather factors
    const avgFactors = breakdowns[0].factors.map((f, i) => ({
      ...f,
      score: Math.round(breakdowns.reduce((sum, b) => sum + b.factors[i].score, 0) / breakdowns.length),
    }))
    // Crowds: busyness → quietness → 0-100 score (1→100, 5→20)
    const avgBusyness = selectedMonthData.reduce((s, m) => s + m.busyness, 0) / selectedMonthData.length
    const crowdScore = Math.round(Math.max(1 - (avgBusyness - 1) * 0.2, 0.2) * 100)
    // Collect penalties
    const penaltyMap = new Map<string, number>()
    for (const b of breakdowns) {
      for (const p of b.penalties) {
        const existing = penaltyMap.get(p.label)
        if (existing === undefined || p.value < existing) penaltyMap.set(p.label, p.value)
      }
    }
    // Flora & Fauna — biodiversity score (always computed for display)
    const hasWater = selectedActivities.some(a => ['diving', 'freediving', 'beach'].includes(a))
    const hasHiking = selectedActivities.includes('hiking')
    const floraFaunaActive = hasWater || hasHiking
    let floraFaunaScore = 50
    const bio = BIODIVERSITY[region.country_code]
    if (bio) {
      if (hasWater && bio.marine !== undefined) floraFaunaScore = bio.marine
      else if (hasHiking) floraFaunaScore = bio.protected !== undefined ? Math.round(bio.index * 0.6 + bio.protected * 0.4) : bio.index
      else floraFaunaScore = bio.index
    }
    // Bloom/Lush — seasonal vegetation score (always computed for display)
    const bloomScores = selectedMonthData.map(m => {
      const bf = bloomFactor(m.month, region.centroid_lat, m.temp_avg_c, m.rainfall_mm)
      return Math.round(((bf - 0.96) / 0.08) * 100)
    })
    const bloomScore = Math.round(bloomScores.reduce((a, b) => a + b, 0) / bloomScores.length)
    return {
      factors: avgFactors,
      crowdScore,
      floraFaunaScore,
      floraFaunaActive,
      bloomScore,
      penalties: Array.from(penaltyMap.entries()).map(([label, value]) => ({ label, value })),
      finalScore: region.bestTimeScore,
    }
  }, [sortedMonths, selectedMonths, selectedActivities, region.bestTimeScore, region.country_code])

  // Overall score breakdown
  const overallBd = useMemo(() => {
    return overallScoreBreakdown(region.bestTimeScore, region.country_code, selectedActivities)
  }, [region.bestTimeScore, region.country_code, selectedActivities])

  return (
    <div className="p-4">
      {/* Back button */}
      <button
        onClick={() => selectRegion(null)}
        className="flex items-center gap-1 text-[10px] font-display text-off-black/60 hover:text-off-black mb-3 uppercase"
      >
        &#8592; Back to regions
      </button>

      {/* Monsoon warning */}
      {(() => {
        const severity = monsoonSeverity(region.months, selectedMonths)
        if (!severity) return null
        const style = severity.level === 'heavy'
          ? 'bg-red/15 border-red/50'
          : severity.level === 'moderate'
          ? 'bg-amber/20 border-amber/50'
          : 'bg-amber/10 border-amber/30'
        return (
          <div className={`${style} border-2 rounded-lg p-2 text-xs font-display font-bold mb-3 uppercase`}>
            {severity.icon} {severity.label}
          </div>
        )
      })()}

      {/* Seasonal advisory banners */}
      {activeAdvisories(region.slug, selectedMonths, selectedActivities).map((adv) => {
        const style = adv.penalty > 1
          ? 'bg-green/15 border-green/30'
          : adv.penalty < 0.5
          ? 'bg-red/15 border-red/50'
          : 'bg-amber/20 border-amber/50'
        return (
          <div
            key={adv.label}
            className={`${style} border-2 rounded-lg p-2 text-xs font-display font-bold mb-3 uppercase`}
          >
            {adv.emoji} {adv.label}
          </div>
        )
      })}

      {/* Best month banner */}
      {selectedMonths.some((m) => top3Set.has(m)) && (
        <div className="bg-green/15 border-2 border-green/30 rounded-lg p-2 text-xs font-display font-bold mb-3 uppercase">
          ✨ One of the best months to visit
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-bold text-lg leading-tight uppercase">{region.name}</h2>
          <p className="text-sm text-off-black/60 mt-0.5">
            {countryFlag(region.country_code)} {region.country_name}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { if (!isVisited) toggleVisited(region.slug) }}
            title={isVisited ? 'Visited' : 'Mark as visited'}
            className="w-8 h-8 flex items-center justify-center text-xl"
          >
            {isVisited ? (
              <span className="text-green">&#10003;</span>
            ) : (
              <span className="text-off-black/30 hover:text-green">&#9744;</span>
            )}
          </button>
          <button
            onClick={() => toggle(region.slug)}
            className="w-8 h-8 flex items-center justify-center text-xl"
          >
            {isShortlisted ? (
              <span className="text-red">&#10084;</span>
            ) : (
              <span className="text-off-black/30 hover:text-red">&#9825;</span>
            )}
          </button>
        </div>
      </div>

      {/* Description */}
      {region.description && (
        <p className="text-xs text-off-black/80 mt-3 leading-relaxed">{region.description}</p>
      )}

      {/* Monthly briefs (collapsible) */}
      {selectedMonths.map((monthNum) => {
        const brief = MONTHLY_BRIEFS[region.slug]?.[monthNum]
        if (!brief) return null
        return (
          <details key={monthNum} className="mt-3 group">
            <summary className="font-display font-bold text-xs uppercase text-off-black cursor-pointer list-none flex items-center gap-1.5 select-none">
              <span className="text-[10px] text-off-black/40 transition-transform group-open:rotate-90">&#9654;</span>
              {region.name} in {MONTH_NAMES[monthNum]}
            </summary>
            <p className="text-xs text-off-black/70 leading-relaxed mt-1">{brief}</p>
          </details>
        )
      })}

      {/* Dual score breakdown: Overall (donut, left) + Best Time (bars, right) */}
      {bestTimeBd && (
        <div className="mt-4 grid grid-cols-[120px_1fr] gap-3">
          {/* Left: Overall score donut */}
          <div className="flex flex-col items-center">
            <h3 className="font-display font-bold text-[10px] uppercase text-off-black/50 mb-2">Overall Score</h3>
            {/* Partial donut — only finalScore% filled, segments within */}
            {(() => {
              const filledDeg = (overallBd.finalScore / 100) * 360
              const segments = overallBd.factors
              // Distinct colors per factor: darken/lighten scoreColor
              const segmentColor = (hex: string, shift: number) => {
                const r = parseInt(hex.slice(1, 3), 16)
                const g = parseInt(hex.slice(3, 5), 16)
                const b = parseInt(hex.slice(5, 7), 16)
                const adj = shift > 0
                  ? (c: number) => Math.round(c + (255 - c) * shift)
                  : (c: number) => Math.round(c * (1 + shift))
                return `#${[r, g, b].map(c => Math.max(0, Math.min(255, adj(c))).toString(16).padStart(2, '0')).join('')}`
              }
              const FACTOR_SHIFT: Record<string, number> = { bestTime: -0.15, cost: 0.35, cuisine: 0.15 }
              let cumulativeDeg = 0
              const stops = segments.map((f) => {
                const start = cumulativeDeg
                const end = cumulativeDeg + f.weight * filledDeg
                cumulativeDeg = end
                const color = segmentColor(scoreColor(f.score), FACTOR_SHIFT[f.key] ?? 0)
                return `${color} ${start}deg ${end}deg`
              })
              stops.push(`transparent ${cumulativeDeg}deg 360deg`)
              return (
                <div className="relative" style={{ width: 88, height: 88 }}>
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: `conic-gradient(${stops.join(', ')})` }}
                  />
                  {/* Track ring for empty portion */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(transparent 0deg ${cumulativeDeg}deg, rgba(0,0,0,0.06) ${cumulativeDeg}deg 360deg)` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-cream flex flex-col items-center justify-center">
                      <span className="text-lg font-mono font-bold leading-none">{overallBd.finalScore}</span>
                      <span className="text-[7px] font-display text-off-black/50 uppercase">/100</span>
                    </div>
                  </div>
                </div>
              )
            })()}
            {/* Legend — factor scores as /100 */}
            {(() => {
              const segmentColor = (hex: string, shift: number) => {
                const r = parseInt(hex.slice(1, 3), 16)
                const g = parseInt(hex.slice(3, 5), 16)
                const b = parseInt(hex.slice(5, 7), 16)
                const adj = shift > 0
                  ? (c: number) => Math.round(c + (255 - c) * shift)
                  : (c: number) => Math.round(c * (1 + shift))
                return `#${[r, g, b].map(c => Math.max(0, Math.min(255, adj(c))).toString(16).padStart(2, '0')).join('')}`
              }
              const FACTOR_SHIFT: Record<string, number> = { bestTime: -0.15, cost: 0.35, cuisine: 0.15 }
              return (
                <div className="mt-1.5 w-full space-y-0.5">
                  {overallBd.factors.map((f) => (
                    <div key={f.key} className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: segmentColor(scoreColor(f.score), FACTOR_SHIFT[f.key] ?? 0) }} />
                        <span className="text-[8px] font-display text-off-black/60">{f.label}</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-off-black/60">{f.score}/100</span>
                    </div>
                  ))}
                  {overallBd.safety.multiplier < 1 && (
                    <div className="text-[8px] font-display font-bold text-red uppercase">
                      ⚠️ Safety −{Math.round((1 - overallBd.safety.multiplier) * 100)}%
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Right: Best Time Score breakdown bars */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-display font-bold text-[10px] uppercase text-off-black/50">Best Time Score</h3>
              <span
                className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-display font-bold rounded border-2 border-off-black text-white uppercase"
                style={{ backgroundColor: scoreColor(bestTimeBd.finalScore) }}
              >
                {bestTimeBd.finalScore}/100
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {bestTimeBd.factors.map((f) => (
                <div key={f.key} className="flex items-center gap-1.5">
                  <span className="text-[8px] font-display font-bold uppercase text-off-black/60 w-14 shrink-0">{f.label}</span>
                  <div className="flex-1 h-1.5 bg-off-black/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${f.score}%`, backgroundColor: scoreColor(f.score) }} />
                  </div>
                  <span className="text-[8px] font-mono font-bold text-off-black/60 w-5 text-right">{f.score}</span>
                </div>
              ))}
              {/* Crowds bar — brown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-display font-bold uppercase text-off-black/60 w-14 shrink-0">Crowds</span>
                <div className="flex-1 h-1.5 bg-off-black/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${bestTimeBd.crowdScore}%`, backgroundColor: bestTimeBd.crowdScore >= 70 ? '#78501a' : bestTimeBd.crowdScore >= 40 ? '#a67a4b' : '#c9a87e' }} />
                </div>
                <span className="text-[8px] font-mono font-bold text-off-black/60 w-5 text-right">{bestTimeBd.crowdScore}</span>
              </div>
              {/* Bloom bar — pink with tooltip */}
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-display font-bold uppercase text-off-black/60 w-14 shrink-0 flex items-center gap-0.5">
                  Bloom
                  <span className="relative group cursor-help">
                    <span className="inline-flex items-center justify-center w-2.5 h-2.5 rounded-full bg-off-black/15 text-off-black/50 text-[6px] font-bold leading-none">?</span>
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-44 p-2 bg-off-black text-cream text-[11px] normal-case leading-snug rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                      Seasonal vegetation lushness — how green and in-bloom the landscape is based on temperature, rainfall, and latitude.
                    </span>
                  </span>
                </span>
                <div className="flex-1 h-1.5 bg-off-black/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${bestTimeBd.bloomScore}%`, backgroundColor: bestTimeBd.bloomScore >= 70 ? '#d63384' : bestTimeBd.bloomScore >= 40 ? '#e685b5' : '#f0b8d4' }} />
                </div>
                <span className="text-[8px] font-mono font-bold text-off-black/60 w-5 text-right">{bestTimeBd.bloomScore}</span>
              </div>
            </div>
            {bestTimeBd.penalties.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {bestTimeBd.penalties.map((p) => (
                  <span key={p.label} className="text-[8px] font-display font-bold text-red uppercase">
                    ⚠️ {p.label} −{Math.round((1 - p.value) * 100)}%
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Climate stats */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60 uppercase">Temp High / Low</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_temp_max_c !== null
              ? `${Math.round(region.avg_temp_max_c)}° / ${Math.round(region.avg_temp_min_c!)}°`
              : region.avg_temp_c !== null ? `${Math.round(region.avg_temp_c)}°C` : '—'}
          </div>
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60 uppercase">Sunshine</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_sunshine_hours !== null ? `${region.avg_sunshine_hours}h` : '—'}
          </div>
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60 uppercase">Rainfall</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_rainfall_mm !== null ? `${region.avg_rainfall_mm}mm` : '—'}
          </div>
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60 uppercase">Sea Temp</div>
          <div className="text-lg font-mono font-bold">
            {region.avg_sea_temp_c !== null ? `${region.avg_sea_temp_c}°C` : '—'}
          </div>
        </div>
      </div>

      {/* Cost & Best Months */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60 uppercase">Cost</div>
          <div className="text-xl font-mono font-bold">{costLabel(costTier)}</div>
          <div className="text-[10px] font-display text-off-black/50">{BUDGET_LABELS[costTier]}</div>
          {selectedActivities.includes('skiing') && skiCostLabel(region.country_code) && (
            <div className="text-[10px] font-display text-sky-600 mt-0.5">❄️ {skiCostLabel(region.country_code)}</div>
          )}
        </div>
        <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1">
          <div className="text-[10px] font-display text-off-black/60 uppercase">Recommended Months</div>
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

      {/* Local Cuisine */}
      <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1.5 mt-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-display text-off-black/60">🍽️ Local Cuisine</span>
          <span
            className="text-xs font-mono font-bold px-2 py-1 rounded text-white"
            style={{ backgroundColor: scoreColor(cuisineScore(region.country_code)) }}
            title={`TasteAtlas 2025 cuisine rating: ${(cuisineScore(region.country_code) / 10).toFixed(1)}/10`}
          >
            {(cuisineScore(region.country_code) / 10).toFixed(1)}/10
          </span>
          <span className="text-[9px] text-off-black/30 italic ml-auto">TasteAtlas 2025</span>
        </div>
        {region.cuisine_tags && region.cuisine_tags.length > 0 && (() => {
          const dishes = getRegionDishes(region.cuisine_tags)
          return dishes.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {dishes.map((d) => (
                <span key={d.name} className="px-2 py-0.5 text-[10px] font-display bg-white border border-off-black/20 rounded-full">
                  {d.emoji} {d.name}
                </span>
              ))}
            </div>
          ) : null
        })()}
      </div>

      {/* Flora & Fauna */}
      {(() => {
        const bioScore = biodiversityScore(region.country_code)
        const metrics = biodiversityMetrics(region.country_code)
        const animals = NATIVE_WILDLIFE[region.country_code] ?? []
        const flora = NATIVE_FLORA[region.country_code] ?? []
        return metrics.length > 0 ? (
          <div className="bg-cream border border-off-black/30 rounded-lg px-2 py-1.5 mt-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-display text-off-black/60">🌿 Flora & Fauna</span>
              <span
                className="text-xs font-mono font-bold px-2 py-1 rounded text-white"
                style={{ backgroundColor: scoreColor(bioScore) }}
              >
                {(bioScore / 10).toFixed(1)}/10
              </span>
              <span className="text-[9px] text-off-black/30 italic ml-auto">{metrics.join(' · ')}</span>
            </div>
            {(animals.length > 0 || flora.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {animals.map((a) => (
                  <span key={a.name} className="px-2 py-0.5 text-[10px] font-display bg-white border border-off-black/20 rounded-full">
                    {a.emoji} {a.name}
                  </span>
                ))}
                {flora.map((f) => (
                  <span key={f.name} className="px-2 py-0.5 text-[10px] font-display bg-white border border-off-black/20 rounded-full">
                    {f.emoji} {f.name}
                  </span>
                ))}
              </div>
            )}
            {/* National Parks */}
            {(() => {
              const parks = NATIONAL_PARKS[region.country_code] ?? []
              return parks.length > 0 ? (
                <div className="mt-1.5">
                  <div className="text-[9px] font-display text-off-black/40 uppercase mb-0.5">National Parks</div>
                  <div className="flex flex-wrap gap-1">
                    {parks.map((p) => (
                      <span key={p.name} className="px-2 py-0.5 text-[10px] font-display bg-white border border-off-black/20 rounded-full">
                        {p.emoji} {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null
            })()}
          </div>
        ) : null
      })()}

      {/* Monthly Climate — sparkline graphs */}
      <div className="mt-4">
        <h3 className="font-display font-bold text-xs mb-2 uppercase">Monthly Climate</h3>
        <div className="space-y-2">
          {/* Temperature sparkline */}
          {(() => {
            const values = sortedMonths.map((m) =>
              m.temp_max_c !== null && m.temp_min_c !== null
                ? 0.75 * m.temp_max_c + 0.25 * m.temp_min_c
                : m.temp_avg_c
            )
            return <Sparkline label="🌡️ Temp" unit="°C" values={values} selectedMonths={selectedMonths} showLabels />
          })()}

          {/* Rainfall sparkline */}
          <Sparkline
            label="🌧️ Rain"
            unit="mm"
            values={sortedMonths.map((m) => m.rainfall_mm)}
            selectedMonths={selectedMonths}
          />

          {/* Humidity sparkline */}
          <Sparkline
            label="💧 Humidity"
            unit="%"
            values={sortedMonths.map((m) => m.humidity_pct)}
            selectedMonths={selectedMonths}
          />
        </div>

        {/* Sea Temperature sparkline — conditional on water activities + coastal */}
          {(selectedActivities.includes('beach') || selectedActivities.includes('diving') || selectedActivities.includes('freediving')) && region.is_coastal && (
            <Sparkline
              label="🌊 Sea Temperature"
              unit="°C"
              values={sortedMonths.map((m) => m.sea_temp_c)}
              selectedMonths={selectedMonths}
              showLabels
            />
          )}

          {/* Conditional rows: snow */}
          {selectedActivities.includes('skiing') && (
            <div className="grid grid-cols-12 gap-0.5 text-center mt-2">
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
            </div>
          )}
      </div>

      {/* Monthly Scores */}
      <div className="mt-4 space-y-3">
        {/* Weather Score */}
        <div>
          <h3 className="font-display font-bold text-xs mb-1.5 uppercase">Overall Weather Score</h3>
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
                    {m.has_monsoon && (
                      <span className="absolute inset-0 flex items-center justify-center text-base leading-none" title="Monsoon season">⛈️</span>
                    )}
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
          <h3 className="font-display font-bold text-xs mb-1.5 uppercase cursor-help" title="Combined score: 80% weather quality + 20% crowd levels. Higher = better time to visit.">Best Time to Visit ™️</h3>
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
                {ACTIVITY_LABEL[a] ?? a}
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
            {region.landscape_type.map((l) => {
              const cfg: Record<string, { emoji: string; bg: string }> = {
                seaside: { emoji: '🏖️', bg: 'bg-sky-100' },
                mountain: { emoji: '⛰️', bg: 'bg-amber-100' },
                jungle: { emoji: '🌿', bg: 'bg-emerald-100' },
                desert: { emoji: '🏜️', bg: 'bg-yellow-100' },
                city: { emoji: '🏙️', bg: 'bg-gray-200' },
                island: { emoji: '🏝️', bg: 'bg-teal-100' },
              }
              const c = cfg[l]
              return (
                <span
                  key={l}
                  className={`px-2 py-0.5 text-[10px] font-display font-bold ${c?.bg ?? 'bg-cream'} border-2 border-off-black rounded-lg uppercase`}
                >
                  {c?.emoji ?? ''} {l}
                </span>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
