export interface SeasonalAdvisory {
  months: number[]
  penalty: number           // < 1 = penalty, > 1 = boost
  label: string
  emoji: string
  activities?: string[]     // omit = applies to all activities
}

export const SEASONAL_ADVISORIES: Record<string, SeasonalAdvisory[]> = {

  // ╔══════════════════════════════════════════════════════════════╗
  // ║  PENALTIES — conditions that degrade the travel experience  ║
  // ╚══════════════════════════════════════════════════════════════╝

  // === RICE PADDY SEASONS (brown/harvested — landscape not photogenic) ===
  'id-bali': [
    { months: [8, 9, 10], penalty: 0.7, label: 'Brown rice paddies', emoji: '🌾' },
  ],
  'vn-sapa-highlands': [
    { months: [11, 12, 1, 2], penalty: 0.7, label: 'Brown rice terraces', emoji: '🌾' },
  ],
  'vn-hanoi-delta': [
    { months: [11, 12, 1, 2], penalty: 0.8, label: 'Off-season rice paddies', emoji: '🌾' },
  ],
  'ph-palawan': [
    { months: [10, 11], penalty: 0.8, label: 'Harvested rice paddies', emoji: '🌾' },
  ],

  // === JELLYFISH / STINGER SEASONS ===
  'th-gulf-coast': [
    { months: [6, 7, 8, 9], penalty: 0.5, label: 'Jellyfish season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
  ],
  'th-andaman-coast': [
    { months: [5, 6, 7, 8, 9, 10], penalty: 0.5, label: 'Jellyfish season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
  ],
  'au-queensland': [
    { months: [11, 12, 1, 2, 3, 4, 5], penalty: 0.5, label: 'Stinger season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
    { months: [2, 3, 4], penalty: 0.7, label: 'Coral bleaching risk', emoji: '🤍', activities: ['diving', 'snorkelling', 'freediving'] },
  ],
  'my-perhentian-east': [
    { months: [6, 7, 8], penalty: 0.6, label: 'Jellyfish season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
  ],
  'es-balearic': [
    { months: [7, 8], penalty: 0.8, label: 'Jellyfish blooms', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
  ],

  // === BURNING / HAZE SEASON (air quality) ===
  'th-chiang-mai-north': [
    { months: [2, 3, 4], penalty: 0.4, label: 'Burning season smoke', emoji: '🔥' },
  ],
  'my-borneo-sabah': [
    { months: [8, 9, 10], penalty: 0.6, label: 'Haze season', emoji: '🌫️' },
  ],
  'my-borneo-sarawak': [
    { months: [8, 9, 10], penalty: 0.6, label: 'Haze season', emoji: '🌫️' },
  ],

  // === EXTREME HEAT ===
  'au-outback': [
    { months: [12, 1, 2], penalty: 0.5, label: 'Extreme heat', emoji: '🥵', activities: ['hiking', 'camping', 'cycling'] },
    { months: [9, 10, 11, 12, 1, 2, 3], penalty: 0.8, label: 'Crocodile nesting season', emoji: '🐊', activities: ['beach', 'diving', 'snorkelling'] },
  ],

  // === SARGASSUM SEAWEED ===
  'mx-riviera-maya': [
    { months: [5, 6, 7, 8], penalty: 0.6, label: 'Sargassum seaweed season', emoji: '🟤', activities: ['beach', 'diving', 'snorkelling'] },
  ],

  // === OVERCROWDING ===
  'jp-kyoto-kansai': [
    { months: [3, 4], penalty: 1.1, label: 'Cherry blossom season', emoji: '🌸' },
    { months: [4], penalty: 0.85, label: 'Cherry blossom overcrowding', emoji: '🏯' },
    { months: [6, 7], penalty: 0.7, label: 'Tsuyu rainy season', emoji: '☔' },
  ],
  'jp-tokyo-kanto': [
    { months: [6, 7], penalty: 0.7, label: 'Tsuyu rainy season', emoji: '☔' },
    { months: [3, 4], penalty: 1.1, label: 'Cherry blossom season', emoji: '🌸' },
  ],
  'jp-okinawa-main': [
    { months: [5, 6], penalty: 0.7, label: 'Tsuyu rainy season', emoji: '☔' },
  ],

  // === SANDFLY / MIDGE SEASONS ===
  'nz-fiordland': [
    { months: [12, 1, 2], penalty: 0.7, label: 'Sandfly season', emoji: '🦟', activities: ['hiking', 'camping'] },
  ],
  'nz-queenstown': [
    { months: [12, 1, 2], penalty: 0.8, label: 'Sandfly season', emoji: '🦟', activities: ['hiking', 'camping'] },
  ],
  'gb-scotland': [
    { months: [6, 7, 8], penalty: 0.6, label: 'Midge season', emoji: '🦟', activities: ['hiking', 'camping'] },
  ],
  'ie-wildatlantic': [
    { months: [6, 7, 8], penalty: 0.7, label: 'Midge season', emoji: '🦟', activities: ['hiking', 'camping'] },
  ],

  // === SAHARAN DUST (Calima) ===
  'es-canary': [
    { months: [1, 2, 3], penalty: 0.6, label: 'Saharan dust (Calima)', emoji: '🏜️' },
  ],
  'bb-barbados': [
    { months: [6, 7, 8], penalty: 0.7, label: 'Saharan dust haze', emoji: '🏜️' },
  ],
  'tt-trinidad': [
    { months: [6, 7, 8], penalty: 0.7, label: 'Saharan dust haze', emoji: '🏜️' },
  ],

  // === KHAMSIN / SHARAV DUST STORMS ===
  'il-jerusalem': [
    { months: [3, 4, 5], penalty: 0.6, label: 'Khamsin dust storms', emoji: '🏜️' },
  ],
  'il-telaviv': [
    { months: [3, 4, 5], penalty: 0.7, label: 'Khamsin dust storms', emoji: '🏜️' },
  ],
  'jo-petra': [
    { months: [3, 4, 5], penalty: 0.6, label: 'Khamsin dust storms', emoji: '🏜️' },
  ],
  'jo-aqaba': [
    { months: [3, 4, 5], penalty: 0.7, label: 'Khamsin dust storms', emoji: '🏜️' },
  ],
  'eg-cairo-nile': [
    { months: [3, 4, 5], penalty: 0.6, label: 'Khamsin dust storms', emoji: '🏜️' },
  ],
  'eg-luxor-upper': [
    { months: [3, 4, 5], penalty: 0.6, label: 'Khamsin dust storms', emoji: '🏜️' },
  ],

  // === DIWALI POLLUTION SPIKE ===
  'in-delhi': [
    { months: [10, 11], penalty: 0.4, label: 'Severe air pollution', emoji: '😷' },
  ],
  'in-kolkata': [
    { months: [10, 11], penalty: 0.6, label: 'Air pollution spike', emoji: '😷' },
  ],

  // === CORAL BLEACHING ===
  'mv-atolls': [
    { months: [4, 5], penalty: 0.7, label: 'Coral bleaching risk', emoji: '🤍', activities: ['diving', 'snorkelling', 'freediving'] },
  ],

  // === RED TIDE / ALGAL BLOOMS ===
  'us-southeast': [
    { months: [8, 9, 10, 11], penalty: 0.6, label: 'Red tide risk', emoji: '🦠', activities: ['beach', 'diving', 'snorkelling'] },
  ],
  'fr-brittany': [
    { months: [6, 7, 8, 9], penalty: 0.7, label: 'Green algae blooms', emoji: '🦠', activities: ['beach'] },
  ],

  // === ARCTIC MOSQUITOES ===
  'is-north': [
    { months: [6, 7, 8], penalty: 0.8, label: 'Midge swarms (Myvatn)', emoji: '🦟', activities: ['hiking', 'camping'] },
    { months: [9, 10, 11, 12, 1, 2, 3], penalty: 1.15, label: 'Northern lights season', emoji: '🌌' },
  ],
  'fi-lapland': [
    { months: [6, 7, 8], penalty: 0.7, label: 'Mosquito season', emoji: '🦟', activities: ['hiking', 'camping'] },
  ],
  'se-lapland': [
    { months: [6, 7, 8], penalty: 0.7, label: 'Mosquito season', emoji: '🦟', activities: ['hiking', 'camping'] },
  ],

  // === FOG SEASON ===
  'us-california': [
    { months: [6, 7, 8], penalty: 0.85, label: 'Coastal fog season', emoji: '🌫️', activities: ['beach'] },
  ],

  // === VOLCANIC SMOG ===
  'us-hawaii': [
    { months: [10, 11, 12, 1, 2, 3, 4], penalty: 0.8, label: 'Volcanic smog (vog)', emoji: '🌋' },
  ],

  // === LAKE FLY SWARMS ===
  'mw-malawi': [
    { months: [3, 4, 5, 9, 10, 11], penalty: 0.7, label: 'Lake fly swarms', emoji: '🦟' },
  ],

  // === DROUGHT / WATER SHORTAGE ===
  'za-cape-town': [
    { months: [1, 2, 3, 4], penalty: 0.8, label: 'Drought risk season', emoji: '🏜️' },
  ],

  // === ROAD CLOSURES ===
  'ro-transylvania': [
    { months: [11, 12, 1, 2, 3, 4, 5, 6], penalty: 0.7, label: 'Transfagarasan closed', emoji: '🚧', activities: ['cycling', 'hiking'] },
  ],
  'us-mountain': [
    { months: [10, 11, 12, 1, 2, 3, 4, 5], penalty: 0.8, label: 'Mountain pass closures', emoji: '🚧', activities: ['hiking', 'cycling', 'camping'] },
  ],
  'in-himalaya': [
    { months: [11, 12, 1, 2, 3, 4, 5], penalty: 0.7, label: 'Mountain roads closed', emoji: '🚧', activities: ['hiking', 'cycling'] },
  ],

  // === BEAR HYPERPHAGIA ===
  'ca-rockies': [
    { months: [8, 9, 10], penalty: 0.85, label: 'Bear activity season', emoji: '🐻', activities: ['hiking', 'camping'] },
  ],
  'ca-vancouver': [
    { months: [8, 9, 10], penalty: 0.85, label: 'Bear activity season', emoji: '🐻', activities: ['hiking', 'camping'] },
  ],

  // ╔════════════════════════════════════════════════════════════════╗
  // ║  BOOSTS — seasonal events that enhance the travel experience  ║
  // ╚════════════════════════════════════════════════════════════════╝

  // === WILDEBEEST MIGRATION ===
  'tz-serengeti': [
    { months: [1, 2, 3], penalty: 1.2, label: 'Calving season', emoji: '🦓' },
  ],
  'ke-masaimara': [
    { months: [7, 8, 9, 10], penalty: 1.25, label: 'Great Migration river crossings', emoji: '🦓' },
  ],

  // === NORTHERN LIGHTS ===
  'no-tromso-arctic': [
    { months: [9, 10, 11, 12, 1, 2, 3], penalty: 1.15, label: 'Northern lights season', emoji: '🌌' },
  ],
  'no-lofoten': [
    { months: [9, 10, 11, 12, 1, 2, 3], penalty: 1.15, label: 'Northern lights season', emoji: '🌌' },
  ],
  'is-reykjavik-south': [
    { months: [9, 10, 11, 12, 1, 2, 3], penalty: 1.1, label: 'Northern lights season', emoji: '🌌' },
  ],
  'is-westfjords': [
    { months: [9, 10, 11, 12, 1, 2, 3], penalty: 1.15, label: 'Northern lights season', emoji: '🌌' },
  ],

  // === MONARCH BUTTERFLY MIGRATION ===
  'mx-mexico-city': [
    { months: [11, 12, 1, 2, 3], penalty: 1.15, label: 'Monarch butterfly migration', emoji: '🦋' },
  ],

  // === LAVENDER BLOOM ===
  'fr-provence': [
    { months: [6, 7], penalty: 1.15, label: 'Lavender bloom', emoji: '💜' },
  ],

  // === BIOLUMINESCENCE ===
  'pr-puerto-rico': [
    { months: [12, 1, 2, 3, 4, 5], penalty: 1.1, label: 'Bioluminescence season', emoji: '✨', activities: ['diving', 'beach', 'snorkelling'] },
  ],

  // === SARDINE RUN ===
  'za-durban-kzn': [
    { months: [6, 7], penalty: 1.2, label: 'Sardine Run', emoji: '🐟', activities: ['diving', 'snorkelling', 'freediving'] },
  ],

}

/** Combined multiplier for all applicable advisories on a region. */
export function seasonalPenalty(slug: string, months: number[], activities: string[]): number {
  const advisories = SEASONAL_ADVISORIES[slug]
  if (!advisories) return 1
  let multiplier = 1
  for (const adv of advisories) {
    if (!adv.months.some((m) => months.includes(m))) continue
    if (adv.activities && !adv.activities.some((a) => activities.includes(a))) continue
    multiplier *= adv.penalty
  }
  return multiplier
}

/** Returns advisories active for the given months and activities. */
export function activeAdvisories(slug: string, months: number[], activities: string[]): SeasonalAdvisory[] {
  const advisories = SEASONAL_ADVISORIES[slug]
  if (!advisories) return []
  return advisories.filter((adv) => {
    if (!adv.months.some((m) => months.includes(m))) return false
    if (adv.activities && !adv.activities.some((a) => activities.includes(a))) return false
    return true
  })
}
