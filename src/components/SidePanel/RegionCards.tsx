import type { FilteredRegion } from '@/hooks/useRegions'
import RegionCard from './RegionCard'

interface Props {
  regions: FilteredRegion[]
}

export default function RegionCards({ regions }: Props) {
  if (regions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="font-display font-bold text-off-black/40 mt-8">No regions match your filters</p>
        <p className="text-xs text-off-black/30 mt-2">Try relaxing some filters or ask Compass for suggestions</p>
      </div>
    )
  }

  return (
    <div className="p-3">
      <p className="text-xs font-display text-off-black/60 mb-3">
        {regions.length} region{regions.length !== 1 ? 's' : ''} match
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {regions.map((region) => (
          <RegionCard key={region.slug} region={region} />
        ))}
      </div>
    </div>
  )
}
