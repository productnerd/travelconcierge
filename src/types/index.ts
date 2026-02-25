export interface Region {
  id: string
  slug: string
  name: string
  country_code: string
  country_name: string
  geojson_id: string
  description: string | null
  landscape_type: string[]
  activities: string[]
  cuisine_tags: string[]
  centroid_lat: number
  centroid_lon: number
  is_coastal: boolean
  created_at: string
}

export interface RegionMonth {
  id: string
  region_id: string
  month: number
  busyness: number
  busyness_label: string | null
  temp_avg_c: number | null
  temp_min_c: number | null
  temp_max_c: number | null
  rainfall_mm: number | null
  sunshine_hours_day: number | null
  humidity_pct: number | null
  wind_speed_kmh: number | null
  cloud_cover_pct: number | null
  has_monsoon: boolean
  sea_temp_c: number | null
  summary: string | null
}

export interface RegionWithMonths extends Region {
  travel_region_months: RegionMonth[]
}

export interface Activity {
  id: string
  slug: string
  name: string
  icon: string | null
}

export interface Shortlist {
  id: string
  share_token: string
  region_slugs: string[]
  filter_state: Record<string, unknown> | null
  created_at: string
}

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
  toolCalls?: AgentToolCall[]
  decisionQuestion?: DecisionQuestion
}

export interface AgentToolCall {
  name: string
  input: Record<string, unknown>
  result?: unknown
}

export interface DecisionQuestion {
  question: string
  options: {
    label: string
    eliminates?: string[]
  }[]
}

// Country code to flag emoji
export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65))
    .join('')
}

// Busyness label from score (1–10 scale)
export function busynessLabel(score: number): string {
  if (score <= 2) return 'Very Quiet'
  if (score <= 4) return 'Quiet'
  if (score <= 6) return 'Moderate'
  if (score <= 8) return 'Busy'
  return 'Peak Season'
}

// Busyness color from score (1–10 scale, interpolated)
export function busynessColor(score: number): string {
  // Clamp to 1–10
  const s = Math.max(1, Math.min(10, score))
  // Gradient stops: 1=deep green, 4=light green, 6=yellow, 8=red, 10=dark red
  const stops: [number, [number, number, number]][] = [
    [1, [59, 122, 74]],   // #3B7A4A
    [4, [107, 175, 120]], // #6BAF78
    [6, [245, 200, 66]],  // #F5C842
    [8, [217, 59, 43]],   // #D93B2B
    [10, [139, 26, 16]],  // #8B1A10
  ]
  // Find surrounding stops
  for (let i = 0; i < stops.length - 1; i++) {
    const [lo, cLo] = stops[i]
    const [hi, cHi] = stops[i + 1]
    if (s <= hi) {
      const t = (s - lo) / (hi - lo)
      const r = Math.round(cLo[0] + t * (cHi[0] - cLo[0]))
      const g = Math.round(cLo[1] + t * (cHi[1] - cLo[1]))
      const b = Math.round(cLo[2] + t * (cHi[2] - cLo[2]))
      return `rgb(${r},${g},${b})`
    }
  }
  return '#8B1A10'
}
