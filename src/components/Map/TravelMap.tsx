import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapGL, { Layer, Source, Popup, Marker } from 'react-map-gl/mapbox'
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox'
import { useUIStore } from '@/store/uiStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useFilterStore } from '@/store/filterStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import { busynessColor, busynessLabel } from '@/types'
import { scoreColor, scoreLabel, PRESET_LABELS, type AlgorithmPreset } from '@/utils/scoring'
import { COST_INDEX, safetyMultiplier } from '@/data/costIndex'
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
    busyness: number; temp: number | null;
    weatherScore: number; bestTimeScore: number; overallScore: number;
  } | null>(null)
  const selectRegion = useUIStore((s) => s.selectRegion)
  const selectedSlug = useUIStore((s) => s.selectedRegionSlug)
  const highlightedSlugs = useUIStore((s) => s.highlightedSlugs)
  const eliminatedSlugs = useUIStore((s) => s.eliminatedSlugs)
  const shortlistedSlugs = useShortlistStore((s) => s.shortlistedSlugs)
  const colorMode = useFilterStore((s) => s.colorMode)
  const setColorMode = useFilterStore((s) => s.setColorMode)
  const algorithmPreset = useFilterStore((s) => s.algorithmPreset)
  const setAlgorithmPreset = useFilterStore((s) => s.setAlgorithmPreset)

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
              ? (region.bestTimeScore * 0.75 + (120 - (COST_INDEX[region.country_code] ?? 3) * 20) * 0.25) * safetyMultiplier(region.country_code)
              : 0,
            isFiltered: isFiltered ? 1 : 0,
            isEliminated: isEliminated ? 1 : 0,
            isHighlighted: isHighlighted ? 1 : 0,
            isSelected: region?.slug === selectedSlug ? 1 : 0,
          },
        }
      }),
    } as GeoJSON.FeatureCollection
  }, [geojson, regionByGeojsonId, eliminatedSlugs, highlightedSlugs, selectedSlug])

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
          weatherScore: region.weatherScore,
          bestTimeScore: region.bestTimeScore,
          overallScore: (region.bestTimeScore * 0.75 + (120 - (COST_INDEX[region.country_code] ?? 3) * 20) * 0.25) * safetyMultiplier(region.country_code),
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
      interactiveLayerIds={['region-fill']}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      cursor={hovered ? 'pointer' : 'grab'}
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
                      'interpolate', ['linear'],
                      ['get', colorMode === 'weather' ? 'weatherScore' : colorMode === 'bestTime' ? 'bestTimeScore' : 'overallScore'],
                      0, '#8B1A10', 20, '#D93B2B', 40, '#F5C842', 60, '#6BAF78', 80, '#3B7A4A',
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
            className="flex items-center gap-0.5 bg-cream/90 border border-off-black rounded px-1 py-0.5 text-[10px] font-mono cursor-pointer select-none"
            onClick={() => selectRegion(r.slug)}
          >
            <span>{r.avg_temp_c !== null ? `${Math.round(r.avg_temp_c)}°` : '—'}</span>
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
          <div className="font-display text-sm font-bold">{hovered.name}</div>
          <div className="flex items-center gap-2 mt-1 text-xs font-mono">
            {colorMode === 'busyness' ? (
              <>
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: busynessColor(hovered.busyness) }}
                />
                <span>{busynessLabel(hovered.busyness)}</span>
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
      <div className="absolute bottom-4 left-4 bg-cream border-2 border-off-black rounded-xl p-3 text-xs font-display">
        {/* Color mode toggle */}
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {([
            { mode: 'overall' as ColorMode, label: 'Overall' },
            { mode: 'busyness' as ColorMode, label: 'Crowds' },
            { mode: 'weather' as ColorMode, label: 'Weather' },
            { mode: 'bestTime' as ColorMode, label: 'Best Time' },
          ]).map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`
                px-2 py-1 text-[10px] font-display font-bold rounded-lg border-2 border-off-black transition-colors
                ${colorMode === mode ? 'bg-off-black text-cream' : 'bg-cream text-off-black hover:bg-off-black/10'}
              `}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Preset selector (only visible for bestTime mode) */}
        {colorMode === 'bestTime' && (
          <div className="flex items-center gap-1 mb-2">
            {(Object.entries(PRESET_LABELS) as [AlgorithmPreset, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setAlgorithmPreset(key)}
                className={`
                  px-1.5 py-0.5 text-[9px] font-display font-bold rounded border-2 border-off-black transition-colors
                  ${algorithmPreset === key ? 'bg-red text-white' : 'bg-cream text-off-black hover:bg-red-light'}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Legend items */}
        {colorMode === 'busyness' ? (
          [
            { score: 1, label: 'Very Quiet' },
            { score: 2, label: 'Quiet' },
            { score: 3, label: 'Moderate' },
            { score: 4, label: 'Busy' },
            { score: 5, label: 'Peak Season' },
          ].map(({ score, label }) => (
            <div key={score} className="flex items-center gap-2 mb-0.5">
              <span
                className="inline-block w-3 h-3 rounded-sm border border-off-black"
                style={{ backgroundColor: busynessColor(score), opacity: 0.65 }}
              />
              <span>{label}</span>
            </div>
          ))
        ) : (
          [
            { score: 80, label: 'Excellent (80+)' },
            { score: 60, label: 'Good (60–80)' },
            { score: 40, label: 'Fair (40–60)' },
            { score: 20, label: 'Poor (20–40)' },
            { score: 10, label: 'Bad (0–20)' },
          ].map(({ score, label }) => (
            <div key={score} className="flex items-center gap-2 mb-0.5">
              <span
                className="inline-block w-3 h-3 rounded-sm border border-off-black"
                style={{ backgroundColor: scoreColor(score), opacity: 0.65 }}
              />
              <span>{label}</span>
            </div>
          ))
        )}
      </div>
    </MapGL>
  )
}
