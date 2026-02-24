import { useUIStore } from '@/store/uiStore'
import type { FilteredRegion } from '@/hooks/useRegions'
import RegionCards from './RegionCards'
import RegionDetail from './RegionDetail'

interface Props {
  regions: FilteredRegion[]
}

export default function SidePanel({ regions }: Props) {
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

      {/* Mobile overlay backdrop */}
      {sidePanelOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-20"
          onClick={toggleSidePanel}
        />
      )}

      {/* Panel */}
      <div
        className={`
          bg-cream overflow-y-auto scrollbar-thin shrink-0 transition-all duration-300
          ${sidePanelOpen
            ? 'fixed md:relative inset-y-0 right-0 w-[85vw] md:w-[400px] z-30 md:z-auto border-l-2 border-off-black'
            : 'w-0 border-l-0'
          }
        `}
      >
        {sidePanelOpen && (
          selectedRegion ? (
            <RegionDetail region={selectedRegion} />
          ) : (
            <RegionCards regions={regions} />
          )
        )}
      </div>
    </>
  )
}
