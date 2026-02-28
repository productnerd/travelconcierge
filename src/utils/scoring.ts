/**
 * Travel scoring algorithms.
 *
 * Good Weather Score (0–100): weighted sub-scores × multiplicative penalties.
 * Extreme conditions (monsoon, 40°C+ heat, heavy rain, humid heat, high wind) apply
 * hard penalty multipliers so they can't be compensated by other factors.
 *
 * Best Time to Visit (0–100): geometric mean of weather quality and quietness × safety.
 */
import { BIODIVERSITY } from '@/data/biodiversity'

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

/** Estimated snow depth (cm) from temp + rainfall. Rough 10:1 snow ratio.
 *  Uses temp_min to approximate mountain conditions (ski resorts are at altitude). */
export function estimateSnowCm(tempMinC: number | null, rainfallMm: number | null): number {
  if (tempMinC === null || rainfallMm === null || rainfallMm <= 0) return 0
  if (tempMinC <= 0) return Math.round(rainfallMm * 1.0) // 10:1 ratio (mm rain → cm snow)
  if (tempMinC <= 2) return Math.round(rainfallMm * 0.5) // partial mix
  return 0
}

// ── Multiplicative penalty functions (0–1, where 1 = no penalty) ────


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

const W_TEMP = 0.35
const W_RAIN = 0.25
const W_SUN = 0.20
const W_HUMIDITY = 0.15
const W_WIND = 0.05
const W_SEA = 0.05 // borrows proportionally from others for coastal

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
  month?: number     // 1–12, for bloom factor
  latitude?: number  // region centroid, for bloom factor
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
  const h = d.humidity_pct !== null ? humidityScore(d.humidity_pct) : 0.5
  const w = d.wind_speed_kmh !== null ? windScore(d.wind_speed_kmh) : 0.5

  // Activity-aware sub-scores
  const isCoastal = d.sea_temp_c !== null
  const sea = isCoastal ? seaTempScore(d.sea_temp_c!) : 0
  const surfWind = d.wind_speed_kmh !== null ? surfWindScore(d.wind_speed_kmh) : 0.5
  const skiTemp = d.temp_min_c !== null ? skiTempScore(d.temp_min_c) : (feltTemp !== null ? skiTempScore(feltTemp) : 0.5)
  const hikeTemp = feltTemp !== null ? hikingTempScore(feltTemp) : 0.5

  // Base weighted average — each activity gets its own weight profile
  let base: number
  if (hasSkiing) {
    // Skiing: use temp_min (approximates mountain altitude conditions)
    const snow = snowLikelihoodScore(d.temp_min_c, d.rainfall_mm)
    base =
      0.25 * skiTemp +     // ski temp curve (Gaussian at -2.5°C)
      0.25 * snow +        // snow likelihood from min temp + precip
      0.15 * r +           // rain (avalanche risk, visibility)
      0.15 * s +           // sunshine
      0.10 * h +           // humidity (comfort on slopes)
      0.10 * w             // wind (dangerous on exposed slopes)
  } else if (hasSurfing && isCoastal) {
    // Surfing: wind is king, sea temp for wetsuit, air temp barely matters
    base =
      0.10 * t +           // air temp (minimal — in the water)
      0.15 * r +           // rain (reduces visibility, comfort)
      0.05 * s +
      0.05 * h +
      0.25 * surfWind +    // ideal wind 15-30 km/h
      0.40 * sea            // sea temp (wetsuit thickness)
  } else if (hasBeach && isCoastal) {
    // Beach: sun + sea temp + warm air, rain/wind are mood killers
    base =
      0.15 * t +           // warm air for sunbathing
      0.10 * r +           // rain ruins beach day
      0.30 * s +           // sunshine is the point
      0.05 * h +
      0.05 * w +           // too much wind is annoying
      0.35 * sea            // sea temp for swimming
  } else if (hasFreediving && isCoastal) {
    // Freediving: calm water + warm sea, air temp irrelevant
    base =
      0.05 * t +
      0.10 * r +
      0.10 * s +
      0.05 * h +
      0.30 * w +           // calm seas critical (no tank, surface rest)
      0.40 * sea
  } else if (hasDiving && isCoastal) {
    // Diving: sea temp dominant, wind for boat trips, air temp irrelevant
    base =
      0.05 * t +
      0.10 * r +
      0.10 * s +
      0.05 * h +
      0.25 * w +           // wind (boat trips need manageable seas)
      0.45 * sea            // sea temp (comfort, marine life activity)
  } else if (hasHiking) {
    // Hiking: cooler temps preferred, rain matters more, sunshine matters more
    base =
      0.25 * hikeTemp +    // hiking temp curve centered at 17°C
      0.30 * r +           // rain (trails become miserable)
      0.25 * s +           // sunshine (daylight for trails)
      0.10 * h +
      0.10 * w
  } else if (isCoastal) {
    // Generic coastal (no specific water activity selected)
    const scale = 1 - W_SEA
    base =
      W_TEMP * scale * t +
      W_RAIN * scale * r +
      W_SUN * scale * s +
      W_HUMIDITY * scale * h +
      W_WIND * scale * w +
      W_SEA * sea
  } else {
    // Default: general good weather
    base =
      W_TEMP * t +
      W_RAIN * r +
      W_SUN * s +
      W_HUMIDITY * h +
      W_WIND * w
  }

  // Multiplicative penalties — extreme conditions can't be compensated
  // Each activity skips irrelevant penalties:
  //   Skiing: skip heat/cold (cold is good), use temp_min for snow penalty
  //   Surfing: skip cold (wetsuits), shift wind penalty threshold +15
  //   Diving/freediving: skip cold/heat/humidHeat (underwater), monsoon ×0.15
  //   Freediving: stricter wind (penalize from 25 km/h)
  const isWaterActivity = hasSurfing || hasDiving || hasFreediving
  const windForPenalty = hasSurfing
    ? Math.max(0, (d.wind_speed_kmh ?? 0) - 15)
    : hasFreediving
      ? Math.max(0, (d.wind_speed_kmh ?? 0) + 5)
      : d.wind_speed_kmh
  const monsoon = d.has_monsoon
    ? (hasDiving ? 0.15 : 0.30)
    : 1
  const skipComfort = hasSkiing || isWaterActivity // underwater or skiing → comfort penalties irrelevant
  const penalty =
    monsoon *
    (skipComfort ? 1 : heatComfortPenalty(feltTemp)) *
    (skipComfort ? 1 : coldComfortPenalty(feltTemp)) *
    heavyRainPenalty(d.rainfall_mm) *
    (skipComfort ? 1 : humidHeatPenalty(feltTemp, d.humidity_pct)) *
    highWindPenalty(windForPenalty) *
    (hasSkiing ? noSnowPenalty(d.temp_min_c, d.rainfall_mm) : 1)

  return 100 * base * penalty
}

// ── Presets ──────────────────────────────────────────────────────────

export type AlgorithmPreset = 'weather-chaser' | 'balanced' | 'crowd-avoider'

const PRESET_ALPHA: Record<AlgorithmPreset, number> = {
  'weather-chaser': 1.0,  // weather 100%, crowds 0%
  'balanced': 0.80,       // weather 80%, crowds 20%
  'crowd-avoider': 0.0,   // weather 0%, crowds 100%
}

/** Vegetation lushness factor (0.96–1.04). Rewards green/blooming months, penalises bare/dormant. */
export function bloomFactor(month: number, lat: number, tempC: number | null, rainfallMm: number | null): number {
  const rain = rainfallMm ?? 30
  const temp = tempC ?? 15

  // Arid desert — no meaningful vegetation
  if (rain < 10 && temp > 25) return 1.0

  // Tropical — always green, slight rain modulation
  if (Math.abs(lat) < 23.5) {
    if (rain > 50) return 1.02
    if (rain < 15) return 0.98
    return 1.0
  }

  // Temperate / polar — seasonal sinusoidal curve
  const peakMonth = lat >= 0 ? 7 : 1
  const angle = 2 * Math.PI * (month - peakMonth) / 12
  const seasonal = Math.cos(angle) // -1 (dead winter) to 1 (peak summer)
  let factor = 1.0 + seasonal * 0.04

  // Dry growing season penalty (e.g. Mediterranean summer drought)
  if (seasonal > 0 && rain < 20) factor = Math.max(factor - 0.02, 0.96)

  return factor
}

/**
 * Best Time to Visit (0–100).
 * Geometric mean: 100 × W^α × Q^(1−α) × floraFauna
 * where W = goodWeather / 100, Q = quietness on a 0.2–1.0 scale.
 * Q floor of 0.2 ensures peak season doesn't obliterate the score.
 * Safety is NOT applied here — it's applied once in overallScore only.
 */
export function bestTimeScore(d: ClimateInput, preset: AlgorithmPreset = 'balanced', activities: string[] = [], countryCode?: string): number {
  const alpha = PRESET_ALPHA[preset]
  const W = goodWeatherScore(d, activities) / 100
  // busyness 1→Q=1.0, busyness 5→Q=0.2 (linear, gentler floor than before)
  const Q = Math.max(1 - (d.busyness - 1) * 0.2, 0.2)
  let raw = 100 * Math.pow(W, alpha) * Math.pow(Q, 1 - alpha)

  // Flora & Fauna factor: ±15% combining biodiversity + vegetation bloom
  // Biodiversity: country-level species richness (fauna-focused)
  // Bloom: seasonal vegetation lushness from latitude + climate (flora-focused)
  if (countryCode) {
    const bio = BIODIVERSITY[countryCode]
    const hasWater = activities.some(a => ['diving', 'freediving', 'beach'].includes(a))
    const hasHiking = activities.includes('hiking')

    // Biodiversity component (0–1 normalized)
    let bioScore = 0.5 // neutral default
    if (bio) {
      if (hasWater && bio.marine !== undefined) {
        bioScore = bio.marine / 100
      } else if (hasHiking) {
        bioScore = bio.protected !== undefined ? (bio.index * 0.6 + bio.protected * 0.4) / 100 : bio.index / 100
      } else {
        bioScore = bio.index / 100
      }
    }

    // Bloom component (0–1 normalized from the 0.96–1.04 range)
    let bloomScore = 0.5 // neutral default
    if (d.month !== undefined && d.latitude !== undefined) {
      const bf = bloomFactor(d.month, d.latitude, d.temp_avg_c, d.rainfall_mm)
      bloomScore = (bf - 0.96) / 0.08 // maps 0.96→0, 1.0→0.5, 1.04→1.0
    }

    // Combined: 60% biodiversity (fauna) + 40% bloom (flora)
    const combined = bioScore * 0.6 + bloomScore * 0.4
    // Apply as ±15% multiplier (combined=0 → ×0.85, combined=0.5 → ×1.0, combined=1 → ×1.15)
    if (hasWater || hasHiking) {
      raw *= 0.85 + 0.30 * combined
    }
  }

  return raw
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
