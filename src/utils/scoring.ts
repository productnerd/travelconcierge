/**
 * Travel scoring algorithms.
 *
 * Good Weather Score (0–100): weighted combination of 7 climate sub-scores.
 * Best Time to Visit (0–100): geometric mean of weather quality and quietness.
 */

// ── Sub-score functions ──────────────────────────────────────────────

/** Temperature comfort: Gaussian around 22–28 °C sweet spot. */
function tempScore(avgC: number): number {
  if (avgC >= 22 && avgC <= 28) return 1
  const dist = avgC < 22 ? 22 - avgC : avgC - 28
  const sigma = avgC < 22 ? 8 : 6
  return Math.exp(-(dist * dist) / (2 * sigma * sigma))
}

/** Rainfall penalty: logistic decay, inflection at 80 mm. */
function rainScore(mm: number): number {
  return 1 / (1 + Math.pow(mm / 80, 2.5))
}

/** Sunshine reward: linear up to 10 h/day cap. */
function sunScore(hours: number): number {
  return Math.min(Math.max(hours / 10, 0), 1)
}

/** Cloud cover: linear inverse (0 % → 1, 100 % → 0). */
function cloudScore(pct: number): number {
  return 1 - pct / 100
}

/** Humidity comfort: perfect ≤ 60 %, power decay above. */
function humidityScore(pct: number): number {
  if (pct <= 60) return 1
  return Math.max(0, 1 - Math.pow((pct - 60) / 40, 1.5))
}

/** Wind: OK ≤ 20 km/h, quadratic decay 20–50, 0 above. */
function windScore(kmh: number): number {
  if (kmh <= 20) return 1
  if (kmh >= 50) return 0
  return 1 - Math.pow((kmh - 20) / 30, 2)
}

/** Monsoon: binary penalty. */
function monsoonScore(hasMonsoon: boolean): number {
  return hasMonsoon ? 0 : 1
}

/** Sea temperature: Gaussian centred at 26 °C, σ = 5. */
function seaTempScore(seaC: number): number {
  return Math.exp(-Math.pow(seaC - 26, 2) / (2 * 25))
}

// ── Weights ──────────────────────────────────────────────────────────

const W_TEMP = 0.30
const W_RAIN = 0.20
const W_SUN = 0.15
const W_CLOUD = 0.10
const W_HUMIDITY = 0.10
const W_WIND = 0.05
const W_MONSOON = 0.10
const W_SEA = 0.08 // borrows proportionally from others for coastal

// ── Exported scoring ─────────────────────────────────────────────────

export interface ClimateInput {
  temp_avg_c: number | null
  rainfall_mm: number | null
  sunshine_hours_day: number | null
  cloud_cover_pct: number | null
  humidity_pct: number | null
  wind_speed_kmh: number | null
  has_monsoon: boolean
  sea_temp_c: number | null
  busyness: number // 1–10
}

/**
 * Good Weather Score (0–100).
 * For coastal regions with sea_temp data, 8 % of weight is allocated to sea
 * temperature and the other weights are scaled down by 0.92.
 */
export function goodWeatherScore(d: ClimateInput): number {
  const t = d.temp_avg_c !== null ? tempScore(d.temp_avg_c) : 0.5
  const r = d.rainfall_mm !== null ? rainScore(d.rainfall_mm) : 0.5
  const s = d.sunshine_hours_day !== null ? sunScore(d.sunshine_hours_day) : 0.5
  const c = d.cloud_cover_pct !== null ? cloudScore(d.cloud_cover_pct) : 0.5
  const h = d.humidity_pct !== null ? humidityScore(d.humidity_pct) : 0.5
  const w = d.wind_speed_kmh !== null ? windScore(d.wind_speed_kmh) : 0.5
  const m = monsoonScore(d.has_monsoon)

  const isCoastal = d.sea_temp_c !== null
  if (isCoastal) {
    const sea = seaTempScore(d.sea_temp_c!)
    const scale = 1 - W_SEA // 0.92
    return 100 * (
      W_TEMP * scale * t +
      W_RAIN * scale * r +
      W_SUN * scale * s +
      W_CLOUD * scale * c +
      W_HUMIDITY * scale * h +
      W_WIND * scale * w +
      W_MONSOON * scale * m +
      W_SEA * sea
    )
  }

  return 100 * (
    W_TEMP * t +
    W_RAIN * r +
    W_SUN * s +
    W_CLOUD * c +
    W_HUMIDITY * h +
    W_WIND * w +
    W_MONSOON * m
  )
}

// ── Presets ──────────────────────────────────────────────────────────

export type AlgorithmPreset = 'weather-chaser' | 'balanced' | 'crowd-avoider'

const PRESET_ALPHA: Record<AlgorithmPreset, number> = {
  'weather-chaser': 0.90,
  'balanced': 0.67,     // weather weighs ~2× busyness
  'crowd-avoider': 0.45,
}

/**
 * Best Time to Visit (0–100).
 * Geometric mean: 100 × W^α × Q^(1−α)
 * where W = goodWeather / 100, Q = quietness on a 0.2–1.0 scale.
 * Q floor of 0.2 ensures peak season doesn't obliterate the score.
 */
export function bestTimeScore(d: ClimateInput, preset: AlgorithmPreset = 'balanced'): number {
  const alpha = PRESET_ALPHA[preset]
  const W = goodWeatherScore(d) / 100
  // busyness 1→Q=1.0, busyness 10→Q=0.1 (linear, gentler floor than before)
  const Q = Math.max(1 - (d.busyness - 1) * 0.1, 0.1)
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
