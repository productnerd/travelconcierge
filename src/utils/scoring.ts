/**
 * Travel scoring algorithms.
 *
 * Good Weather Score (0–100): weighted sub-scores × multiplicative penalties.
 * Extreme conditions (monsoon, 40°C+ heat, heavy rain, humid heat, high wind) apply
 * hard penalty multipliers so they can't be compensated by other factors.
 *
 * Best Time to Visit (0–100): geometric mean of weather quality and quietness.
 */

// ── Sub-score functions (0–1) ───────────────────────────────────────

/** Temperature comfort: Gaussian around 22–27 °C sweet spot, tight sigma. */
function tempScore(avgC: number): number {
  if (avgC >= 22 && avgC <= 27) return 1
  const dist = avgC < 22 ? 22 - avgC : avgC - 27
  const sigma = avgC < 22 ? 6 : 4
  return Math.exp(-(dist * dist) / (2 * sigma * sigma))
}

/** Rainfall: logistic decay, inflection at 60 mm, steep power. */
function rainScore(mm: number): number {
  return 1 / (1 + Math.pow(mm / 60, 3))
}

/** Sunshine reward: linear up to 10 h/day cap. */
function sunScore(hours: number): number {
  return Math.min(Math.max(hours / 10, 0), 1)
}

/** Cloud cover: linear inverse (0 % → 1, 100 % → 0). */
function cloudScore(pct: number): number {
  return 1 - pct / 100
}

/** Humidity comfort: perfect ≤ 55 %, power decay above. */
function humidityScore(pct: number): number {
  if (pct <= 55) return 1
  return Math.max(0, 1 - Math.pow((pct - 55) / 45, 1.8))
}

/** Wind: OK ≤ 20 km/h, quadratic decay 20–50, 0 above. */
function windScore(kmh: number): number {
  if (kmh <= 20) return 1
  if (kmh >= 50) return 0
  return 1 - Math.pow((kmh - 20) / 30, 2)
}

/** Sea temperature: Gaussian centred at 26 °C, σ = 5. */
function seaTempScore(seaC: number): number {
  return Math.exp(-Math.pow(seaC - 26, 2) / (2 * 25))
}

/** Ski temperature: Gaussian centred at −2.5 °C (ideal: −5 to 0), σ = 4. */
function skiTempScore(avgC: number): number {
  return Math.exp(-Math.pow(avgC + 2.5, 2) / (2 * 16))
}

/** Snow likelihood from temp + precipitation. */
function snowLikelihoodScore(tempMaxC: number | null, rainfallMm: number | null): number {
  if (tempMaxC === null || rainfallMm === null) return 0.3
  if (tempMaxC <= 2 && rainfallMm > 30) return 1.0
  if (tempMaxC <= 2 && rainfallMm > 0) return 0.7
  if (tempMaxC <= 2) return 0.4 // cold but dry
  if (tempMaxC <= 5 && rainfallMm > 30) return 0.3
  return 0.1
}

/** Surfing wind: Gaussian centred at 22 km/h (ideal: 15–30), σ = 8. */
function surfWindScore(kmh: number): number {
  return Math.exp(-Math.pow(kmh - 22, 2) / (2 * 64))
}

/** Hiking temperature: Gaussian centred at 17 °C (ideal: 10–24 °C), σ = 7. */
function hikingTempScore(avgC: number): number {
  if (avgC >= 10 && avgC <= 24) return 1
  const dist = avgC < 10 ? 10 - avgC : avgC - 24
  return Math.exp(-(dist * dist) / (2 * 49))
}

/** Estimated snow depth (cm) from temp + rainfall. Rough 10:1 snow ratio. */
export function estimateSnowCm(tempMaxC: number | null, rainfallMm: number | null): number {
  if (tempMaxC === null || rainfallMm === null || rainfallMm <= 0) return 0
  if (tempMaxC <= 0) return Math.round(rainfallMm * 1.0) // 10:1 ratio (mm rain → cm snow)
  if (tempMaxC <= 2) return Math.round(rainfallMm * 0.5) // partial mix
  return 0
}

// ── Multiplicative penalty functions (0–1, where 1 = no penalty) ────

/** Monsoon: hard cap at ×0.30 — monsoon season = Bad weather. */
function monsoonPenalty(hasMonsoon: boolean): number {
  return hasMonsoon ? 0.30 : 1
}

/**
 * Heat comfort penalty: perceived temp above 29 °C starts dragging score down.
 * 29 °C → ×1.0 (comfortable), 43 °C+ → ×0.15 (unbearable).
 * This catches hot+dry places (Dubai, Sahara) where rain/sun/cloud all score perfectly.
 */
function heatComfortPenalty(feltC: number | null): number {
  if (feltC === null || feltC <= 29) return 1
  if (feltC >= 43) return 0.15
  return 1 - 0.85 * ((feltC - 29) / 14)
}

/**
 * Cold comfort penalty: perceived temp below 5 °C starts dragging score down.
 * 5 °C → ×1.0 (cool but fine), −15 °C → ×0.20 (harsh winter).
 */
function coldComfortPenalty(feltC: number | null): number {
  if (feltC === null || feltC >= 5) return 1
  if (feltC <= -15) return 0.20
  return 1 - 0.80 * ((5 - feltC) / 20)
}

/** Heavy rain (non-monsoon): progressive decay above 200 mm. */
function heavyRainPenalty(mm: number | null): number {
  if (mm === null || mm <= 200) return 1
  if (mm >= 400) return 0.30
  return 1 - 0.70 * ((mm - 200) / 200)
}

/** Humid heat combo: >30 °C AND >75% humidity = oppressive. */
function humidHeatPenalty(avgC: number | null, humPct: number | null): number {
  if (avgC === null || humPct === null) return 1
  if (avgC <= 30 || humPct <= 75) return 1
  // Both beyond threshold — scale penalty by how far beyond
  const heatExcess = Math.min((avgC - 30) / 10, 1) // 0–1 over 30–40°C
  const humExcess = Math.min((humPct - 75) / 25, 1) // 0–1 over 75–100%
  return 1 - 0.40 * heatExcess * humExcess // worst case ×0.60
}

/**
 * High wind penalty: >30 km/h starts dragging score down.
 * 30 km/h → ×1.0 (fresh breeze, manageable), 60 km/h+ → ×0.30 (gale force).
 * Catches persistently windy destinations (Patagonia, Iceland coast, etc.).
 */
function highWindPenalty(kmh: number | null): number {
  if (kmh === null || kmh <= 30) return 1
  if (kmh >= 60) return 0.30
  return 1 - 0.70 * ((kmh - 30) / 30)
}

/** No-snow penalty for skiing: warm months with no snow chance → near-zero score. */
function noSnowPenalty(tempMaxC: number | null, rainfallMm: number | null): number {
  const snow = snowLikelihoodScore(tempMaxC, rainfallMm)
  if (snow >= 0.4) return 1       // decent snow conditions
  if (snow >= 0.3) return 0.50    // marginal
  return 0.10                     // no snow → hard penalty (like monsoon)
}

// ── Weights ──────────────────────────────────────────────────────────

const W_TEMP = 0.30
const W_RAIN = 0.25
const W_SUN = 0.15
const W_CLOUD = 0.05
const W_HUMIDITY = 0.15
const W_WIND = 0.10
const W_SEA = 0.08 // borrows proportionally from others for coastal

// ── Exported scoring ─────────────────────────────────────────────────

export interface ClimateInput {
  temp_avg_c: number | null
  temp_min_c: number | null
  temp_max_c: number | null
  rainfall_mm: number | null
  sunshine_hours_day: number | null
  cloud_cover_pct: number | null
  humidity_pct: number | null
  wind_speed_kmh: number | null
  has_monsoon: boolean
  sea_temp_c: number | null
  busyness: number // 1–5
}

/** Daytime-weighted temp: 75% max + 25% min (travelers explore during the day). */
function daytimeTemp(d: ClimateInput): number | null {
  if (d.temp_max_c !== null && d.temp_min_c !== null) {
    return 0.75 * d.temp_max_c + 0.25 * d.temp_min_c
  }
  return d.temp_avg_c
}

/** Humidity makes heat feel worse. Returns perceived temperature. */
function perceivedTemp(tempC: number, humPct: number | null): number {
  if (humPct === null || tempC <= 25 || humPct <= 40) return tempC
  const excessTemp = tempC - 25
  const excessHum = (humPct - 40) / 100
  return tempC + excessTemp * excessHum * 1.5
}

/**
 * Good Weather Score (0–100).
 * Base = weighted average of sub-scores.
 * Then multiplied by penalty factors for extreme conditions.
 * This ensures monsoon/extreme heat/heavy rain can't be compensated.
 */
export function goodWeatherScore(d: ClimateInput, activities: string[] = []): number {
  const hasSkiing = activities.includes('skiing')
  const hasBeach = activities.includes('beach')
  const hasSurfing = activities.includes('surfing')
  const hasFreediving = activities.includes('freediving')
  const hasDiving = activities.includes('diving') || hasFreediving
  const hasHiking = activities.includes('hiking')

  // Use daytime-weighted temp, then apply humidity heat amplification
  const rawTemp = daytimeTemp(d)
  const feltTemp = rawTemp !== null ? perceivedTemp(rawTemp, d.humidity_pct) : null

  const t = feltTemp !== null ? tempScore(feltTemp) : 0.5
  const r = d.rainfall_mm !== null ? rainScore(d.rainfall_mm) : 0.5
  const s = d.sunshine_hours_day !== null ? sunScore(d.sunshine_hours_day) : 0.5
  const c = d.cloud_cover_pct !== null ? cloudScore(d.cloud_cover_pct) : 0.5
  const h = d.humidity_pct !== null ? humidityScore(d.humidity_pct) : 0.5
  const w = d.wind_speed_kmh !== null ? windScore(d.wind_speed_kmh) : 0.5

  // Activity-aware sub-score overrides
  const effectiveTemp = hasSkiing && feltTemp !== null
    ? skiTempScore(feltTemp)
    : hasHiking && feltTemp !== null
      ? hikingTempScore(feltTemp)
      : t
  const effectiveWind = hasSurfing && d.wind_speed_kmh !== null ? surfWindScore(d.wind_speed_kmh) : w

  // Determine sea temp weight based on activity
  const isCoastal = d.sea_temp_c !== null
  let seaWeight = W_SEA
  if (hasBeach && isCoastal) seaWeight = 0.25
  else if (hasFreediving && isCoastal) seaWeight = 0.20
  else if (hasDiving && isCoastal) seaWeight = 0.15
  const effectiveSeaWeight = isCoastal ? seaWeight : 0

  // Base weighted average
  let base: number
  if (hasSkiing) {
    // Ski mode: ski temp curve + snow likelihood, no sea temp
    const snow = snowLikelihoodScore(d.temp_max_c, d.rainfall_mm)
    const W_TEMP_SKI = 0.25
    const W_SNOW = 0.25
    const rem = 1 - W_TEMP_SKI - W_SNOW // 0.50
    base =
      W_TEMP_SKI * effectiveTemp +
      W_SNOW * snow +
      rem * 0.30 * r +
      rem * 0.20 * s +
      rem * 0.10 * c +
      rem * 0.20 * h +
      rem * 0.20 * effectiveWind
  } else if (hasHiking) {
    // Hiking: cooler temps preferred, rain matters more, sunshine matters more
    base =
      0.25 * effectiveTemp +  // hiking temp curve centered at 17°C
      0.30 * r +              // rain boosted (trails become miserable)
      0.20 * s +              // sunshine boosted (daylight for trails)
      0.05 * c +
      0.10 * h +
      0.10 * effectiveWind
  } else if (effectiveSeaWeight > 0) {
    const sea = seaTempScore(d.sea_temp_c!)
    const scale = 1 - effectiveSeaWeight
    base =
      W_TEMP * scale * effectiveTemp +
      W_RAIN * scale * r +
      W_SUN * scale * s +
      W_CLOUD * scale * c +
      W_HUMIDITY * scale * h +
      W_WIND * scale * effectiveWind +
      effectiveSeaWeight * sea
  } else {
    base =
      W_TEMP * effectiveTemp +
      W_RAIN * r +
      W_SUN * s +
      W_CLOUD * c +
      W_HUMIDITY * h +
      W_WIND * effectiveWind
  }

  // Multiplicative penalties — extreme conditions can't be compensated
  // Skiing: skip heat/cold penalties (cold is good for skiing)
  // Surfing: shift wind penalty threshold up by 15 km/h
  // Diving/freediving: monsoon destroys visibility → harsher penalty (×0.15)
  // Freediving: calmer water needed → wind threshold lower (25 km/h instead of 30)
  const windForPenalty = hasSurfing
    ? Math.max(0, (d.wind_speed_kmh ?? 0) - 15)
    : hasFreediving
      ? Math.max(0, (d.wind_speed_kmh ?? 0) + 5) // stricter: penalize from 25 km/h
      : d.wind_speed_kmh
  const monsoon = d.has_monsoon
    ? (hasDiving ? 0.15 : 0.30)  // diving/freediving: visibility destroyed
    : 1
  const penalty =
    monsoon *
    (hasSkiing ? 1 : heatComfortPenalty(feltTemp)) *
    (hasSkiing ? 1 : coldComfortPenalty(feltTemp)) *
    heavyRainPenalty(d.rainfall_mm) *
    (hasSkiing ? 1 : humidHeatPenalty(feltTemp, d.humidity_pct)) *
    highWindPenalty(windForPenalty) *
    (hasSkiing ? noSnowPenalty(d.temp_max_c, d.rainfall_mm) : 1)

  return 100 * base * penalty
}

// ── Presets ──────────────────────────────────────────────────────────

export type AlgorithmPreset = 'weather-chaser' | 'balanced' | 'crowd-avoider'

const PRESET_ALPHA: Record<AlgorithmPreset, number> = {
  'weather-chaser': 0.95,
  'balanced': 0.75,     // weather 75%, crowds 25%
  'crowd-avoider': 0.05, // crowds 95%, weather 5%
}

/**
 * Best Time to Visit (0–100).
 * Geometric mean: 100 × W^α × Q^(1−α)
 * where W = goodWeather / 100, Q = quietness on a 0.2–1.0 scale.
 * Q floor of 0.2 ensures peak season doesn't obliterate the score.
 */
export function bestTimeScore(d: ClimateInput, preset: AlgorithmPreset = 'balanced', activities: string[] = []): number {
  const alpha = PRESET_ALPHA[preset]
  const W = goodWeatherScore(d, activities) / 100
  // busyness 1→Q=1.0, busyness 5→Q=0.2 (linear, gentler floor than before)
  const Q = Math.max(1 - (d.busyness - 1) * 0.2, 0.2)
  return 100 * Math.pow(W, alpha) * Math.pow(Q, 1 - alpha)
}

// ── Color helpers ────────────────────────────────────────────────────

/** Map a 0–100 score to a green→amber→red color. */
export function scoreColor(score: number): string {
  // 80–100: green, 60–80: light green, 40–60: amber, 20–40: orange-red, 0–20: dark red
  if (score >= 80) return '#3B7A4A'
  if (score >= 60) return '#6BAF78'
  if (score >= 40) return '#F5C842'
  if (score >= 20) return '#D93B2B'
  return '#8B1A10'
}

/** Human-readable label for a 0–100 score. */
export function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Poor'
  return 'Bad'
}

export const PRESET_LABELS: Record<AlgorithmPreset, string> = {
  'weather-chaser': 'Weather Chaser',
  'balanced': 'Balanced',
  'crowd-avoider': 'Crowd Avoider',
}
