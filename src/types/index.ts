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

// Busyness label from score
export function busynessLabel(score: number): string {
  const labels: Record<number, string> = {
    1: 'Very Quiet',
    2: 'Quiet',
    3: 'Moderate',
    4: 'Busy',
    5: 'Peak Season',
  }
  return labels[score] || 'Unknown'
}

// Busyness color from score
export function busynessColor(score: number): string {
  const colors: Record<number, string> = {
    1: '#3B7A4A',
    2: '#6BAF78',
    3: '#F5C842',
    4: '#D93B2B',
    5: '#8B1A10',
  }
  return colors[score] || '#999'
}
