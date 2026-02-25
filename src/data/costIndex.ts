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
}

export function costLabel(tier: number): string {
  return '$'.repeat(tier)
}
