import { useUIStore } from '@/store/uiStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import RegionCards from './RegionCards'
import RegionDetail from './RegionDetail'

interface Props {
  regions: FilteredRegion[]
  loading?: boolean
}

export default function SidePanel({ regions, loading }: Props) {
  const sidePanelOpen = useUIStore((s) => s.sidePanelOpen)
  const toggleSidePanel = useUIStore((s) => s.toggleSidePanel)
  const selectedSlug = useUIStore((s) => s.selectedRegionSlug)

  const selectedRegion = selectedSlug
    ? regions.find((r) => r.slug === selectedSlug) ?? null
    : null

  return (
    <>
      {/* Toggle button — desktop only */}
      <button
        onClick={toggleSidePanel}
        className="hidden md:block absolute top-1/2 -translate-y-1/2 z-10 bg-cream border-2 border-off-black border-r-0 rounded-l-lg px-1 py-3 font-display text-xs hover:bg-red-light transition-colors"
        style={{ right: sidePanelOpen ? '400px' : '0px' }}
      >
        {sidePanelOpen ? '▶' : '◀'}
      </button>

      {/* Mobile overlay backdrop — tap map area to close */}
      {sidePanelOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-20"
          onClick={toggleSidePanel}
        />
      )}

      {/* Desktop panel — right side */}
      <div
        className={`
          hidden md:block bg-cream overflow-y-auto scrollbar-thin shrink-0 transition-all duration-300
          ${sidePanelOpen
            ? 'w-[400px] border-l-2 border-off-black'
            : 'w-0 border-l-0'
          }
        `}
      >
        {sidePanelOpen && (
          selectedRegion ? (
            <RegionDetail region={selectedRegion} />
          ) : (
            <RegionCards regions={regions} loading={loading} />
          )
        )}
      </div>

      {/* Mobile bottom sheet */}
      <div
        className={`
          md:hidden fixed left-0 right-0 z-30 bg-cream border-t-2 border-off-black rounded-t-xl
          overflow-y-auto transition-transform duration-300 ease-out
          ${sidePanelOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ bottom: 0, maxHeight: '60vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center py-2 sticky top-0 bg-cream z-10">
          <div className="w-10 h-1 rounded-full bg-off-black/30" />
        </div>
        {sidePanelOpen && (
          selectedRegion ? (
            <RegionDetail region={selectedRegion} />
          ) : (
            <RegionCards regions={regions} loading={loading} />
          )
        )}
      </div>
    </>
  )
}
