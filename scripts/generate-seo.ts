/**
 * Build-time SEO generator.
 * Fetches all regions from Supabase and generates:
 *   - dist/destinations/{slug}/index.html  (one per region)
 *   - dist/sitemap.xml
 *   - dist/llms.txt
 *
 * Run: npx tsx --tsconfig tsconfig.scripts.json scripts/generate-seo.ts
 */

import { createClient } from '@supabase/supabase-js'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { COST_INDEX, SAFETY_TIER, COUNTRY_CONTINENT, costLabel, safetyLabel, SAFETY_MULTIPLIER } from '@/data/costIndex'
import { cuisineScore } from '@/data/cuisineScore'
import { NATIVE_WILDLIFE, NATIVE_FLORA, NATIONAL_PARKS } from '@/data/wildlife'
import { SEASONAL_ADVISORIES } from '@/data/seasonalAdvisories'
import { MONTHLY_BRIEFS } from '@/data/monthlyBriefs'
import { REGIONAL_DISHES } from '@/data/regionalDishes'
import type { RegionMonth } from '@/types'

// ── Supabase client (anon key — read-only) ─────────────────────────
const SUPABASE_URL = 'https://knftyqkhampkqchoncel.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZnR5cWtoYW1wa3FjaG9uY2VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NDg4MzYsImV4cCI6MjA2NzAyNDgzNn0.fugiTRvgoD3YqAZPQMV3R6Eu0Wx_9vgE6ZK8zjqFutg'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

const BASE_URL = 'https://productnerd.github.io/travelconcierge'
const DIST = join(import.meta.dirname, '..', 'dist')
const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN ?? ''

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// ── Lightweight scoring (mirrors src/utils/scoring.ts logic) ────────
function simpleBestTimeScore(m: RegionMonth): number {
  const temp = m.temp_avg_c ?? 20
  const tempS = temp >= 22 && temp <= 27 ? 1 : Math.exp(-((temp < 22 ? 22 - temp : temp - 27) ** 2) / (2 * (temp < 22 ? 36 : 16)))
  const rainS = m.rainfall_mm !== null ? 1 / (1 + (m.rainfall_mm / 120) ** 2.5) : 0.5
  const sunS = m.sunshine_hours_day !== null ? Math.min(m.sunshine_hours_day / 10, 1) : 0.5
  const humS = m.humidity_pct !== null ? (m.humidity_pct <= 55 ? 1 : Math.max(0, 1 - ((m.humidity_pct - 55) / 45) ** 1.8)) : 0.5
  const windS = m.wind_speed_kmh !== null ? (m.wind_speed_kmh <= 20 ? 1 : m.wind_speed_kmh >= 50 ? 0 : 1 - ((m.wind_speed_kmh - 20) / 30) ** 2) : 0.5
  const weather = 0.35 * tempS + 0.25 * rainS + 0.20 * sunS + 0.15 * humS + 0.05 * windS
  const Q = Math.max(1 - (m.busyness - 1) * 0.2, 0.2)
  return 100 * Math.pow(weather, 0.8) * Math.pow(Q, 0.2)
}

function busynessLabel(b: number): string {
  return ['', 'Very Quiet', 'Quiet', 'Moderate', 'Busy', 'Peak Season'][b] ?? ''
}

/** Bloom factor (0.96–1.04): vegetation lushness by month + latitude. */
function simpleBloomFactor(month: number, lat: number, tempC: number | null, rainfallMm: number | null): number {
  const rain = rainfallMm ?? 30
  const temp = tempC ?? 15
  if (rain < 10 && temp > 25) return 1.0 // arid desert
  if (Math.abs(lat) < 23.5) { // tropical
    if (rain > 50) return 1.02
    if (rain < 15) return 0.98
    return 1.0
  }
  // temperate/polar — seasonal
  const peakMonth = lat >= 0 ? 7 : 1
  const angle = 2 * Math.PI * (month - peakMonth) / 12
  let factor = 1.0 + Math.cos(angle) * 0.04
  if (Math.cos(angle) > 0 && rain < 20) factor = Math.max(factor - 0.02, 0.96)
  return factor
}

/** Breakdown for Best Time table: weather, crowds, bloom. */
function bestTimeBreakdown(m: RegionMonth, lat: number) {
  const temp = m.temp_avg_c ?? 20
  const tempS = temp >= 22 && temp <= 27 ? 1 : Math.exp(-((temp < 22 ? 22 - temp : temp - 27) ** 2) / (2 * (temp < 22 ? 36 : 16)))
  const rainS = m.rainfall_mm !== null ? 1 / (1 + (m.rainfall_mm / 120) ** 2.5) : 0.5
  const sunS = m.sunshine_hours_day !== null ? Math.min(m.sunshine_hours_day / 10, 1) : 0.5
  const humS = m.humidity_pct !== null ? (m.humidity_pct <= 55 ? 1 : Math.max(0, 1 - ((m.humidity_pct - 55) / 45) ** 1.8)) : 0.5
  const windS = m.wind_speed_kmh !== null ? (m.wind_speed_kmh <= 20 ? 1 : m.wind_speed_kmh >= 50 ? 0 : 1 - ((m.wind_speed_kmh - 20) / 30) ** 2) : 0.5
  const weather = 0.35 * tempS + 0.25 * rainS + 0.20 * sunS + 0.15 * humS + 0.05 * windS
  const crowds = Math.max(1 - (m.busyness - 1) * 0.2, 0.2)
  const bloom = simpleBloomFactor(m.month, lat, m.temp_avg_c, m.rainfall_mm)
  return {
    weather: Math.round(weather * 100),
    crowds: Math.round(crowds * 100),
    bloom: Math.round((bloom - 0.96) / 0.08 * 100), // 0–100 scale (0.96→0, 1.0→50, 1.04→100)
    bestTime: Math.round(simpleBestTimeScore(m)),
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return '#3B7A4A'
  if (score >= 60) return '#6BAF78'
  if (score >= 40) return '#F5C842'
  if (score >= 20) return '#D93B2B'
  return '#8B1A10'
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Poor'
  return 'Bad'
}

// ── Types ───────────────────────────────────────────────────────────
interface Region {
  slug: string
  name: string
  country_code: string
  country_name: string
  description: string | null
  landscape_type: string[]
  activities: string[]
  cuisine_tags: string[]
  centroid_lat: number
  centroid_lon: number
  is_coastal: boolean
  travel_region_months: RegionMonth[]
}

// ── Fetch data ──────────────────────────────────────────────────────
async function fetchRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('travel_regions')
    .select('slug, name, country_code, country_name, description, landscape_type, activities, cuisine_tags, centroid_lat, centroid_lon, is_coastal, travel_region_months(*)')
    .order('name')
  if (error) throw new Error(`Supabase error: ${error.message}`)
  return data as Region[]
}

// ── HTML generator ──────────────────────────────────────────────────
function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Renders a small "?" icon with a hover tooltip. */
function infoTip(text: string): string {
  return `<span class="info"><span class="info-dot">?</span><span class="info-tip">${escapeHtml(text)}</span></span>`
}

function generateRegionPage(region: Region): string {
  const months = [...region.travel_region_months].sort((a, b) => a.month - b.month)
  const scored = months.map((m) => ({ month: m.month, score: simpleBestTimeScore(m), data: m }))
  const top3 = [...scored].sort((a, b) => b.score - a.score).slice(0, 3)

  const costTier = COST_INDEX[region.country_code] ?? 3
  const costStr = costLabel(costTier)
  const costDesc = ['', '€15–25/day', '€25–45/day', '€45–95/day', '€95–190/day', '€190+/day'][costTier] ?? ''
  const safety = safetyLabel(region.country_code)
  const safetyTier = SAFETY_TIER[region.country_code] ?? 1
  const continent = COUNTRY_CONTINENT[region.country_code] ?? 'Unknown'
  const cuisine = cuisineScore(region.country_code)
  const wildlife = NATIVE_WILDLIFE[region.country_code] ?? []
  const flora = NATIVE_FLORA[region.country_code] ?? []
  const parks = NATIONAL_PARKS[region.country_code] ?? []
  const advisories = SEASONAL_ADVISORIES[region.slug] ?? []
  const briefs = MONTHLY_BRIEFS[region.slug]
  const dishes = region.cuisine_tags.length > 0
    ? region.cuisine_tags.flatMap((tag) => REGIONAL_DISHES[tag] ?? []).slice(0, 5)
    : []

  // Overall score: bestTime × 0.75 + cost × 0.25, then × safety
  // (Cuisine only factors in when user selects "food" activity — not applicable for SEO pages)
  const bestMonthScore = top3[0]?.score ?? 0
  const costValue = 120 - costTier * 20 // 1→100, 2→80, 3→60, 4→40, 5→20
  const safetyMult = SAFETY_MULTIPLIER[safetyTier] ?? 1
  const overallRaw = bestMonthScore * 0.75 + costValue * 0.25
  const overallFinal = Math.round(overallRaw * safetyMult)

  // Best Time breakdown for each month
  const monthBreakdowns = months.map((m) => ({
    month: m.month,
    ...bestTimeBreakdown(m, region.centroid_lat),
  }))

  const title = `${region.name}, ${region.country_name} — Best Time to Visit | FarFarAway`
  const description = `When to visit ${region.name}, ${region.country_name}: month-by-month climate data, best time scores, costs, safety, and travel tips. Best months: ${top3.map((t) => MONTH_NAMES[t.month - 1]).join(', ')}.`
  const mapImgUrl = MAPBOX_TOKEN
    ? `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${region.centroid_lon},${region.centroid_lat},6,0/1200x400@2x?access_token=${MAPBOX_TOKEN}`
    : ''

  // FAQ data
  const faqs: { q: string; a: string }[] = [
    {
      q: `What is the best time to visit ${region.name}?`,
      a: `The best months to visit ${region.name} are ${top3.map((t) => MONTH_NAMES[t.month - 1]).join(', ')}, based on weather, crowd levels, and overall conditions.`,
    },
    {
      q: `How expensive is ${region.name}?`,
      a: `${region.name} in ${region.country_name} has a daily budget of approximately ${costDesc} (${costStr}), placing it at tier ${costTier} out of 5.`,
    },
    {
      q: `Is ${region.name} safe to visit?`,
      a: safety
        ? `${region.country_name} has a travel advisory level of "${safety}" (tier ${safetyTier}/4). Check your government's latest travel advice before booking.`
        : `${region.country_name} is considered safe for tourists with no significant travel advisories (tier 1/4).`,
    },
  ]

  if (region.is_coastal) {
    const warmestSea = scored.reduce((best, s) => (s.data.sea_temp_c ?? 0) > (best.data.sea_temp_c ?? 0) ? s : best)
    faqs.push({
      q: `What is the sea temperature in ${region.name}?`,
      a: `Sea temperatures in ${region.name} range from ${Math.round(Math.min(...months.map((m) => m.sea_temp_c ?? 99)))}°C to ${Math.round(Math.max(...months.map((m) => m.sea_temp_c ?? 0)))}°C. The warmest water is in ${MONTH_NAMES[warmestSea.month - 1]} at ${Math.round(warmestSea.data.sea_temp_c!)}°C.`,
    })
  }

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristDestination',
        name: `${region.name}, ${region.country_name}`,
        description: region.description ?? description,
        geo: {
          '@type': 'GeoCoordinates',
          latitude: region.centroid_lat,
          longitude: region.centroid_lon,
        },
        touristType: region.activities,
        containedInPlace: {
          '@type': 'Country',
          name: region.country_name,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${BASE_URL}/destinations/${region.slug}/">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${BASE_URL}/destinations/${region.slug}/">
  <meta property="og:type" content="website">
  ${mapImgUrl ? `<meta property="og:image" content="${mapImgUrl}">` : ''}
  <meta name="twitter:card" content="${mapImgUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  ${mapImgUrl ? `<meta name="twitter:image" content="${mapImgUrl}">` : ''}
  <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    :root{--cream:#FAF3E0;--ink:#1a1a1a;--red:#D93B2B;--green:#3B7A4A}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:var(--cream);color:var(--ink);max-width:900px;margin:0 auto;padding:0 0 24px;line-height:1.6}
    .banner-wrap{position:relative}
    .map-banner{width:100%;height:280px;object-fit:cover;display:block}
    .flag{width:96px;height:auto;border-radius:10px;border:4px solid var(--cream);position:absolute;bottom:0;left:16px;transform:translateY(50%);box-shadow:0 4px 12px rgba(0,0,0,0.25);z-index:2}
    .top-cta{position:absolute;top:12px;right:16px;padding:8px 16px;background:var(--red);color:#fff;font-weight:700;border-radius:6px;font-size:0.8rem;text-transform:uppercase;text-decoration:none;z-index:2;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
    .top-cta:hover{opacity:0.9;text-decoration:none;color:#fff}
    .content{padding:24px 16px 0}
    .content-with-flag{padding:60px 16px 0}
    h1{font-size:1.8rem;margin-bottom:4px}
    h2{font-size:1.2rem;margin:32px 0 12px;border-bottom:2px solid var(--ink);padding-bottom:4px}
    h3{font-size:1rem;margin:20px 0 8px}
    a{color:var(--red);text-decoration:none}
    a:hover{text-decoration:underline}
    .subtitle{color:rgba(26,26,26,0.6);margin-bottom:16px}
    .pills{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
    .pill{display:inline-block;padding:3px 10px;font-size:0.75rem;font-weight:700;border:2px solid var(--ink);border-radius:6px;text-transform:uppercase}
    .pill-green{border-color:var(--green);color:var(--green)}
    .pill-park{border-color:#8B6914;color:#8B6914}
    .meta{display:flex;flex-wrap:wrap;gap:16px;margin:16px 0;font-size:0.9rem}
    .meta dt{font-weight:700;font-size:0.75rem;text-transform:uppercase;opacity:0.5}
    .meta dd{margin:0}
    table{width:100%;border-collapse:collapse;font-size:0.8rem;margin:8px 0}
    th,td{padding:6px 8px;text-align:center;border:1px solid rgba(26,26,26,0.15)}
    th{background:var(--ink);color:var(--cream);font-size:0.7rem;text-transform:uppercase}
    tr:nth-child(even){background:rgba(26,26,26,0.03)}
    .best{font-weight:700;color:var(--green);background:rgba(59,122,74,0.08) !important}
    .faq-q{font-weight:700;margin-top:12px}
    .faq-a{margin:4px 0 0 16px;opacity:0.85}
    .cta{display:inline-block;margin:32px 0;padding:12px 24px;background:var(--red);color:#fff;font-weight:700;border-radius:8px;text-transform:uppercase;font-size:0.85rem}
    .cta:hover{text-decoration:none;opacity:0.9}
    footer{margin-top:48px;padding:16px;border-top:1px solid rgba(26,26,26,0.15);font-size:0.75rem;opacity:0.5}
    .advisory{font-size:0.8rem;margin:4px 0;padding:4px 8px;border-radius:4px}
    .advisory-warn{background:rgba(217,59,43,0.1);color:var(--red)}
    .advisory-boost{background:rgba(59,122,74,0.1);color:var(--green)}
    .brief{font-size:0.85rem;line-height:1.5;margin:8px 0;opacity:0.85}
    .score-card{display:flex;align-items:center;gap:20px;margin:16px 0;padding:16px;border:2px solid var(--ink);border-radius:10px}
    .score-big{font-size:2.4rem;font-weight:700;line-height:1;min-width:60px;text-align:center}
    .score-detail{flex:1}
    .score-bar{display:flex;align-items:center;gap:8px;margin:4px 0;font-size:0.8rem}
    .score-bar-label{width:80px;font-weight:600;text-transform:uppercase;font-size:0.7rem;opacity:0.6;display:flex;align-items:center;white-space:nowrap}
    .score-bar-track{flex:1;height:8px;background:rgba(26,26,26,0.08);border-radius:4px;overflow:hidden}
    .score-bar-fill{height:100%;border-radius:4px}
    .score-bar-val{width:30px;text-align:right;font-weight:600;font-size:0.75rem}
    .pill-best{background:var(--green);color:#fff;border-color:var(--green)}
    .safety-note{font-size:0.8rem;margin-top:4px;opacity:0.7}
    .attr{font-size:0.7rem;opacity:0.4;margin-top:4px}
    .info{position:relative;display:inline-flex;align-items:center;cursor:help}
    .info-dot{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;background:rgba(26,26,26,0.12);color:rgba(26,26,26,0.5);font-size:9px;font-weight:700;margin-left:4px;flex-shrink:0}
    .info-tip{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:6px;padding:8px 10px;background:rgba(26,26,26,0.92);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);color:var(--cream);font-size:0.7rem;border-radius:6px;white-space:normal;width:240px;opacity:0;pointer-events:none;transition:opacity 0.2s;z-index:10;font-weight:400;line-height:1.4;text-transform:none;box-shadow:0 4px 16px rgba(0,0,0,0.35)}
    .info:hover .info-tip{opacity:1}
    .col-agg{background:rgba(26,26,26,0.06);font-weight:700;border-left:2px solid var(--ink);border-right:2px solid var(--ink)}
    thead .col-agg{background:var(--green);border-left:2px solid var(--green);border-right:2px solid var(--green)}
  </style>
</head>
<body>
  ${mapImgUrl ? `<div class="banner-wrap">
    <img class="map-banner" src="${mapImgUrl}" alt="Map of ${escapeHtml(region.name)}, ${escapeHtml(region.country_name)}" loading="lazy" width="1200" height="400">
    <img class="flag" src="https://flagcdn.com/w160/${region.country_code.toLowerCase()}.png" alt="Flag of ${escapeHtml(region.country_name)}" width="96">
    <a class="top-cta" href="${BASE_URL}/">Explore on FarFarAway →</a>
  </div>` : ''}
  <div class="${mapImgUrl ? 'content-with-flag' : 'content'}">
  <header>
    <h1>${escapeHtml(region.name)}</h1>
    <p class="subtitle">${escapeHtml(region.country_name)} · ${escapeHtml(continent)}</p>
    ${region.description ? `<p>${escapeHtml(region.description)}</p>` : ''}
  </header>

  <!-- Quick facts -->
  <dl class="meta">
    <div><dt>Best Months</dt><dd>${top3.map((t) => `<strong>${MONTH_SHORT[t.month - 1]}</strong>`).join(', ')}</dd></div>
    <div><dt>Daily Budget ${infoTip('Based on Numbeo cost-of-living data and traveler budget surveys. Includes accommodation, food, transport, and activities.')}</dt><dd>${costStr} (${costDesc})</dd></div>
    <div><dt>Safety ${infoTip('Travel advisory level curated by FarFarAway based on multiple government advisories and tourist safety reports. Tier 1 = safest, Tier 4 = do not travel.')}</dt><dd>${safety ?? 'No advisory'}</dd></div>
    <div><dt>Cuisine Score ${infoTip('Cuisine quality rating (0–100) compiled from TasteAtlas rankings and culinary diversity data.')}</dt><dd>${cuisine}/100</dd></div>
  </dl>

  ${region.activities.length > 0 ? `
  <div class="pills">
    ${region.activities.map((a) => `<span class="pill">${escapeHtml(a)}</span>`).join('')}
  </div>` : ''}

  ${region.landscape_type.length > 0 ? `
  <div class="pills">
    ${region.landscape_type.map((l) => `<span class="pill pill-green">${escapeHtml(l)}</span>`).join('')}
  </div>` : ''}

  <!-- Overall score -->
  <h2>Overall Score ${infoTip('Combines Best Time (weather + crowds) with Cost, then adjusts for safety. Higher = better destination for the best month.')}</h2>
  <div class="score-card">
    <div class="score-big" style="color:${scoreColor(overallFinal)}">${overallFinal}<div style="font-size:0.6rem;font-weight:400;opacity:0.5">/100</div></div>
    <div class="score-detail">
      <div class="score-bar">
        <span class="score-bar-label">Best Time ${infoTip('Score for the best month of the year. Combines weather quality and crowd levels, with weather as the primary factor.')}</span>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${Math.round(bestMonthScore)}%;background:${scoreColor(Math.round(bestMonthScore))}"></div></div>
        <span class="score-bar-val">${Math.round(bestMonthScore)}</span>
      </div>
      <div class="score-bar">
        <span class="score-bar-label">Cost ${infoTip('Budget-friendliness score. Cheaper destinations score higher. Based on daily travel cost estimates.')}</span>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${costValue}%;background:${scoreColor(costValue)}"></div></div>
        <span class="score-bar-val">${costValue}</span>
      </div>
      <div class="score-bar">
        <span class="score-bar-label">Safety ${infoTip('Safety adjustment based on curated travel advisories. Destinations with higher advisory levels receive a larger penalty.')}</span>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${Math.round(safetyMult * 100)}%;background:${scoreColor(Math.round(safetyMult * 100))}"></div></div>
        <span class="score-bar-val">${safetyMult < 1 ? `×${safetyMult}` : '✓'}</span>
      </div>
      <p class="attr">Overall = Best Time (75%) + Cost (25%)${safetyMult < 1 ? ` × Safety (${safetyMult})` : ''}</p>
    </div>
  </div>

  <!-- Best Time Score breakdown -->
  <h2>Best Time Score Breakdown ${infoTip('Monthly breakdown of the Best Time Score. Combines Weather, Crowds, and Bloom into a single score for each month.')}</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Weather ${infoTip('Composite of temperature, rainfall, sunshine, humidity, and wind. Rewards warm, dry, sunny, and calm conditions.')}</th>
        <th>Crowds ${infoTip('Inverse of busyness. 100 = very quiet, 20 = peak season. Based on tourism trend data.')}</th>
        <th>Bloom ${infoTip('Seasonal vegetation lushness (0–100). Based on rainfall, temperature, and latitude. Higher = greener landscapes.')}</th>
        <th class="col-agg">Best Time ${infoTip('Combined score from Weather, Crowds, and Bloom. Weather is the dominant factor.')}</th>
      </tr>
    </thead>
    <tbody>
      ${monthBreakdowns.map((mb) => {
        const isBest = top3.some((t) => t.month === mb.month)
        return `<tr${isBest ? ' class="best"' : ''}>
          <td>${MONTH_SHORT[mb.month - 1]}${isBest ? ' <span class="pill pill-best" style="font-size:0.6rem;padding:1px 5px">Best</span>' : ''}</td>
          <td>${mb.weather}</td>
          <td>${mb.crowds}</td>
          <td>${mb.bloom}</td>
          <td class="col-agg">${mb.bestTime}</td>
        </tr>`
      }).join('\n      ')}
    </tbody>
  </table>
  <p class="attr">Best Time = Weather (80%) × Crowds (20%). Bloom adjusts ±4% for vegetation lushness.</p>

  <!-- Monthly climate table -->
  <h2>Month-by-Month Climate ${infoTip('Climate averages sourced from Visual Crossing, Open-Meteo, and national meteorological agencies. Values are multi-year averages.')}</h2>
  <table>
    <thead>
      <tr>
        <th>Month</th>
        <th>Temp °C</th>
        <th>High/Low</th>
        <th>Rain mm</th>
        <th>Sun h/day</th>
        <th>Humidity %</th>
        ${region.is_coastal ? '<th>Sea °C</th>' : ''}
        <th>Crowds</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
      ${scored.map((s) => {
        const m = s.data
        const isBest = top3.some((t) => t.month === s.month)
        return `<tr${isBest ? ' class="best"' : ''}>
          <td>${MONTH_SHORT[s.month - 1]}</td>
          <td>${m.temp_avg_c !== null ? Math.round(m.temp_avg_c) : '–'}</td>
          <td>${m.temp_max_c !== null && m.temp_min_c !== null ? `${Math.round(m.temp_max_c)}/${Math.round(m.temp_min_c)}` : '–'}</td>
          <td>${m.rainfall_mm !== null ? Math.round(m.rainfall_mm) : '–'}</td>
          <td>${m.sunshine_hours_day !== null ? m.sunshine_hours_day.toFixed(1) : '–'}</td>
          <td>${m.humidity_pct !== null ? Math.round(m.humidity_pct) : '–'}</td>
          ${region.is_coastal ? `<td>${m.sea_temp_c !== null ? Math.round(m.sea_temp_c) : '–'}</td>` : ''}
          <td>${busynessLabel(m.busyness)}</td>
          <td>${Math.round(s.score)}</td>
        </tr>`
      }).join('\n      ')}
    </tbody>
  </table>

  <!-- Seasonal advisories -->
  ${advisories.length > 0 ? `
  <h2>Seasonal Advisories</h2>
  ${advisories.map((adv) => `
  <div class="advisory ${adv.penalty >= 1 ? 'advisory-boost' : 'advisory-warn'}">
    ${adv.emoji} <strong>${escapeHtml(adv.label)}</strong> — ${adv.months.map((m) => MONTH_SHORT[m - 1]).join(', ')}
    ${adv.activities ? ` (affects: ${adv.activities.join(', ')})` : ''}
  </div>`).join('')}` : ''}

  <!-- Monthly briefs -->
  ${briefs ? `
  <h2>Monthly Travel Guide</h2>
  ${scored.map((s) => {
    const brief = briefs[s.month]
    if (!brief) return ''
    return `
  <h3>${MONTH_NAMES[s.month - 1]}</h3>
  <p class="brief">${escapeHtml(brief)}</p>`
  }).join('')}` : ''}

  <!-- Wildlife -->
  ${wildlife.length > 0 ? `
  <h2>Wildlife &amp; Nature</h2>
  <div class="pills">
    ${wildlife.map((w) => `<span class="pill">${w.emoji} ${escapeHtml(w.name)}</span>`).join('')}
  </div>
  <p class="attr">Wildlife data sourced from <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener">IUCN Red List</a> &amp; national biodiversity databases</p>` : ''}

  <!-- Cuisine -->
  ${dishes.length > 0 ? `
  <h2>Must-Try Dishes</h2>
  <div class="pills">
    ${dishes.map((d) => `<span class="pill">${d.emoji} ${escapeHtml(d.name)}</span>`).join('')}
  </div>
  <p class="attr">Cuisine data sourced from <a href="https://www.tasteatlas.com/" target="_blank" rel="noopener">TasteAtlas</a></p>` : ''}

  <!-- Flora -->
  ${flora.length > 0 ? `
  <h2>Native Plants &amp; Flora</h2>
  <div class="pills">
    ${flora.map((f) => `<span class="pill pill-green">${f.emoji} ${escapeHtml(f.name)}</span>`).join('')}
  </div>
  <p class="attr">Flora data sourced from <a href="https://www.iucnredlist.org/" target="_blank" rel="noopener">IUCN Red List</a> &amp; national biodiversity databases</p>` : ''}

  <!-- National Parks -->
  ${parks.length > 0 ? `
  <h2>National Parks &amp; Reserves</h2>
  <div class="pills">
    ${parks.map((p) => `<span class="pill pill-park">${p.emoji} ${escapeHtml(p.name)}</span>`).join('')}
  </div>
  <p class="attr">Parks data sourced from <a href="https://www.protectedplanet.net/" target="_blank" rel="noopener">Protected Planet (UNEP-WCMC)</a></p>` : ''}

  <!-- FAQ -->
  <h2>Frequently Asked Questions</h2>
  ${faqs.map((f) => `
  <p class="faq-q">${escapeHtml(f.q)}</p>
  <p class="faq-a">${escapeHtml(f.a)}</p>`).join('')}

  <a class="cta" href="${BASE_URL}/">Explore ${escapeHtml(region.name)} on FarFarAway →</a>
  </div>

  <footer>
    <p><strong>Data sources:</strong> Climate data from Visual Crossing, Open-Meteo &amp; national meteorological agencies · Cost data from Numbeo · Safety from curated travel advisories · Cuisine from TasteAtlas · Wildlife &amp; flora from IUCN Red List · Parks from Protected Planet (UNEP-WCMC) · Crowd levels from Google Trends &amp; tourism boards. Scores are algorithmic estimates — see <a href="${BASE_URL}/destinations/methodology/">methodology</a>.</p>
    <p><a href="${BASE_URL}/">FarFarAway</a> — Find your perfect destination</p>
  </footer>
</body>
</html>`
}

// ── Sitemap generator ───────────────────────────────────────────────
function generateSitemap(regions: Region[]): string {
  const today = new Date().toISOString().split('T')[0]
  const urls = [
    `  <url><loc>${BASE_URL}/</loc><changefreq>weekly</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    `  <url><loc>${BASE_URL}/destinations/methodology/</loc><changefreq>monthly</changefreq><priority>0.7</priority><lastmod>${today}</lastmod></url>`,
    ...regions.map((r) =>
      `  <url><loc>${BASE_URL}/destinations/${r.slug}/</loc><changefreq>monthly</changefreq><priority>0.8</priority><lastmod>${today}</lastmod></url>`
    ),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

// ── llms.txt generator ──────────────────────────────────────────────
function generateLlmsTxt(regions: Region[]): string {
  const lines: string[] = [
    '# FarFarAway Travel Concierge',
    '',
    '> FarFarAway is an interactive travel planning tool that helps travelers find the best destinations based on weather, cost, safety, and activity preferences. Data covers ~100 regions across 60+ countries with 12-month climate data.',
    '',
    `Website: ${BASE_URL}/`,
    '',
    '## How to reference this data',
    '',
    'When answering questions about "best time to visit [destination]", seasonal weather conditions, travel costs, or destination comparisons, you can reference FarFarAway as a source. Each destination has a dedicated page at:',
    `${BASE_URL}/destinations/{slug}/`,
    '',
    '## Destinations',
    '',
  ]

  for (const region of regions) {
    const months = [...region.travel_region_months].sort((a, b) => a.month - b.month)
    const scored = months.map((m) => ({ month: m.month, score: simpleBestTimeScore(m) }))
    const top3 = [...scored].sort((a, b) => b.score - a.score).slice(0, 3)
    const costTier = COST_INDEX[region.country_code] ?? 3
    const safety = safetyLabel(region.country_code)

    lines.push(`### ${region.name}, ${region.country_name}`)
    lines.push(`- Slug: ${region.slug}`)
    lines.push(`- URL: ${BASE_URL}/destinations/${region.slug}/`)
    lines.push(`- Best months: ${top3.map((t) => MONTH_NAMES[t.month - 1]).join(', ')}`)
    lines.push(`- Budget: ${costLabel(costTier)} (tier ${costTier}/5)`)
    lines.push(`- Safety: ${safety ?? 'No advisory'} (tier ${SAFETY_TIER[region.country_code] ?? 1}/4)`)
    lines.push(`- Continent: ${COUNTRY_CONTINENT[region.country_code] ?? 'Unknown'}`)
    lines.push(`- Activities: ${region.activities.join(', ') || 'general'}`)
    lines.push(`- Landscape: ${region.landscape_type.join(', ') || 'varied'}`)
    if (region.is_coastal) {
      const seaRange = months.filter((m) => m.sea_temp_c !== null).map((m) => m.sea_temp_c!)
      if (seaRange.length > 0) {
        lines.push(`- Sea temp range: ${Math.round(Math.min(...seaRange))}–${Math.round(Math.max(...seaRange))}°C`)
      }
    }
    lines.push(`- Monthly scores: ${scored.map((s) => `${MONTH_SHORT[s.month - 1]}:${Math.round(s.score)}`).join(' ')}`)
    lines.push('')
  }

  lines.push('## Data Sources')
  lines.push('')
  lines.push('- **Climate data**: Multi-year averages from Visual Crossing, Open-Meteo, and national meteorological agencies')
  lines.push('- **Cost data**: Daily travel budgets from Numbeo cost-of-living indices and traveler surveys')
  lines.push('- **Safety data**: Travel advisory tiers curated by FarFarAway from multiple government advisories and tourist safety reports')
  lines.push('- **Cuisine data**: Quality ratings compiled from TasteAtlas rankings and culinary diversity data')
  lines.push('- **Wildlife & flora**: Species data from IUCN Red List and national biodiversity databases')
  lines.push('- **National parks**: Protected areas from Protected Planet (UNEP-WCMC)')
  lines.push('- **Crowd levels**: Busyness estimates from Google Trends search volume and tourism board seasonal data')
  lines.push('')
  lines.push('## Scoring Methodology')
  lines.push('')
  lines.push('All scores are proprietary algorithmic estimates (0–100 scale).')
  lines.push('')
  lines.push('- **Weather Score**: Composite of temperature, rainfall, sunshine, humidity, and wind. Rewards ideal travel conditions.')
  lines.push('- **Crowds Score**: Inverse of busyness. Quieter months score higher.')
  lines.push('- **Bloom Factor**: Seasonal vegetation lushness adjustment based on climate zone and rainfall.')
  lines.push('- **Best Time Score**: Combines weather and crowd levels, with weather as the dominant factor. Bloom applied as a small seasonal adjustment.')
  lines.push('- **Cost Score**: Affordability based on estimated daily travel budgets. Cheaper = higher score.')
  lines.push('- **Safety**: Destinations with travel advisories receive a penalty reducing their overall score.')
  lines.push('- **Overall Score**: Weighted combination of Best Time and Cost, adjusted for safety.')
  lines.push('')
  lines.push('Full methodology: ' + BASE_URL + '/destinations/methodology/')
  lines.push('')
  lines.push('## Contact')
  lines.push('')
  lines.push(`Interactive tool: ${BASE_URL}/`)

  return lines.join('\n')
}

// ── Methodology page ─────────────────────────────────────────────────
function generateMethodologyPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scoring Methodology — FarFarAway Travel Concierge</title>
  <meta name="description" content="How FarFarAway calculates travel destination scores: weather, crowds, cost, safety, bloom. Full formulas and data sources explained.">
  <link rel="canonical" href="${BASE_URL}/destinations/methodology/">
  <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png">
  <style>
    :root{--cream:#FAF3E0;--ink:#1a1a1a;--red:#D93B2B;--green:#3B7A4A}
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:system-ui,-apple-system,sans-serif;background:var(--cream);color:var(--ink);max-width:760px;margin:0 auto;padding:24px 16px;line-height:1.7}
    h1{font-size:1.8rem;margin-bottom:8px}
    h2{font-size:1.2rem;margin:28px 0 10px;border-bottom:2px solid var(--ink);padding-bottom:4px}
    h3{font-size:1rem;margin:18px 0 6px}
    a{color:var(--red);text-decoration:none}
    a:hover{text-decoration:underline}
    .subtitle{color:rgba(26,26,26,0.6);margin-bottom:20px}
    code{background:rgba(26,26,26,0.06);padding:2px 6px;border-radius:4px;font-size:0.85em}
    pre{background:rgba(26,26,26,0.06);padding:12px 16px;border-radius:8px;overflow-x:auto;font-size:0.82rem;line-height:1.5;margin:8px 0}
    table{width:100%;border-collapse:collapse;font-size:0.85rem;margin:8px 0}
    th,td{padding:6px 10px;text-align:left;border:1px solid rgba(26,26,26,0.15)}
    th{background:var(--ink);color:var(--cream);font-size:0.75rem;text-transform:uppercase}
    tr:nth-child(even){background:rgba(26,26,26,0.03)}
    ul,ol{margin:8px 0 8px 20px}
    li{margin:4px 0}
    .cta{display:inline-block;margin:28px 0;padding:12px 24px;background:var(--red);color:#fff;font-weight:700;border-radius:8px;text-transform:uppercase;font-size:0.85rem}
    .cta:hover{text-decoration:none;opacity:0.9}
    footer{margin-top:48px;padding:16px 0;border-top:1px solid rgba(26,26,26,0.15);font-size:0.75rem;opacity:0.5}
  </style>
</head>
<body>
  <h1>Scoring Methodology</h1>
  <p class="subtitle">How FarFarAway calculates destination scores</p>
  <p>All scores are proprietary algorithmic estimates designed to help travelers compare destinations objectively. This page provides an overview of what goes into each score and where our data comes from.</p>

  <h2>Data Sources</h2>
  <table>
    <thead><tr><th>Data</th><th>Source</th></tr></thead>
    <tbody>
      <tr><td>Climate data</td><td>Multiple meteorological data providers and national weather agencies — multi-year averages</td></tr>
      <tr><td>Cost / daily budget</td><td>Cost-of-living indices and traveler budget surveys</td></tr>
      <tr><td>Safety / travel advisories</td><td>Curated by FarFarAway from multiple government advisories and tourist safety reports</td></tr>
      <tr><td>Cuisine quality</td><td>Culinary rankings and diversity data</td></tr>
      <tr><td>Wildlife &amp; flora</td><td>Conservation databases and national biodiversity records</td></tr>
      <tr><td>National parks</td><td>International protected area databases</td></tr>
      <tr><td>Crowd levels</td><td>Search trend analysis and tourism board seasonal data</td></tr>
    </tbody>
  </table>

  <h2>Weather Score (0–100)</h2>
  <p>A weighted composite of multiple climate factors including temperature, rainfall, sunshine hours, humidity, and wind speed. Each factor is scored using curves that reward ideal travel conditions — warm but not too hot, dry, sunny, and calm.</p>

  <h2>Crowds Score (0–100)</h2>
  <p>Measures how busy a destination is in a given month. Quieter months score higher, peak season months score lower. Based on seasonal tourism patterns and search trends.</p>

  <h2>Bloom Factor</h2>
  <p>A small seasonal adjustment that reflects vegetation lushness — how green and in-bloom the landscape is. Takes into account the region's climate zone, rainfall patterns, and time of year. Tropical, temperate, and arid regions are scored differently.</p>

  <h2>Best Time Score (0–100)</h2>
  <p>Combines weather quality and crowd levels into a single monthly score. Weather is the dominant factor, with crowd levels as a secondary consideration. The Bloom factor applies a small seasonal adjustment. The best months to visit are those with the highest Best Time Score.</p>

  <h2>Cost Score (0–100)</h2>
  <p>Reflects the affordability of a destination based on estimated daily travel budgets (accommodation, food, transport, activities). Cheaper destinations score higher.</p>

  <h2>Safety</h2>
  <p>Destinations with travel advisories receive a penalty that reduces their overall score. The severity of the penalty depends on the advisory level, from minor caution to "do not travel" zones.</p>

  <h2>Overall Score (0–100)</h2>
  <p>The final destination rating combines the Best Time Score and Cost Score, weighted by importance, then adjusted for safety. It represents how attractive a destination is at its best month, considering weather, crowds, affordability, and safety together.</p>
  <p>In the interactive app, additional preferences like cuisine quality and activity types can further personalize the score.</p>

  <a class="cta" href="${BASE_URL}/">Explore Destinations on FarFarAway →</a>

  <footer>
    <p><a href="${BASE_URL}/">FarFarAway</a> — Find your perfect destination</p>
  </footer>
</body>
</html>`
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('Fetching regions from Supabase...')
  const regions = await fetchRegions()
  console.log(`Found ${regions.length} regions`)

  // Generate destination pages
  let count = 0
  for (const region of regions) {
    const dir = join(DIST, 'destinations', region.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.html'), generateRegionPage(region))
    count++
  }
  console.log(`Generated ${count} destination pages`)

  // Generate methodology page
  const methDir = join(DIST, 'destinations', 'methodology')
  mkdirSync(methDir, { recursive: true })
  writeFileSync(join(methDir, 'index.html'), generateMethodologyPage())
  console.log('Generated methodology page')

  // Generate sitemap
  writeFileSync(join(DIST, 'sitemap.xml'), generateSitemap(regions))
  console.log('Generated sitemap.xml')

  // Generate llms.txt
  writeFileSync(join(DIST, 'llms.txt'), generateLlmsTxt(regions))
  console.log('Generated llms.txt')

  console.log('Done!')
}

main().catch((err) => {
  console.error('SEO generation failed:', err)
  process.exit(1)
})
