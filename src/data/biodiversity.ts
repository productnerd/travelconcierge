// ── Country-level biodiversity data ──────────────────────────────────
// Three components per country (0–100 scale):
//   index     — species richness (based on CBD National Biodiversity Index)
//   protected — % of territory under formal protection (based on WDPA)
//   marine    — marine species richness (based on OBIS; undefined for landlocked)
//
// Compound score rebalances automatically when a component is missing.

export interface BioData {
  index: number
  protected: number
  marine?: number
}

export const BIODIVERSITY: Record<string, BioData> = {
  // ── Europe ──────────────────────────────────────────────────────────
  AL: { index: 48, protected: 18, marine: 42 },
  AD: { index: 15, protected: 25 },
  AT: { index: 38, protected: 29 },
  BY: { index: 30, protected: 9 },
  BE: { index: 28, protected: 14, marine: 35 },
  BA: { index: 42, protected: 4 },
  BG: { index: 44, protected: 35, marine: 45 },
  HR: { index: 50, protected: 38, marine: 58 },
  CY: { index: 35, protected: 19, marine: 52 },
  CZ: { index: 32, protected: 22 },
  DK: { index: 30, protected: 16, marine: 48 },
  EE: { index: 34, protected: 23, marine: 40 },
  FI: { index: 30, protected: 15, marine: 35 },
  FR: { index: 52, protected: 32, marine: 65 },
  DE: { index: 34, protected: 38, marine: 40 },
  GR: { index: 55, protected: 35, marine: 72 },
  HU: { index: 35, protected: 23 },
  IS: { index: 22, protected: 25, marine: 55 },
  IE: { index: 28, protected: 14, marine: 45 },
  IT: { index: 56, protected: 22, marine: 70 },
  XK: { index: 30, protected: 12 },
  LV: { index: 32, protected: 18, marine: 35 },
  LI: { index: 18, protected: 42 },
  LT: { index: 30, protected: 17, marine: 34 },
  LU: { index: 18, protected: 52 },
  MT: { index: 20, protected: 28, marine: 48 },
  MD: { index: 25, protected: 5 },
  MC: { index: 12, protected: 10, marine: 40 },
  ME: { index: 46, protected: 10, marine: 50 },
  NL: { index: 28, protected: 26, marine: 42 },
  MK: { index: 38, protected: 10 },
  NO: { index: 32, protected: 17, marine: 58 },
  PL: { index: 34, protected: 40, marine: 38 },
  PT: { index: 48, protected: 22, marine: 62 },
  RO: { index: 40, protected: 23, marine: 38 },
  RU: { index: 42, protected: 13, marine: 48 },
  SM: { index: 12, protected: 10 },
  RS: { index: 40, protected: 8 },
  SK: { index: 36, protected: 38 },
  SI: { index: 45, protected: 54, marine: 50 },
  ES: { index: 55, protected: 28, marine: 68 },
  SE: { index: 30, protected: 15, marine: 42 },
  CH: { index: 32, protected: 13 },
  UA: { index: 36, protected: 7, marine: 35 },
  GB: { index: 32, protected: 28, marine: 52 },
  VA: { index: 5, protected: 0 },
  FO: { index: 18, protected: 5, marine: 45 },
  GL: { index: 20, protected: 42, marine: 55 },

  // ── Asia ─────────────────────────────────────────────────────────────
  AF: { index: 28, protected: 4 },
  AM: { index: 32, protected: 12 },
  AZ: { index: 35, protected: 10 },
  BH: { index: 18, protected: 8, marine: 32 },
  BD: { index: 52, protected: 5, marine: 48 },
  BT: { index: 55, protected: 52 },
  BN: { index: 72, protected: 44, marine: 68 },
  KH: { index: 58, protected: 26, marine: 42 },
  CN: { index: 78, protected: 18, marine: 62 },
  GE: { index: 42, protected: 12, marine: 38 },
  IN: { index: 82, protected: 8, marine: 72 },
  ID: { index: 95, protected: 14, marine: 98 },
  IR: { index: 48, protected: 10, marine: 38 },
  IQ: { index: 25, protected: 3, marine: 22 },
  IL: { index: 38, protected: 20, marine: 52 },
  JP: { index: 62, protected: 21, marine: 88 },
  JO: { index: 25, protected: 11, marine: 42 },
  KZ: { index: 35, protected: 9 },
  KW: { index: 15, protected: 2, marine: 28 },
  KG: { index: 30, protected: 7 },
  LA: { index: 58, protected: 17 },
  LB: { index: 32, protected: 3, marine: 42 },
  MY: { index: 88, protected: 19, marine: 82 },
  MV: { index: 35, protected: 3, marine: 78 },
  MM: { index: 68, protected: 7, marine: 55 },
  MN: { index: 28, protected: 21 },
  NP: { index: 52, protected: 24 },
  KP: { index: 40, protected: 5, marine: 38 },
  OM: { index: 32, protected: 5, marine: 52 },
  PK: { index: 42, protected: 13, marine: 38 },
  PS: { index: 22, protected: 2, marine: 30 },
  PH: { index: 88, protected: 16, marine: 92 },
  QA: { index: 15, protected: 6, marine: 28 },
  SA: { index: 28, protected: 6, marine: 42 },
  SG: { index: 22, protected: 8, marine: 48 },
  KR: { index: 42, protected: 17, marine: 65 },
  LK: { index: 68, protected: 30, marine: 70 },
  SY: { index: 28, protected: 3, marine: 30 },
  TW: { index: 52, protected: 20, marine: 72 },
  TJ: { index: 30, protected: 22 },
  TH: { index: 72, protected: 19, marine: 78 },
  TL: { index: 48, protected: 8, marine: 65 },
  TR: { index: 50, protected: 10, marine: 55 },
  TM: { index: 28, protected: 4 },
  AE: { index: 18, protected: 15, marine: 38 },
  UZ: { index: 25, protected: 5 },
  VN: { index: 78, protected: 10, marine: 75 },
  YE: { index: 32, protected: 1, marine: 48 },
  HK: { index: 25, protected: 42, marine: 45 },

  // ── North America & Caribbean ────────────────────────────────────────
  US: { index: 70, protected: 26, marine: 72 },
  CA: { index: 55, protected: 13, marine: 62 },
  AG: { index: 22, protected: 12, marine: 55 },
  BS: { index: 28, protected: 14, marine: 68 },
  BB: { index: 20, protected: 2, marine: 55 },
  BZ: { index: 65, protected: 37, marine: 72 },
  CR: { index: 85, protected: 28, marine: 78 },
  CU: { index: 62, protected: 22, marine: 72 },
  DM: { index: 45, protected: 22, marine: 58 },
  DO: { index: 42, protected: 25, marine: 55 },
  SV: { index: 35, protected: 8, marine: 38 },
  GD: { index: 28, protected: 4, marine: 52 },
  GT: { index: 65, protected: 32, marine: 52 },
  HT: { index: 38, protected: 4, marine: 35 },
  HN: { index: 58, protected: 24, marine: 62 },
  JM: { index: 45, protected: 18, marine: 58 },
  KN: { index: 22, protected: 5, marine: 50 },
  LC: { index: 32, protected: 16, marine: 55 },
  VC: { index: 28, protected: 14, marine: 52 },
  TT: { index: 38, protected: 14, marine: 52 },
  NI: { index: 55, protected: 38, marine: 48 },
  PA: { index: 78, protected: 26, marine: 75 },
  MX: { index: 90, protected: 15, marine: 78 },
  AW: { index: 18, protected: 5, marine: 48 },
  TC: { index: 20, protected: 32, marine: 62 },
  CW: { index: 18, protected: 8, marine: 52 },
  GP: { index: 35, protected: 18, marine: 55 },
  MQ: { index: 35, protected: 20, marine: 52 },
  BM: { index: 15, protected: 10, marine: 50 },
  PR: { index: 42, protected: 8, marine: 58 },

  // ── South America ────────────────────────────────────────────────────
  AR: { index: 58, protected: 9, marine: 55 },
  BO: { index: 68, protected: 23 },
  BR: { index: 98, protected: 30, marine: 78 },
  CL: { index: 52, protected: 21, marine: 58 },
  CO: { index: 92, protected: 15, marine: 72 },
  EC: { index: 88, protected: 20, marine: 85 },
  GY: { index: 62, protected: 9, marine: 42 },
  PY: { index: 42, protected: 7 },
  PE: { index: 82, protected: 18, marine: 72 },
  SR: { index: 58, protected: 14, marine: 38 },
  UY: { index: 32, protected: 4, marine: 42 },
  VE: { index: 72, protected: 54, marine: 62 },

  // ── Africa ───────────────────────────────────────────────────────────
  DZ: { index: 30, protected: 7, marine: 35 },
  AO: { index: 52, protected: 7, marine: 48 },
  BJ: { index: 35, protected: 27, marine: 35 },
  BW: { index: 48, protected: 30 },
  BF: { index: 30, protected: 16 },
  BI: { index: 35, protected: 6 },
  CV: { index: 22, protected: 5, marine: 42 },
  CM: { index: 62, protected: 12, marine: 45 },
  CF: { index: 42, protected: 18 },
  TD: { index: 28, protected: 10 },
  KM: { index: 38, protected: 5, marine: 55 },
  CG: { index: 55, protected: 14, marine: 38 },
  CD: { index: 68, protected: 14 },
  CI: { index: 42, protected: 23, marine: 38 },
  DJ: { index: 22, protected: 2, marine: 42 },
  GQ: { index: 52, protected: 19, marine: 48 },
  ER: { index: 25, protected: 5, marine: 45 },
  SZ: { index: 28, protected: 4 },
  ET: { index: 52, protected: 18 },
  GA: { index: 65, protected: 26, marine: 52 },
  GM: { index: 25, protected: 5, marine: 32 },
  GH: { index: 40, protected: 15, marine: 38 },
  GN: { index: 38, protected: 7, marine: 35 },
  GW: { index: 30, protected: 15, marine: 38 },
  KE: { index: 62, protected: 12, marine: 65 },
  LS: { index: 22, protected: 1 },
  LR: { index: 42, protected: 4, marine: 32 },
  LY: { index: 20, protected: 1, marine: 25 },
  MG: { index: 90, protected: 17, marine: 72 },
  MW: { index: 38, protected: 17 },
  ML: { index: 25, protected: 9 },
  MR: { index: 22, protected: 4, marine: 35 },
  MU: { index: 32, protected: 5, marine: 55 },
  MZ: { index: 55, protected: 26, marine: 68 },
  NA: { index: 48, protected: 38, marine: 52 },
  NE: { index: 22, protected: 7 },
  NG: { index: 45, protected: 14, marine: 42 },
  RW: { index: 38, protected: 10 },
  ST: { index: 28, protected: 30, marine: 45 },
  SN: { index: 35, protected: 25, marine: 42 },
  SC: { index: 42, protected: 46, marine: 72 },
  SL: { index: 38, protected: 5, marine: 35 },
  SO: { index: 30, protected: 1, marine: 42 },
  ZA: { index: 72, protected: 15, marine: 65 },
  SS: { index: 35, protected: 8 },
  SD: { index: 30, protected: 5 },
  TG: { index: 30, protected: 11, marine: 30 },
  TN: { index: 28, protected: 8, marine: 40 },
  UG: { index: 55, protected: 16 },
  ZM: { index: 48, protected: 38 },
  ZW: { index: 42, protected: 28 },
  MA: { index: 38, protected: 30, marine: 48 },
  RE: { index: 35, protected: 42, marine: 58 },

  // ── Oceania ──────────────────────────────────────────────────────────
  AU: { index: 85, protected: 20, marine: 90 },
  FJ: { index: 48, protected: 6, marine: 72 },
  KI: { index: 20, protected: 12, marine: 55 },
  MH: { index: 18, protected: 3, marine: 52 },
  FM: { index: 25, protected: 4, marine: 58 },
  NR: { index: 10, protected: 0, marine: 28 },
  NZ: { index: 62, protected: 33, marine: 72 },
  PW: { index: 30, protected: 80, marine: 78 },
  PG: { index: 80, protected: 3, marine: 85 },
  WS: { index: 28, protected: 5, marine: 52 },
  SB: { index: 45, protected: 2, marine: 75 },
  TO: { index: 22, protected: 4, marine: 48 },
  TV: { index: 12, protected: 0, marine: 35 },
  VU: { index: 38, protected: 4, marine: 65 },
  PF: { index: 32, protected: 12, marine: 75 },
  CK: { index: 22, protected: 15, marine: 62 },
}

/**
 * Compound biodiversity score (0–100).
 * Rebalances weights when marine data is unavailable (landlocked countries).
 */
export function biodiversityScore(countryCode: string): number {
  const d = BIODIVERSITY[countryCode]
  if (!d) return 30 // default for unlisted

  if (d.marine !== undefined) {
    return d.index * 0.45 + d.protected * 0.25 + d.marine * 0.30
  }
  // Landlocked — rebalance without marine
  return d.index * 0.60 + d.protected * 0.40
}

/** List which metrics contributed to the score for a country. */
export function biodiversityMetrics(countryCode: string): string[] {
  const d = BIODIVERSITY[countryCode]
  if (!d) return []
  const m = ['Bio Index', 'Protected Areas']
  if (d.marine !== undefined) m.push('Marine')
  return m
}
