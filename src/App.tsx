import { useEffect, useRef } from 'react'
import FilterBar from '@/components/Filters/FilterBar'
import TravelMap from '@/components/Map/TravelMap'
import SidePanel from '@/components/SidePanel/SidePanel'
import AgentBar from '@/components/Agent/AgentBar'
import AgentPanel from '@/components/Agent/AgentPanel'
import { useRegions } from '@/hooks/useRegions'
import { useGeoJSON } from '@/hooks/useGeoJSON'
import { useAgent } from '@/hooks/useAgent'
import { useShareableLink } from '@/hooks/useShareableLink'
import { useUIStore } from '@/store/uiStore'
import { useFilterStore } from '@/store/filterStore'

function App() {
  const { regions, loading: regionsLoading } = useRegions()
  const { geojson } = useGeoJSON()
  const { messages, loading: agentLoading, sendMessage, answerDecisionQuestion } = useAgent()
  const toggleSidePanel = useUIStore((s) => s.toggleSidePanel)
  const sidePanelOpen = useUIStore((s) => s.sidePanelOpen)
  const selectRegion = useUIStore((s) => s.selectRegion)

  // Deselect region when filters or color mode change
  const filterKey = useFilterStore((s) =>
    `${s.selectedMonths}-${s.busynessMax}-${s.hideRisky}-${s.colorMode}-${s.algorithmPreset}-${s.tempMin}-${s.tempMax}-${s.sunshineMin}-${s.rainfallMax}-${s.selectedActivities.length}-${s.selectedLandscapes.length}`
  )
  const isMount = useRef(true)
  useEffect(() => {
    if (isMount.current) { isMount.current = false; return }
    selectRegion(null)
  }, [filterKey, selectRegion])

  // Hydrate from URL params on mount
  useShareableLink()

  return (
    <div className="h-full w-full flex flex-col bg-cream">
      {/* Filter Bar */}
      <FilterBar />

      {/* Main content: Map + Side Panel */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Map area */}
        <div className="flex-1 relative">
          {regionsLoading ? (
            <div className="flex items-center justify-center h-full text-off-black/40 font-display">
              <div className="text-center">
                <div className="skeleton w-6 h-6 rounded-full mx-auto mb-3" />
                <span>Loading regions...</span>
              </div>
            </div>
          ) : (
            <TravelMap
              regions={regions}
              geojson={geojson}
            />
          )}

          {/* Mobile: floating button to open side panel */}
          <button
            onClick={toggleSidePanel}
            className={`
              md:hidden absolute top-3 right-3 z-10 bg-cream border-2 border-off-black rounded-lg px-3 py-2 font-display text-xs font-bold
              ${sidePanelOpen ? 'hidden' : ''}
            `}
          >
            Regions ({regions.length})
          </button>
        </div>

        {/* Side Panel */}
        <SidePanel regions={regions} />
      </div>

      {/* Agent Panel (expanded chat) */}
      <AgentPanel
        messages={messages}
        loading={agentLoading}
        onAnswer={answerDecisionQuestion}
      />

      {/* Agent Bar (bottom) */}
      <AgentBar onSend={sendMessage} loading={agentLoading} />
    </div>
  )
}

export default App
