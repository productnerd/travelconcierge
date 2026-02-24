// Fetches 5-year historical climate data from Open-Meteo Archive API
// and computes monthly averages for each region.

const VARIABLES = [
  'temperature_2m_mean',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'sunshine_duration',
  'relative_humidity_2m_mean',
  'wind_speed_10m_max',
  'cloud_cover_mean',
].join(',')

interface MonthlyClimate {
  month: number
  temp_avg_c: number
  temp_min_c: number
  temp_max_c: number
  rainfall_mm: number
  sunshine_hours_day: number
  humidity_pct: number
  wind_speed_kmh: number
  cloud_cover_pct: number
  has_monsoon: boolean
}

// Known monsoon-zone countries (used for has_monsoon flag)
const MONSOON_COUNTRIES = new Set(['PH', 'TH', 'VN', 'ID', 'MY', 'IN', 'LK', 'MV', 'MM', 'BD'])

export async function fetchClimate(
  lat: number,
  lon: number,
  countryCode: string
): Promise<MonthlyClimate[]> {
  const url =
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=2019-01-01&end_date=2023-12-31` +
    `&daily=${VARIABLES}` +
    `&timezone=auto`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Open-Meteo error for (${lat}, ${lon}): ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const daily = data.daily

  if (!daily || !daily.time) {
    throw new Error(`No daily data returned for (${lat}, ${lon})`)
  }

  // Group daily values by month
  const monthBuckets: Record<number, {
    temps: number[]
    maxTemps: number[]
    minTemps: number[]
    precip: number[]
    sunshine: number[]
    humidity: number[]
    wind: number[]
    cloud: number[]
  }> = {}

  for (let m = 1; m <= 12; m++) {
    monthBuckets[m] = {
      temps: [], maxTemps: [], minTemps: [], precip: [],
      sunshine: [], humidity: [], wind: [], cloud: [],
    }
  }

  for (let i = 0; i < daily.time.length; i++) {
    const date = daily.time[i] as string
    const month = parseInt(date.split('-')[1], 10)
    const bucket = monthBuckets[month]

    if (daily.temperature_2m_mean[i] != null) bucket.temps.push(daily.temperature_2m_mean[i])
    if (daily.temperature_2m_max[i] != null) bucket.maxTemps.push(daily.temperature_2m_max[i])
    if (daily.temperature_2m_min[i] != null) bucket.minTemps.push(daily.temperature_2m_min[i])
    if (daily.precipitation_sum[i] != null) bucket.precip.push(daily.precipitation_sum[i])
    if (daily.sunshine_duration[i] != null) bucket.sunshine.push(daily.sunshine_duration[i])
    if (daily.relative_humidity_2m_mean[i] != null) bucket.humidity.push(daily.relative_humidity_2m_mean[i])
    if (daily.wind_speed_10m_max[i] != null) bucket.wind.push(daily.wind_speed_10m_max[i])
    if (daily.cloud_cover_mean[i] != null) bucket.cloud.push(daily.cloud_cover_mean[i])
  }

  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  // For rainfall: sum per month, then average across years
  const monthlyRainfall = (precipDays: number[]) => {
    // precipDays has ~150-155 entries (5 years * ~30 days)
    // Sum per year-month, then average
    const daysPerMonth = precipDays.length / 5 // approximate days per month across 5 years
    const totalSum = precipDays.reduce((a, b) => a + b, 0)
    return totalSum / 5 // average monthly total across 5 years
  }

  const isMonsoonZone = MONSOON_COUNTRIES.has(countryCode)

  const results: MonthlyClimate[] = []
  for (let m = 1; m <= 12; m++) {
    const b = monthBuckets[m]
    const rainfallMm = monthlyRainfall(b.precip)
    const sunshineSeconds = avg(b.sunshine) // seconds per day
    const sunshineHours = sunshineSeconds / 3600

    results.push({
      month: m,
      temp_avg_c: Math.round(avg(b.temps) * 10) / 10,
      temp_min_c: Math.round(avg(b.minTemps) * 10) / 10,
      temp_max_c: Math.round(avg(b.maxTemps) * 10) / 10,
      rainfall_mm: Math.round(rainfallMm * 10) / 10,
      sunshine_hours_day: Math.round(sunshineHours * 10) / 10,
      humidity_pct: Math.round(avg(b.humidity) * 10) / 10,
      wind_speed_kmh: Math.round(avg(b.wind) * 10) / 10,
      cloud_cover_pct: Math.round(avg(b.cloud) * 10) / 10,
      has_monsoon: isMonsoonZone && rainfallMm > 200,
    })
  }

  return results
}
