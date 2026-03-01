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
  CH: 'Europe', UA: 'Europe', GB: 'Europe', VA: 'Europe', FO: 'Europe', GL: 'Europe',
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
  PF: 5, AW: 4, TC: 5, CK: 4, FO: 5, RE: 4, CW: 3, GP: 3, MQ: 3, BM: 5, PR: 3, GL: 5,
}

export function costLabel(tier: number): string {
  return '€'.repeat(tier)
}

// Travel advisory tier per country (1-4) — calibrated for TOURIST SAFETY
// 1: Normal — no significant travel concerns (default for unlisted countries)
// 2: Exercise caution — localized crime/petty theft but tourist-safe
// 3: Reconsider travel — significant instability, terrorism risk, or civil unrest
// 4: Do not travel — active conflict, war zones, extreme danger
// Sources: FCDO, US State Dept, DFAT advisories cross-referenced with tourist reports.
// Updated March 2026 to reflect US-Iran/Venezuela escalation and Israel-Lebanon conflict.

export const SAFETY_TIER: Record<string, number> = {
  // Tier 4: Do not travel — active conflict / extreme danger
  AF: 4, // Afghanistan — active insurgency, no tourist infrastructure
  BF: 4, // Burkina Faso — jihadist insurgency, kidnapping risk
  CD: 4, // DR Congo — armed groups, especially east
  CF: 4, // Central African Republic — armed conflict, lawlessness
  HT: 4, // Haiti — state collapse, gang control of Port-au-Prince
  IL: 4, // Israel — active conflict, rocket strikes on Tel Aviv (Mar 2026)
  IR: 4, // Iran — US strikes ongoing, retaliating against Israel (Mar 2026)
  KP: 4, // North Korea — no independent tourism permitted
  LB: 4, // Lebanon — caught in Israel/Iran regional conflict escalation
  LY: 4, // Libya — rival governments, militia violence
  ML: 4, // Mali — jihadist insurgency, kidnapping risk
  MM: 4, // Myanmar — civil war, martial law zones
  NE: 4, // Niger — military coup, jihadist spillover
  SD: 4, // Sudan — civil war between army and RSF
  SO: 4, // Somalia — al-Shabaab, clan conflict
  SS: 4, // South Sudan — civil conflict, famine
  SY: 4, // Syria — post-conflict instability, unexploded ordnance
  UA: 4, // Ukraine — active war, Russian invasion
  VE: 4, // Venezuela — US strikes, severe instability (Mar 2026)
  YE: 4, // Yemen — civil war, Houthi attacks

  // Tier 3: Reconsider travel — significant risk
  BI: 3, // Burundi — political repression, sporadic violence
  BY: 3, // Belarus — authoritarian regime, arbitrary detention risk
  CM: 3, // Cameroon — anglophone crisis, Boko Haram in north
  ER: 3, // Eritrea — authoritarian, restricted movement
  ET: 3, // Ethiopia — ethnic conflicts, Tigray aftermath
  GN: 3, // Guinea — military junta, civil unrest
  IQ: 3, // Iraq — Kurdistan increasingly touristed, Baghdad improving, still risky
  NG: 3, // Nigeria — kidnapping risk, Boko Haram in northeast
  PK: 3, // Pakistan — terrorism risk, Balochistan/KPK unsafe
  PS: 3, // Palestine — occupation, Gaza devastation
  TD: 3, // Chad — armed groups, cross-border instability

  // Tier 2: Exercise caution — localized crime but generally tourist-safe
  AO: 2, // Angola — petty crime, limited tourist infrastructure
  BD: 2, // Bangladesh — political instability, petty crime
  BJ: 2, // Benin — petty crime, limited infrastructure
  BR: 2, // Brazil — urban crime hotspots, tourist areas manageable
  CG: 2, // Congo Republic — petty crime, limited infrastructure
  CI: 2, // Côte d'Ivoire — stable but northern border areas risky
  CO: 2, // Colombia — much improved, some rural areas risky
  DZ: 2, // Algeria — border areas risky, cities generally safe
  EC: 2, // Ecuador — rising gang violence, tourist areas OK
  EG: 2, // Egypt — Sinai risky, main tourist sites safe
  GH: 2, // Ghana — petty crime, generally safe
  GT: 2, // Guatemala — urban crime, tourist routes OK
  GW: 2, // Guinea-Bissau — political instability, drug trafficking
  HN: 2, // Honduras — gang violence in cities, Bay Islands safe
  IN: 2, // India — scams, petty crime; vast majority of tourists fine
  JM: 2, // Jamaica — violent crime in specific areas, resorts safe
  KE: 2, // Kenya — petty crime, some border areas risky
  KG: 2, // Kyrgyzstan — petty crime, remote areas challenging
  LR: 2, // Liberia — limited infrastructure, petty crime
  MG: 2, // Madagascar — petty crime, limited infrastructure
  MR: 2, // Mauritania — border areas risky, cities OK
  MX: 2, // Mexico — cartel violence in specific states, tourist zones safe
  MZ: 2, // Mozambique — northern insurgency, south safe
  PE: 2, // Peru — petty crime in cities, tourist trail safe
  PG: 2, // Papua New Guinea — tribal conflict, limited infrastructure
  PH: 2, // Philippines — Mindanao risky, main islands fine
  RU: 2, // Russia — Moscow/St Petersburg safe; conflict is in Ukraine
  SL: 2, // Sierra Leone — petty crime, limited infrastructure
  SN: 2, // Senegal — generally safe, petty crime
  SV: 2, // El Salvador — improving, gang presence still
  TG: 2, // Togo — petty crime, northern border risky
  TJ: 2, // Tajikistan — border areas risky, cities OK
  TM: 2, // Turkmenistan — authoritarian but safe for tourists
  TR: 2, // Turkey — border areas risky, Istanbul/coast safe
  TT: 2, // Trinidad & Tobago — violent crime in specific areas
  TZ: 2, // Tanzania — petty crime, safari areas safe
  UG: 2, // Uganda — generally safe, DRC border risky
  ZA: 2, // South Africa — high crime, tourist areas manageable with caution
  ZW: 2, // Zimbabwe — economic hardship, tourists generally fine
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
