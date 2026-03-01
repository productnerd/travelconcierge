import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapGL, { Layer, Source, Popup, Marker } from 'react-map-gl/mapbox'
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useFilterStore } from '@/store/filterStore'
import { useSocialStore } from '@/store/socialStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import { busynessColor, busynessLabel, countryFlag } from '@/types'
import { scoreColor, scoreLabel, bestTimeScore as computeBestTime, type ClimateInput } from '@/utils/scoring'
import { overallScore } from '@/data/costIndex'
import type { ColorMode } from '@/store/filterStore'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface Props {
  regions: FilteredRegion[]
  allRegionSlugs?: string[]
  geojson: GeoJSON.FeatureCollection | null
}

export default function TravelMap({ regions, geojson }: Props) {
  const mapRef = useRef<MapRef>(null)
  const [hovered, setHovered] = useState<{
    slug: string; lat: number; lon: number; name: string;
    busyness: number; temp: number | null; country_code: string;
    weatherScore: number; bestTimeScore: number; overallScore: number;
  } | null>(null)
  const selectRegion = useUIStore((s) => s.selectRegion)
  const selectedSlug = useUIStore((s) => s.selectedRegionSlug)
  const highlightedSlugs = useUIStore((s) => s.highlightedSlugs)
  const eliminatedSlugs = useUIStore((s) => s.eliminatedSlugs)
  const shortlistedSlugs = useShortlistStore((s) => s.shortlistedSlugs)
  const colorMode = useFilterStore((s) => s.colorMode)
  const setColorMode = useFilterStore((s) => s.setColorMode)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)
  const selectedMonths = useFilterStore((s) => s.selectedMonths)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const hiddenScoreTiers = useFilterStore((s) => s.hiddenScoreTiers)
  const toggleScoreTier = useFilterStore((s) => s.toggleScoreTier)

  const enabledFriendIds = useSocialStore((s) => s.enabledFriendIds)
  const friends = useSocialStore((s) => s.friends)
  const friendData = useSocialStore((s) => s.friendData)

  // Regions where selected month is in top 3 best months
  const bestMonthSlugs = useMemo(() => {
    const slugs = new Set<string>()
    for (const r of regions) {
      const monthScores = r.months.map((m) => {
        const input: ClimateInput = {
          temp_avg_c: m.temp_avg_c, temp_min_c: m.temp_min_c, temp_max_c: m.temp_max_c,
          rainfall_mm: m.rainfall_mm, sunshine_hours_day: m.sunshine_hours_day,
          cloud_cover_pct: m.cloud_cover_pct, humidity_pct: m.humidity_pct,
          wind_speed_kmh: m.wind_speed_kmh, has_monsoon: m.has_monsoon,
          sea_temp_c: m.sea_temp_c, busyness: m.busyness,
        }
        return { month: m.month, score: computeBestTime(input, algorithmPreset, selectedActivities, r.country_code) }
      })
      const top3 = monthScores.sort((a, b) => b.score - a.score).slice(0, 3).map((m) => m.month)
      if (selectedMonths.some((m) => top3.includes(m))) slugs.add(r.slug)
    }
    return slugs
  }, [regions, selectedMonths, algorithmPreset, selectedActivities])

  // Build a lookup: geojson_id → region data
  const regionByGeojsonId = useMemo(() => {
    const lookup: Record<string, FilteredRegion> = {}
    for (const r of regions) {
      lookup[r.geojson_id] = r
    }
    return lookup
  }, [regions])

  // Enrich geojson features with region data
  const enrichedGeojson = useMemo(() => {
    if (!geojson) return null

    return {
      ...geojson,
      features: geojson.features.map((f) => {
        const gid = f.properties?.geojson_id as string
        const region = regionByGeojsonId[gid]
        const isFiltered = !!region
        const isEliminated = region ? eliminatedSlugs.includes(region.slug) : false
        const isHighlighted = region
          ? highlightedSlugs.length === 0 || highlightedSlugs.includes(region.slug)
          : false

        return {
          ...f,
          properties: {
            ...f.properties,
            busyness: region?.avg_busyness ?? 0,
            weatherScore: region?.weatherScore ?? 0,
            bestTimeScore: region?.bestTimeScore ?? 0,
            overallScore: region
              ? Math.round(overallScore(region.bestTimeScore, region.country_code, selectedActivities))
              : 0,
            isFiltered: isFiltered ? 1 : 0,
            isEliminated: isEliminated ? 1 : 0,
            isHighlighted: isHighlighted ? 1 : 0,
            isSelected: region?.slug === selectedSlug ? 1 : 0,
          },
        }
      }),
    } as GeoJSON.FeatureCollection
  }, [geojson, regionByGeojsonId, eliminatedSlugs, highlightedSlugs, selectedSlug, selectedActivities])

  const handleClick = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return
      const gid = feature.properties?.geojson_id as string
      const region = regionByGeojsonId[gid]
      if (region) {
        selectRegion(region.slug)
      }
    },
    [regionByGeojsonId, selectRegion]
  )

  const handleMouseMove = useCallback(
    (e: MapMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) {
        setHovered(null)
        return
      }
      const gid = feature.properties?.geojson_id as string
      const region = regionByGeojsonId[gid]
      if (region) {
        setHovered({
          slug: region.slug,
          lat: region.centroid_lat,
          lon: region.centroid_lon,
          name: region.name,
          busyness: region.avg_busyness,
          temp: region.avg_temp_c,
          country_code: region.country_code,
          weatherScore: region.weatherScore,
          bestTimeScore: region.bestTimeScore,
          overallScore: Math.round(overallScore(region.bestTimeScore, region.country_code, selectedActivities)),
        })
      }
    },
    [regionByGeojsonId]
  )

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
  }, [])

  // Fly to selected region
  useEffect(() => {
    if (!selectedSlug || !mapRef.current) return
    const region = regions.find((r) => r.slug === selectedSlug)
    if (region) {
      mapRef.current.flyTo({
        center: [region.centroid_lon, region.centroid_lat],
        zoom: 5,
        duration: 1000,
      })
    }
  }, [selectedSlug, regions])

  return (
    <MapGL
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{
        longitude: 20,
        latitude: 20,
        zoom: 2,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      projection={{ name: 'globe' }}
      attributionControl={false}
      interactiveLayerIds={['region-fill']}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      cursor={hovered ? 'pointer' : 'grab'}
      onLoad={(e) => {
        const map = e.target
        map.setPaintProperty('water', 'fill-color', '#A8E0F0')
        map.setFog({ color: '#f8f4ea', 'high-color': '#c2d0e0', 'horizon-blend': 0.04 })
      }}
    >
      {enrichedGeojson && (
        <Source id="travel-regions" type="geojson" data={enrichedGeojson} promoteId="geojson_id">
          {/* Fill layer colored by busyness */}
          <Layer
            id="region-fill"
            type="fill"
            paint={{
              'fill-color': [
                'case',
                ['==', ['get', 'isFiltered'], 0],
                '#D4D0C8',
                ['==', ['get', 'isEliminated'], 1],
                '#D4D0C8',
                colorMode === 'busyness'
                  ? [
                      'interpolate', ['linear'], ['get', 'busyness'],
                      1, '#3B7A4A', 2, '#6BAF78', 3, '#F5C842', 4, '#D93B2B', 5, '#8B1A10',
                    ]
                  : [
                      'step',
                      ['get', colorMode === 'weather' ? 'weatherScore' : colorMode === 'bestTime' ? 'bestTimeScore' : 'overallScore'],
                      '#8B1A10',   // < 20: Bad
                      20, '#D93B2B', // 20–39: Poor
                      40, '#F5C842', // 40–59: Fair
                      60, '#6BAF78', // 60–79: Good
                      80, '#3B7A4A', // 80+: Excellent
                    ],
              ],
              'fill-opacity': [
                'case',
                ['==', ['get', 'isFiltered'], 0], 0.15,
                ['==', ['get', 'isEliminated'], 1], 0.2,
                ['==', ['get', 'isSelected'], 1], 0.9,
                0.8,
              ],
            }}
          />
          {/* Stroke layer */}
          <Layer
            id="region-stroke"
            type="line"
            paint={{
              'line-color': [
                'case',
                ['==', ['get', 'isSelected'], 1],
                '#D93B2B',
                '#1A1A1A',
              ],
              'line-width': [
                'case',
                ['==', ['get', 'isSelected'], 1],
                3,
                1.5,
              ],
            }}
          />
        </Source>
      )}

      {/* Weather markers at centroids */}
      {regions.map((r) => (
        <Marker
          key={r.slug}
          longitude={r.centroid_lon}
          latitude={r.centroid_lat}
          anchor="center"
        >
          <div
            className={`flex items-center gap-0.5 border border-off-black rounded px-1 py-0.5 text-[10px] font-mono cursor-pointer select-none ${bestMonthSlugs.has(r.slug) ? 'best-month-marker' : 'bg-cream/90'}`}
            onClick={() => selectRegion(r.slug)}
          >
            <span>{countryFlag(r.country_code)} {r.has_monsoon ? '⛈️' : r.avg_temp_c !== null ? `${Math.round(r.avg_temp_c)}°` : '—'}</span>
          </div>
        </Marker>
      ))}

      {/* Shortlist heart badges */}
      {regions
        .filter((r) => shortlistedSlugs.includes(r.slug))
        .map((r) => (
          <Marker
            key={`heart-${r.slug}`}
            longitude={r.centroid_lon}
            latitude={r.centroid_lat}
            anchor="bottom-left"
            offset={[8, -8]}
          >
            <div className="text-red text-xs">&#10084;</div>
          </Marker>
        ))}

      {/* Friend markers at region centroids */}
      {enabledFriendIds.flatMap((fId) => {
        const friend = friends.find((f) => f.userId === fId)
        const data = friendData[fId]
        if (!friend || !data) return []
        const allSlugs = [...new Set([...data.shortlistedSlugs, ...data.visitedSlugs])]
        const idx = enabledFriendIds.indexOf(fId)
        return allSlugs
          .map((slug) => regions.find((r) => r.slug === slug))
          .filter(Boolean)
          .map((r) => (
            <Marker
              key={`friend-${fId}-${r!.slug}`}
              longitude={r!.centroid_lon}
              latitude={r!.centroid_lat}
              anchor="top-left"
              offset={[10 + idx * 14, 4]}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-off-black/40 shadow-sm cursor-pointer"
                style={{ backgroundColor: friend.avatarColor }}
                title={`${friend.displayName}: ${data.shortlistedSlugs.includes(r!.slug) ? '❤️' : ''} ${data.visitedSlugs.includes(r!.slug) ? '✓' : ''}`}
                onClick={() => selectRegion(r!.slug)}
              >
                {friend.avatarEmoji}
              </div>
            </Marker>
          ))
      })}

      {/* Hover popup */}
      {hovered && (
        <Popup
          longitude={hovered.lon}
          latitude={hovered.lat}
          closeButton={false}
          closeOnClick={false}
          anchor="bottom"
          offset={12}
        >
          <div className="font-display text-xs font-bold uppercase">{countryFlag(hovered.country_code)} {hovered.name}</div>
          <div className="flex items-center gap-2 mt-1 text-xs font-mono">
            {colorMode === 'busyness' ? (
              <>
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: busynessColor(hovered.busyness) }}
                />
                <span>{hovered.busyness}/5 · {busynessLabel(hovered.busyness)}</span>
              </>
            ) : (() => {
              const val = colorMode === 'weather' ? hovered.weatherScore
                : colorMode === 'bestTime' ? hovered.bestTimeScore
                : Math.round(hovered.overallScore)
              return (
                <>
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: scoreColor(val) }}
                  />
                  <span>{val}/100</span>
                  <span className="text-off-black/60">{scoreLabel(val)}</span>
                </>
              )
            })()}
            {hovered.temp !== null && <span>· {Math.round(hovered.temp)}°C</span>}
          </div>
        </Popup>
      )}

      {/* Legend + Color mode toggle */}
      <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 bg-cream/80 backdrop-blur-sm border-2 border-off-black/70 rounded-xl p-2 md:p-4 text-[10px] font-display uppercase">
        <div className="flex items-start gap-3">
          {/* Color mode toggle — vertical stack */}
          <div className="flex flex-col gap-1">
            {([
              { mode: 'overall' as ColorMode, label: 'Overall', tip: 'Best time score combined with cost and safety data' },
              { mode: 'bestTime' as ColorMode, label: 'Best Time', tip: 'Best combination of good weather and low crowds' },
              { mode: 'busyness' as ColorMode, label: 'Crowds', tip: 'Tourist crowd levels 1 (very quiet) to 5 (peak season)' },
              { mode: 'weather' as ColorMode, label: 'Weather', tip: 'Temperature, rainfall, sunshine, humidity, wind, cloud cover' },
            ]).map(({ mode, label, tip }) => (
              <button
                key={mode}
                onClick={() => setColorMode(mode)}
                className={`
                  relative group px-1.5 py-0.5 text-[10px] font-display font-bold rounded border-2 border-off-black transition-colors uppercase text-left
                  ${colorMode === mode ? 'bg-off-black text-cream' : 'bg-cream text-off-black hover:bg-off-black/10'}
                `}
              >
                {label}
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-off-black text-cream text-[10px] normal-case leading-snug rounded shadow-lg opacity-0 group-hover:opacity-100 group-hover:delay-500 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                  {tip}
                </span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px self-stretch bg-off-black/20" />

          {/* Legend items — vertical stack */}
          <div className="flex flex-col gap-0.5">
            {colorMode === 'busyness' ? (
              [
                { score: 1, label: 'Very Quiet' },
                { score: 2, label: 'Quiet' },
                { score: 3, label: 'Moderate' },
                { score: 4, label: 'Busy' },
                { score: 5, label: 'Peak Season' },
              ].map(({ score, label }) => {
                const hidden = hiddenScoreTiers.includes(score)
                return (
                  <button
                    key={score}
                    onClick={() => toggleScoreTier(score)}
                    className={`flex items-center gap-1.5 cursor-pointer ${hidden ? 'opacity-40 line-through' : ''}`}
                  >
                    <span
                      className="relative inline-flex items-center justify-center w-3 h-3 rounded-sm border border-off-black"
                      style={{ backgroundColor: hidden ? '#D4D0C8' : busynessColor(score), opacity: 0.65 }}
                    >
                      {!hidden && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
                    </span>
                    <span>{label}</span>
                  </button>
                )
              })
            ) : (
              [
                { score: 80, label: 'Excellent (80+)' },
                { score: 60, label: 'Good (60–79)' },
                { score: 40, label: 'Fair (40–59)' },
                { score: 20, label: 'Poor (20–39)' },
                { score: 10, label: 'Bad (0–19)' },
              ].map(({ score, label }) => {
                const hidden = hiddenScoreTiers.includes(score)
                return (
                  <button
                    key={score}
                    onClick={() => toggleScoreTier(score)}
                    className={`flex items-center gap-1.5 cursor-pointer ${hidden ? 'opacity-40 line-through' : ''}`}
                  >
                    <span
                      className="relative inline-flex items-center justify-center w-3 h-3 rounded-sm border border-off-black"
                      style={{ backgroundColor: hidden ? '#D4D0C8' : scoreColor(score), opacity: 0.65 }}
                    >
                      {!hidden && <span className="text-white text-[8px] font-bold leading-none">✓</span>}
                    </span>
                    <span>{label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </MapGL>
  )
}
