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

import { COST_INDEX, SAFETY_TIER, COUNTRY_CONTINENT, costLabel, safetyLabel } from '@/data/costIndex'
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
    .map-banner{width:100%;height:280px;object-fit:cover;display:block;border-bottom:3px solid var(--ink)}
    .content{padding:24px 16px 0}
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
    .best{font-weight:700;color:var(--green)}
    .faq-q{font-weight:700;margin-top:12px}
    .faq-a{margin:4px 0 0 16px;opacity:0.85}
    .cta{display:inline-block;margin:32px 0;padding:12px 24px;background:var(--red);color:#fff;font-weight:700;border-radius:8px;text-transform:uppercase;font-size:0.85rem}
    .cta:hover{text-decoration:none;opacity:0.9}
    footer{margin-top:48px;padding:16px;border-top:1px solid rgba(26,26,26,0.15);font-size:0.75rem;opacity:0.5}
    .advisory{font-size:0.8rem;margin:4px 0;padding:4px 8px;border-radius:4px}
    .advisory-warn{background:rgba(217,59,43,0.1);color:var(--red)}
    .advisory-boost{background:rgba(59,122,74,0.1);color:var(--green)}
    .brief{font-size:0.85rem;line-height:1.5;margin:8px 0;opacity:0.85}
  </style>
</head>
<body>
  ${mapImgUrl ? `<img class="map-banner" src="${mapImgUrl}" alt="Map of ${escapeHtml(region.name)}, ${escapeHtml(region.country_name)}" loading="lazy" width="1200" height="400">` : ''}
  <div class="content">
  <header>
    <h1>${escapeHtml(region.name)}</h1>
    <p class="subtitle">${escapeHtml(region.country_name)} · ${escapeHtml(continent)}</p>
    ${region.description ? `<p>${escapeHtml(region.description)}</p>` : ''}
  </header>

  <!-- Quick facts -->
  <dl class="meta">
    <div><dt>Best Months</dt><dd>${top3.map((t) => `<strong>${MONTH_SHORT[t.month - 1]}</strong>`).join(', ')}</dd></div>
    <div><dt>Daily Budget</dt><dd>${costStr} (${costDesc})</dd></div>
    <div><dt>Safety</dt><dd>${safety ?? 'No advisory'}</dd></div>
    <div><dt>Cuisine Score</dt><dd>${cuisine}/100</dd></div>
    ${region.is_coastal ? '<div><dt>Coastal</dt><dd>Yes</dd></div>' : ''}
  </dl>

  ${region.activities.length > 0 ? `
  <div class="pills">
    ${region.activities.map((a) => `<span class="pill">${escapeHtml(a)}</span>`).join('')}
  </div>` : ''}

  ${region.landscape_type.length > 0 ? `
  <div class="pills">
    ${region.landscape_type.map((l) => `<span class="pill pill-green">${escapeHtml(l)}</span>`).join('')}
  </div>` : ''}

  <!-- Monthly climate table -->
  <h2>Month-by-Month Climate</h2>
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
  </div>` : ''}

  <!-- Cuisine -->
  ${dishes.length > 0 ? `
  <h2>Must-Try Dishes</h2>
  <div class="pills">
    ${dishes.map((d) => `<span class="pill">${d.emoji} ${escapeHtml(d.name)}</span>`).join('')}
  </div>` : ''}

  <!-- Flora -->
  ${flora.length > 0 ? `
  <h2>Native Plants &amp; Flora</h2>
  <div class="pills">
    ${flora.map((f) => `<span class="pill pill-green">${f.emoji} ${escapeHtml(f.name)}</span>`).join('')}
  </div>` : ''}

  <!-- National Parks -->
  ${parks.length > 0 ? `
  <h2>National Parks &amp; Reserves</h2>
  <div class="pills">
    ${parks.map((p) => `<span class="pill pill-park">${p.emoji} ${escapeHtml(p.name)}</span>`).join('')}
  </div>` : ''}

  <!-- FAQ -->
  <h2>Frequently Asked Questions</h2>
  ${faqs.map((f) => `
  <p class="faq-q">${escapeHtml(f.q)}</p>
  <p class="faq-a">${escapeHtml(f.a)}</p>`).join('')}

  <a class="cta" href="${BASE_URL}/">Explore ${escapeHtml(region.name)} on FarFarAway →</a>
  </div>

  <footer>
    <p>Data from FarFarAway Travel Concierge. Climate data averaged from multiple sources. Scores are algorithmic estimates.</p>
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

  lines.push('## Data methodology')
  lines.push('')
  lines.push('Scores (0–100) combine weather quality (temperature, rainfall, sunshine, humidity, wind) with crowd levels using a geometric mean. Cost tiers are based on daily travel budgets. Safety tiers follow government travel advisories (FCDO, US State Dept, DFAT).')
  lines.push('')
  lines.push('## Contact')
  lines.push('')
  lines.push(`Interactive tool: ${BASE_URL}/`)

  return lines.join('\n')
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
