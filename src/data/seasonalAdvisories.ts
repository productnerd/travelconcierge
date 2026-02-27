export interface SeasonalAdvisory {
  months: number[]
  penalty: number
  label: string
  emoji: string
  activities?: string[]
}

export const SEASONAL_ADVISORIES: Record<string, SeasonalAdvisory[]> = {
  // === RICE PADDY SEASONS (brown/harvested paddies — landscape not photogenic) ===
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

  // === JELLYFISH SEASONS (dangerous for water activities) ===
  'th-gulf-coast': [
    { months: [6, 7, 8, 9], penalty: 0.5, label: 'Jellyfish season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
  ],
  'th-andaman-coast': [
    { months: [5, 6, 7, 8, 9, 10], penalty: 0.5, label: 'Jellyfish season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
  ],
  'au-queensland': [
    { months: [11, 12, 1, 2, 3, 4, 5], penalty: 0.5, label: 'Stinger season', emoji: '🪼', activities: ['diving', 'beach', 'freediving', 'snorkelling'] },
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

  // === EXTREME HEAT (beyond what temp data captures — dangerous conditions) ===
  'au-outback': [
    { months: [12, 1, 2], penalty: 0.5, label: 'Extreme heat', emoji: '🥵', activities: ['hiking', 'camping', 'cycling'] },
  ],

  // === SARGASSUM SEAWEED (beaches covered in rotting seaweed) ===
  'mx-riviera-maya': [
    { months: [5, 6, 7, 8], penalty: 0.6, label: 'Sargassum seaweed season', emoji: '🟤', activities: ['beach', 'diving', 'snorkelling'] },
  ],

  // === OVERCROWDING beyond busyness data ===
  'jp-kyoto-kansai': [
    { months: [4], penalty: 0.85, label: 'Cherry blossom overcrowding', emoji: '🌸' },
  ],
}

/** Combined multiplier for all applicable advisories on a region. */
export function seasonalPenalty(slug: string, months: number[], activities: string[]): number {
  const advisories = SEASONAL_ADVISORIES[slug]
  if (!advisories) return 1
  let penalty = 1
  for (const adv of advisories) {
    if (!adv.months.some((m) => months.includes(m))) continue
    if (adv.activities && !adv.activities.some((a) => activities.includes(a))) continue
    penalty *= adv.penalty
  }
  return penalty
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
