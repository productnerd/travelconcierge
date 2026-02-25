// Daily travel budget tier per country (1=very cheap, 5=very expensive)
// Based on Numbeo Cost of Living Index + backpacker budget estimates
// 1: $15-25/day  2: $25-50/day  3: $50-100/day  4: $100-200/day  5: $200+/day

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
  TH: 1, TL: 2, TR: 2, TM: 2, AE: 4, UZ: 1, VN: 1, YE: 1,
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
  return '$'.repeat(tier)
}

// Travel advisory tier per country (1-4)
// 1: Normal — no significant travel concerns
// 2: Exercise caution — localized crime/petty theft but tourist-safe (e.g. South Africa, Brazil, Mexico)
// 3: Reconsider travel — significant instability, terrorism risk, or civil unrest
// 4: Do not travel — active conflict, war zones, extreme danger
// Only countries at tier 2+ are listed; unlisted countries default to tier 1.
// Based on combined UK FCDO, US State Dept, and AU Smartraveller advisories (Feb 2026).

export const SAFETY_TIER: Record<string, number> = {
  // Tier 4: Do not travel — active conflict / extreme danger
  AF: 4, // Afghanistan
  IQ: 4, // Iraq
  LY: 4, // Libya
  SO: 4, // Somalia
  SS: 4, // South Sudan
  SD: 4, // Sudan
  SY: 4, // Syria
  YE: 4, // Yemen
  KP: 4, // North Korea
  CF: 4, // Central African Republic

  // Tier 3: Reconsider travel — significant risk
  BI: 3, // Burundi
  TD: 3, // Chad
  CD: 3, // DRC
  ER: 3, // Eritrea
  HT: 3, // Haiti
  IR: 3, // Iran
  LB: 3, // Lebanon
  ML: 3, // Mali
  MM: 3, // Myanmar
  NE: 3, // Niger
  NG: 3, // Nigeria
  PK: 3, // Pakistan
  PS: 3, // Palestine
  VE: 3, // Venezuela
  BF: 3, // Burkina Faso
  GN: 3, // Guinea
  GW: 3, // Guinea-Bissau
  LR: 3, // Liberia
  MR: 3, // Mauritania
  SL: 3, // Sierra Leone
  TM: 3, // Turkmenistan
  UA: 3, // Ukraine (active conflict)

  // Tier 2: Exercise caution — localized crime but generally tourist-safe
  ZA: 2, // South Africa
  BR: 2, // Brazil
  MX: 2, // Mexico
  CO: 2, // Colombia
  PE: 2, // Peru
  EC: 2, // Ecuador
  KE: 2, // Kenya
  UG: 2, // Uganda
  TZ: 2, // Tanzania
  ET: 2, // Ethiopia
  EG: 2, // Egypt
  DZ: 2, // Algeria
  JM: 2, // Jamaica
  TT: 2, // Trinidad & Tobago
  HN: 2, // Honduras
  SV: 2, // El Salvador
  GT: 2, // Guatemala
  BD: 2, // Bangladesh
  IN: 2, // India
  PH: 2, // Philippines
  TJ: 2, // Tajikistan
  KG: 2, // Kyrgyzstan
  CM: 2, // Cameroon
  MZ: 2, // Mozambique
  PG: 2, // Papua New Guinea
  CG: 2, // Congo Republic
  TG: 2, // Togo
  BJ: 2, // Benin
  GH: 2, // Ghana
  SN: 2, // Senegal
  CI: 2, // Côte d'Ivoire
  MG: 2, // Madagascar
  AO: 2, // Angola
  ZW: 2, // Zimbabwe
  BY: 2, // Belarus
  RU: 2, // Russia
  TR: 2, // Turkey
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
