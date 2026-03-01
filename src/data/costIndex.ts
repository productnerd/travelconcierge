// ── Continent lookup ──────────────────────────────────────────────────
export type Continent = 'Europe' | 'Asia' | 'Africa' | 'North America' | 'South America' | 'Oceania'

export const CONTINENTS: Continent[] = ['Europe', 'Asia', 'Africa', 'North America', 'South America', 'Oceania']

export const COUNTRY_CONTINENT: Record<string, Continent> = {
  // Europe
  AL: 'Europe', AD: 'Europe', AT: 'Europe', BY: 'Europe', BE: 'Europe', BA: 'Europe', BG: 'Europe',
  HR: 'Europe', CY: 'Europe', CZ: 'Europe', DK: 'Europe', EE: 'Europe', FI: 'Europe', FR: 'Europe',
  DE: 'Europe', GR: 'Europe', HU: 'Europe', IS: 'Europe', IE: 'Europe', IT: 'Europe', XK: 'Europe',
  LV: 'Europe', LI: 'Europe', LT: 'Europe', LU: 'Europe', MT: 'Europe', MD: 'Europe', MC: 'Europe',
  ME: 'Europe', NL: 'Europe', MK: 'Europe', NO: 'Europe', PL: 'Europe', PT: 'Europe', RO: 'Europe',
  RU: 'Europe', SM: 'Europe', RS: 'Europe', SK: 'Europe', SI: 'Europe', ES: 'Europe', SE: 'Europe',
  CH: 'Europe', UA: 'Europe', GB: 'Europe', VA: 'Europe', FO: 'Europe',
  // Asia
  AF: 'Asia', AM: 'Asia', AZ: 'Asia', BH: 'Asia', BD: 'Asia', BT: 'Asia', BN: 'Asia', KH: 'Asia',
  CN: 'Asia', GE: 'Asia', IN: 'Asia', ID: 'Asia', IR: 'Asia', IQ: 'Asia', IL: 'Asia', JP: 'Asia',
  JO: 'Asia', KZ: 'Asia', KW: 'Asia', KG: 'Asia', LA: 'Asia', LB: 'Asia', MY: 'Asia', MV: 'Asia',
  MM: 'Asia', MN: 'Asia', NP: 'Asia', KP: 'Asia', OM: 'Asia', PK: 'Asia', PS: 'Asia', PH: 'Asia',
  QA: 'Asia', SA: 'Asia', SG: 'Asia', KR: 'Asia', LK: 'Asia', SY: 'Asia', TW: 'Asia', TJ: 'Asia',
  TH: 'Asia', TL: 'Asia', TR: 'Asia', TM: 'Asia', AE: 'Asia', UZ: 'Asia', VN: 'Asia', YE: 'Asia', HK: 'Asia',
  // North America & Caribbean
  US: 'North America', CA: 'North America', AG: 'North America', BS: 'North America', BB: 'North America',
  BZ: 'North America', CR: 'North America', CU: 'North America', DM: 'North America', DO: 'North America',
  SV: 'North America', GD: 'North America', GT: 'North America', HT: 'North America', HN: 'North America',
  JM: 'North America', KN: 'North America', LC: 'North America', VC: 'North America', TT: 'North America',
  NI: 'North America', PA: 'North America', MX: 'North America', AW: 'North America', TC: 'North America',
  CW: 'North America', GP: 'North America', MQ: 'North America', BM: 'North America', PR: 'North America',
  // South America
  AR: 'South America', BO: 'South America', BR: 'South America', CL: 'South America', CO: 'South America',
  EC: 'South America', GY: 'South America', PY: 'South America', PE: 'South America', SR: 'South America',
  UY: 'South America', VE: 'South America',
  // Africa
  DZ: 'Africa', AO: 'Africa', BJ: 'Africa', BW: 'Africa', BF: 'Africa', BI: 'Africa', CV: 'Africa',
  CM: 'Africa', CF: 'Africa', TD: 'Africa', KM: 'Africa', CG: 'Africa', CD: 'Africa', CI: 'Africa',
  DJ: 'Africa', GQ: 'Africa', ER: 'Africa', SZ: 'Africa', ET: 'Africa', GA: 'Africa', GM: 'Africa',
  GH: 'Africa', GN: 'Africa', GW: 'Africa', KE: 'Africa', LS: 'Africa', LR: 'Africa', LY: 'Africa',
  MG: 'Africa', MW: 'Africa', ML: 'Africa', MR: 'Africa', MU: 'Africa', MZ: 'Africa', NA: 'Africa',
  NE: 'Africa', NG: 'Africa', RW: 'Africa', ST: 'Africa', SN: 'Africa', SC: 'Africa', SL: 'Africa',
  SO: 'Africa', ZA: 'Africa', SS: 'Africa', SD: 'Africa', TG: 'Africa', TN: 'Africa', UG: 'Africa',
  ZM: 'Africa', ZW: 'Africa', MA: 'Africa', RE: 'Africa',
  // Oceania
  AU: 'Oceania', FJ: 'Oceania', KI: 'Oceania', MH: 'Oceania', FM: 'Oceania', NR: 'Oceania',
  NZ: 'Oceania', PW: 'Oceania', PG: 'Oceania', WS: 'Oceania', SB: 'Oceania', TO: 'Oceania',
  TV: 'Oceania', VU: 'Oceania', PF: 'Oceania', CK: 'Oceania',
}

// Daily travel budget tier per country (1=very cheap, 5=very expensive)
// Based on Numbeo Cost of Living Index + backpacker budget estimates
// 1: €15–25/day  2: €25–45/day  3: €45–95/day  4: €95–190/day  5: €190+/day

export const COST_INDEX: Record<string, number> = {
  // Europe
  AL: 2, AD: 4, AT: 4, BY: 2, BE: 4, BA: 2, BG: 2, HR: 3, CY: 3, CZ: 3,
  DK: 5, EE: 3, FI: 5, FR: 4, DE: 4, GR: 3, HU: 2, IS: 5, IE: 4, IT: 4,
  XK: 2, LV: 3, LI: 5, LT: 3, LU: 5, MT: 3, MD: 1, MC: 5, ME: 2, NL: 4,
  MK: 2, NO: 5, PL: 2, PT: 3, RO: 2, RU: 2, SM: 4, RS: 2, SK: 3, SI: 3,
  ES: 3, SE: 5, CH: 5, UA: 1, GB: 4, VA: 4,
  // Asia
  AF: 1, AM: 2, AZ: 2, BH: 4, BD: 1, BT: 3, BN: 3, KH: 1, CN: 2, GE: 2,
  IN: 1, ID: 1, IR: 1, IQ: 2, IL: 4, JP: 4, JO: 3, KZ: 2, KW: 4, KG: 1,
  LA: 1, LB: 3, MY: 2, MV: 3, MM: 1, MN: 1, NP: 1, KP: 3, OM: 3, PK: 1,
  PS: 2, PH: 1, QA: 4, SA: 3, SG: 5, KR: 3, LK: 1, SY: 2, TW: 3, TJ: 1,
  TH: 1, TL: 2, TR: 2, TM: 2, AE: 4, UZ: 1, VN: 1, YE: 1, HK: 4,
  // North America & Caribbean
  US: 4, CA: 4, AG: 4, BS: 4, BB: 4, BZ: 2, CR: 3, CU: 2, DM: 3, DO: 2,
  SV: 2, GD: 3, GT: 1, HT: 2, HN: 2, JM: 3, KN: 4, LC: 3, VC: 3, TT: 3,
  NI: 1, PA: 3, MX: 2,
  // South America
  AR: 2, BO: 1, BR: 2, CL: 3, CO: 2, EC: 2, GY: 2, PY: 1, PE: 2, SR: 2,
  UY: 3, VE: 2,
  // Africa
  DZ: 2, AO: 3, BJ: 2, BW: 3, BF: 2, BI: 2, CV: 3, CM: 2, CF: 2, TD: 2,
  KM: 3, CG: 2, CD: 2, CI: 2, DJ: 3, GQ: 3, ER: 2, SZ: 2, ET: 1, GA: 3,
  GM: 2, GH: 2, GN: 2, GW: 2, KE: 2, LS: 2, LR: 2, LY: 3, MG: 1, MW: 1,
  ML: 2, MR: 2, MU: 3, MZ: 2, NA: 3, NE: 2, NG: 2, RW: 2, ST: 3, SN: 2,
  SC: 4, SL: 2, SO: 2, ZA: 3, SS: 2, SD: 2, TG: 2, TN: 2, UG: 1, ZM: 2,
  ZW: 2, MA: 2,
  // Oceania
  AU: 4, FJ: 3, KI: 3, MH: 3, FM: 3, NR: 4, NZ: 4, PW: 4, PG: 3, WS: 3,
  SB: 3, TO: 3, TV: 3, VU: 3,
  // Territory islands
  PF: 5, AW: 4, TC: 5, CK: 4, FO: 5, RE: 4, CW: 3, GP: 3, MQ: 3, BM: 5, PR: 3,
}

export function costLabel(tier: number): string {
  return '€'.repeat(tier)
}

// Travel advisory tier per country (1-4)
// 1: Normal — no significant travel concerns
// 2: Exercise caution — localized crime/petty theft but tourist-safe (e.g. South Africa, Brazil, Mexico)
// 3: Reconsider travel — significant instability, terrorism risk, or civil unrest
// 4: Do not travel — active conflict, war zones, extreme danger
// Only countries at tier 2+ are listed; unlisted countries default to tier 1.
// Sources: UNDSS Security Phases, Global Peace Index 2025 (IEP), INFORM Risk Index (OCHA/JRC).
// Cross-referenced for consensus; no single government advisory used.

export const SAFETY_TIER: Record<string, number> = {
  // Tier 4: Do not travel — active conflict / extreme danger
  AF: 4, // Afghanistan — GPI 158, INFORM Very High
  BF: 4, // Burkina Faso — GPI 152, INFORM Very High
  CD: 4, // DR Congo — GPI 160, INFORM Very High
  CF: 4, // Central African Republic — GPI 150, INFORM Very High
  HT: 4, // Haiti — GPI 141, state collapse
  IR: 4, // Iran — GPI 142, INFORM High
  IQ: 4, // Iraq — GPI 147, INFORM High
  KP: 4, // North Korea — GPI 149
  LY: 4, // Libya — GPI 131
  ML: 4, // Mali — GPI 154, INFORM Very High
  MM: 4, // Myanmar — GPI 153, civil war
  NE: 4, // Niger — GPI 143, military coup
  RU: 4, // Russia — GPI 163 (least peaceful)
  SD: 4, // Sudan — GPI 161, INFORM Very High
  SO: 4, // Somalia — GPI 151, INFORM Very High
  SS: 4, // South Sudan — GPI 156, INFORM Very High
  SY: 4, // Syria — GPI 157, INFORM Very High
  UA: 4, // Ukraine — GPI 162, active war
  VE: 4, // Venezuela — GPI 139
  YE: 4, // Yemen — GPI 159, INFORM Very High

  // Tier 3: Reconsider travel — significant risk
  BI: 3, // Burundi — GPI 133, INFORM High
  BY: 3, // Belarus — GPI 120, authoritarian regime
  CM: 3, // Cameroon — GPI 137, INFORM High
  ER: 3, // Eritrea — GPI 132, INFORM High
  ET: 3, // Ethiopia — GPI 138, INFORM Very High
  GN: 3, // Guinea — GPI 119, INFORM High
  IL: 3, // Israel — GPI 155
  LB: 3, // Lebanon — GPI 136
  NG: 3, // Nigeria — GPI 148, INFORM High
  PK: 3, // Pakistan — GPI 144, INFORM High
  PS: 3, // Palestine — GPI 145
  TD: 3, // Chad — GPI 134, INFORM Very High

  // Tier 2: Exercise caution — localized crime but generally tourist-safe
  AO: 2, // Angola — GPI 83
  BD: 2, // Bangladesh — GPI 123
  BJ: 2, // Benin — GPI 114
  BR: 2, // Brazil — GPI 130
  CG: 2, // Congo Republic — GPI 103
  CI: 2, // Côte d'Ivoire — GPI 70
  CO: 2, // Colombia — GPI 140
  DZ: 2, // Algeria — GPI 91
  EC: 2, // Ecuador — GPI 129
  EG: 2, // Egypt — GPI 107
  GH: 2, // Ghana — GPI 62
  GT: 2, // Guatemala — GPI 108
  GW: 2, // Guinea-Bissau — GPI 101
  HN: 2, // Honduras — GPI 124
  IN: 2, // India — GPI 117
  JM: 2, // Jamaica — GPI 92
  KE: 2, // Kenya — GPI 127
  KG: 2, // Kyrgyzstan — GPI 84
  LR: 2, // Liberia — GPI 94
  MG: 2, // Madagascar — GPI 61
  MR: 2, // Mauritania — GPI 112
  MX: 2, // Mexico — GPI 135
  MZ: 2, // Mozambique — GPI 121
  PE: 2, // Peru — GPI 68
  PG: 2, // Papua New Guinea — GPI 118
  PH: 2, // Philippines — GPI 105
  SL: 2, // Sierra Leone — GPI 58
  SN: 2, // Senegal — GPI 52
  SV: 2, // El Salvador — GPI 104
  TG: 2, // Togo — GPI 126
  TJ: 2, // Tajikistan — GPI 85
  TM: 2, // Turkmenistan — GPI 87
  TR: 2, // Turkey — GPI 146
  TT: 2, // Trinidad & Tobago — GPI 88
  TZ: 2, // Tanzania — GPI 55
  UG: 2, // Uganda — GPI 115
  ZA: 2, // South Africa — GPI 125
  ZW: 2, // Zimbabwe — GPI 116
}

// Multiplier applied to overall score per safety tier
// Tier 1: no penalty, Tier 2: barely noticeable, Tier 3: significant, Tier 4: severe
export const SAFETY_MULTIPLIER: Record<number, number> = {
  1: 1.0,
  2: 0.95,
  3: 0.75,
  4: 0.35,
}

export function safetyMultiplier(countryCode: string): number {
  return SAFETY_MULTIPLIER[SAFETY_TIER[countryCode] ?? 1]
}

export function safetyLabel(countryCode: string): string | null {
  const tier = SAFETY_TIER[countryCode] ?? 1
  if (tier === 1) return null
  if (tier === 2) return 'Caution'
  if (tier === 3) return 'Risky'
  return 'Avoid'
}

// ── Ski lift day-pass prices (USD, 2024-25 season avg) ──────────────
export const SKI_LIFT_PRICE: Record<string, number> = {
  US: 155, AU: 130, AR: 115, CH: 105, NZ: 95,
  AT: 86, CA: 75, FR: 75, NO: 72, IT: 72, DE: 72,
  CL: 70, ES: 70, SE: 68, AD: 68, KR: 65, ZA: 60,
  BG: 55, CN: 55, SI: 52, JP: 50, CZ: 50, RO: 50,
  BA: 48, SK: 48, PL: 47, GB: 45, RS: 45, TR: 40,
  GR: 38, LB: 35, GE: 25, MA: 25, IR: 20, ME: 18,
  MK: 12, IN: 10,
}

// ── Overall score ─────────────────────────────────────────────────────
import { cuisineScore } from './cuisineScore'

/**
 * Overall score: bestTime (75%) + cost (25%), × safety.
 * When skiing selected, lift pass price blends into the cost component.
 * When food selected, cuisine quality blends into the score.
 */
export function overallScore(bestTimeScore: number, countryCode: string, activities: string[] = []): number {
  const costTier = COST_INDEX[countryCode] ?? 3
  const baseCostValue = 120 - costTier * 20 // 1→100, 2→80, 3→60, 4→40, 5→20

  // When skiing selected, blend lift pass cost into cost score
  const hasSkiing = activities.includes('skiing')
  let costValue = baseCostValue
  if (hasSkiing) {
    const liftPrice = SKI_LIFT_PRICE[countryCode] ?? 60
    // Map $10–$180 to 100–0 (cheaper = better)
    const liftScore = Math.max(0, Math.min(100, 100 * (1 - (liftPrice - 10) / 170)))
    costValue = baseCostValue * 0.5 + liftScore * 0.5
  }

  const hasFood = activities.includes('food')
  const raw = hasFood
    ? bestTimeScore * 0.55 + costValue * 0.20 + cuisineScore(countryCode) * 0.25
    : bestTimeScore * 0.75 + costValue * 0.25
  return raw * safetyMultiplier(countryCode)
}

/** Skiing cost label: base budget + lift pass */
export function skiCostLabel(countryCode: string): string | null {
  const lift = SKI_LIFT_PRICE[countryCode]
  return lift ? `+€${Math.round(lift * 0.95)}/day lift pass` : null
}

// ── Overall score breakdown (for visualization) ──────────────────────

export interface OverallBreakdown {
  factors: { key: string; label: string; score: number; weight: number }[]
  safety: { multiplier: number; tier: number }
  finalScore: number
}

/** Decompose overallScore into its components for visualization. */
export function overallScoreBreakdown(
  bestTime: number, countryCode: string, activities: string[] = [],
): OverallBreakdown {
  const costTier = COST_INDEX[countryCode] ?? 3
  const baseCostValue = 120 - costTier * 20

  const hasSkiing = activities.includes('skiing')
  let costValue = baseCostValue
  if (hasSkiing) {
    const liftPrice = SKI_LIFT_PRICE[countryCode] ?? 60
    const liftScore = Math.max(0, Math.min(100, 100 * (1 - (liftPrice - 10) / 170)))
    costValue = baseCostValue * 0.5 + liftScore * 0.5
  }

  const hasFood = activities.includes('food')
  const factors: OverallBreakdown['factors'] = hasFood
    ? [
        { key: 'bestTime', label: 'Best Time', score: Math.round(bestTime), weight: 0.55 },
        { key: 'cost', label: 'Cost', score: Math.round(costValue), weight: 0.20 },
        { key: 'cuisine', label: 'Cuisine', score: Math.round(cuisineScore(countryCode)), weight: 0.25 },
      ]
    : [
        { key: 'bestTime', label: 'Best Time', score: Math.round(bestTime), weight: 0.75 },
        { key: 'cost', label: 'Cost', score: Math.round(costValue), weight: 0.25 },
      ]

  const tier = SAFETY_TIER[countryCode] ?? 1
  const mult = SAFETY_MULTIPLIER[tier]

  return {
    factors,
    safety: { multiplier: mult, tier },
    finalScore: Math.round(overallScore(bestTime, countryCode, activities)),
  }
}
