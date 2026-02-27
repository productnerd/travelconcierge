import { useMemo, useCallback } from 'react'
import type { FilteredRegion } from '@/hooks/useRegions'
import RegionCard from './RegionCard'
import { useFilterStore, type SortBy } from '@/store/filterStore'
import { COST_INDEX, overallScore, CONTINENTS } from '@/data/costIndex'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function regionOverall(region: FilteredRegion, activities: string[]): number {
  return overallScore(region.bestTimeScore, region.country_code, activities)
}

const SORT_OPTIONS: { key: SortBy; label: string; tip: string }[] = [
  { key: 'overall', label: 'Overall', tip: 'Weather + crowds + cost + safety combined' },
  { key: 'bestTime', label: 'Best Time', tip: 'Best combination of weather and low crowds' },
  { key: 'distance', label: 'Distance', tip: 'Closest to your current location' },
  { key: 'cost', label: 'Cost', tip: 'Daily travel budget, cheapest first' },
  { key: 'name', label: 'A–Z', tip: 'Alphabetical by region name' },
]

interface Props {
  regions: FilteredRegion[]
}

export default function RegionCards({ regions }: Props) {
  const sortBy = useFilterStore((s) => s.sortBy)
  const setSortBy = useFilterStore((s) => s.setSortBy)
  const userLocation = useFilterStore((s) => s.userLocation)
  const setUserLocation = useFilterStore((s) => s.setUserLocation)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)
  const selectedContinents = useFilterStore((s) => s.selectedContinents)
  const toggleContinent = useFilterStore((s) => s.toggleContinent)

  const handleSortClick = useCallback((key: SortBy) => {
    if (key === 'distance' && !userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude])
          setSortBy('distance')
        },
        () => setSortBy('distance'), // still set even if denied — will just not sort by distance
      )
      return
    }
    setSortBy(key)
  }, [userLocation, setSortBy, setUserLocation])

  const sorted = useMemo(() => {
    const arr = [...regions]
    switch (sortBy) {
      case 'overall':
        return arr.sort((a, b) => regionOverall(b, selectedActivities) - regionOverall(a, selectedActivities))
      case 'bestTime':
        return arr.sort((a, b) => b.bestTimeScore - a.bestTimeScore)
      case 'distance':
        if (!userLocation) return arr.sort((a, b) => a.name.localeCompare(b.name))
        return arr.sort((a, b) =>
          haversineKm(userLocation[0], userLocation[1], a.centroid_lat, a.centroid_lon) -
          haversineKm(userLocation[0], userLocation[1], b.centroid_lat, b.centroid_lon)
        )
      case 'cost':
        return arr.sort((a, b) => (COST_INDEX[a.country_code] ?? 3) - (COST_INDEX[b.country_code] ?? 3))
      case 'name':
        return arr.sort((a, b) => a.name.localeCompare(b.name))
      default:
        return arr
    }
  }, [regions, sortBy, userLocation, selectedActivities])

  if (regions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="font-display font-bold text-off-black/40 mt-8">No regions match your filters</p>
        <p className="text-xs text-off-black/30 mt-2">Try relaxing some filters or ask Compass for suggestions</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Sort controls */}
      <div className="mb-2">
        <span className="text-[10px] font-display font-bold text-off-black/50 uppercase block mb-1">Sort:</span>
        <div className="flex items-center gap-1">
          {SORT_OPTIONS.map(({ key, label, tip }) => (
            <button
              key={key}
              onClick={() => handleSortClick(key)}
              title={tip}
              className={`
                px-2 py-0.5 text-[10px] font-display font-bold rounded border-2 border-off-black transition-colors uppercase
                ${sortBy === key ? 'bg-off-black text-cream' : 'bg-cream text-off-black hover:bg-off-black/10'}
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Continent filter */}
      <div className="mb-3">
        <span className="text-[10px] font-display font-bold text-off-black/50 uppercase block mb-1">Region:</span>
        <div className="flex items-center gap-1 flex-wrap">
          {CONTINENTS.map((c) => (
            <button
              key={c}
              onClick={() => toggleContinent(c)}
              className={`
                px-2 py-0.5 text-[10px] font-display font-bold rounded border-2 border-off-black transition-colors uppercase
                ${selectedContinents.includes(c) ? 'bg-off-black text-cream' : 'bg-cream text-off-black hover:bg-off-black/10'}
              `}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] font-display text-off-black/60 mb-3 uppercase">
        {regions.length} region{regions.length !== 1 ? 's' : ''}
      </p>

      <div className="flex flex-col gap-3">
        {sorted.map((region) => (
          <RegionCard key={region.slug} region={region} />
        ))}
      </div>
    </div>
  )
}
