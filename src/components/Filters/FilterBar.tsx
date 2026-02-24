import { useState } from 'react'
import MonthSelector from './MonthSelector'
import BusynessFilter from './BusynessFilter'
import TempFilter from './TempFilter'
import SunshineFilter from './SunshineFilter'
import ActivePills from './ActivePills'
import { useFilterStore } from '@/store/filterStore'
import { useShortlistStore } from '@/store/shortlistStore'

const ACTIVITIES = ['surfing', 'hiking', 'diving', 'freediving', 'snorkeling', 'cultural', 'food', 'safari', 'skiing', 'beach', 'wildlife', 'adventure']
const LANDSCAPES = ['beach', 'mountain', 'jungle', 'desert', 'city', 'island']

export default function FilterBar() {
  const [expanded, setExpanded] = useState(false)
  const toggleActivity = useFilterStore((s) => s.toggleActivity)
  const toggleLandscape = useFilterStore((s) => s.toggleLandscape)
  const selectedActivities = useFilterStore((s) => s.selectedActivities)
  const selectedLandscapes = useFilterStore((s) => s.selectedLandscapes)
  const showShortlistOnly = useFilterStore((s) => s.showShortlistOnly)
  const setShowShortlistOnly = useFilterStore((s) => s.setShowShortlistOnly)
  const rainfallMax = useFilterStore((s) => s.rainfallMax)
  const setFilter = useFilterStore((s) => s.setFilter)
  const shortlistedCount = useShortlistStore((s) => s.shortlistedSlugs.length)

  return (
    <div className="border-b-2 border-off-black bg-cream px-3 md:px-4 py-2 md:py-3 shrink-0">
      {/* Row 1: Months + core filters (scrollable on mobile) */}
      <div className="flex items-center gap-3 md:gap-4 overflow-x-auto pb-1 scrollbar-thin">
        <MonthSelector />

        <div className="w-px h-6 bg-off-black/20 shrink-0" />

        <BusynessFilter />

        <div className="w-px h-6 bg-off-black/20 shrink-0 hidden md:block" />

        {/* More filters toggle on mobile */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="md:hidden px-2 py-1 text-[10px] font-display font-bold rounded border-2 border-off-black bg-cream shrink-0"
        >
          {expanded ? 'Less' : 'More'}
        </button>

        {/* Desktop-only inline filters */}
        <div className="hidden md:flex items-center gap-4">
          <TempFilter />

          <div className="w-px h-6 bg-off-black/20" />

          <SunshineFilter />

          <div className="w-px h-6 bg-off-black/20" />

          {/* Rainfall */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-display font-bold">Rain:</span>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={rainfallMax ?? 500}
              onChange={(e) => {
                const v = Number(e.target.value)
                setFilter('rainfallMax', v >= 500 ? null : v)
              }}
              className="w-20 h-1 accent-red"
            />
            <span className="text-xs font-mono">{rainfallMax ?? '∞'}mm</span>
          </div>
        </div>

        {/* Shortlist toggle */}
        {shortlistedCount > 0 && (
          <>
            <div className="w-px h-6 bg-off-black/20 shrink-0" />
            <button
              onClick={() => setShowShortlistOnly(!showShortlistOnly)}
              className={`
                flex items-center gap-1 px-2 py-1 text-xs font-display font-bold rounded-lg border-2 border-off-black transition-colors shrink-0
                ${showShortlistOnly ? 'bg-red text-white' : 'bg-cream text-off-black hover:bg-red-light'}
              `}
            >
              &#10084; {shortlistedCount}
            </button>
          </>
        )}
      </div>

      {/* Mobile expanded filters */}
      {expanded && (
        <div className="md:hidden flex items-center gap-3 mt-2 overflow-x-auto pb-1">
          <TempFilter />
          <div className="w-px h-6 bg-off-black/20 shrink-0" />
          <SunshineFilter />
          <div className="w-px h-6 bg-off-black/20 shrink-0" />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-display font-bold">Rain:</span>
            <input
              type="range"
              min={0}
              max={500}
              step={10}
              value={rainfallMax ?? 500}
              onChange={(e) => {
                const v = Number(e.target.value)
                setFilter('rainfallMax', v >= 500 ? null : v)
              }}
              className="w-20 h-1 accent-red"
            />
            <span className="text-xs font-mono">{rainfallMax ?? '∞'}mm</span>
          </div>
        </div>
      )}

      {/* Row 2: Activities + Landscapes (scrollable) */}
      <div className="flex items-center gap-3 mt-2 overflow-x-auto pb-0.5">
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-display font-bold mr-1">Activities:</span>
          {ACTIVITIES.map((a) => (
            <button
              key={a}
              onClick={() => toggleActivity(a)}
              className={`
                px-1.5 py-0.5 text-[10px] font-display rounded border-2 border-off-black transition-colors capitalize shrink-0
                ${selectedActivities.includes(a)
                  ? 'bg-red text-white font-bold'
                  : 'bg-cream text-off-black hover:bg-red-light'
                }
              `}
            >
              {a}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-off-black/20 shrink-0" />

        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-display font-bold mr-1">Landscape:</span>
          {LANDSCAPES.map((l) => (
            <button
              key={l}
              onClick={() => toggleLandscape(l)}
              className={`
                px-1.5 py-0.5 text-[10px] font-display rounded border-2 border-off-black transition-colors capitalize shrink-0
                ${selectedLandscapes.includes(l)
                  ? 'bg-red text-white font-bold'
                  : 'bg-cream text-off-black hover:bg-red-light'
                }
              `}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Row 3: Active filter pills */}
      <ActivePills />
    </div>
  )
}
