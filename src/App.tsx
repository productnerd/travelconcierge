import { Component, useEffect, useRef, useState, useCallback, type ReactNode } from 'react'
import FilterBar from '@/components/Filters/FilterBar'
import Toast from '@/components/ui/Toast'
import TravelMap from '@/components/Map/TravelMap'
import SidePanel from '@/components/SidePanel/SidePanel'
// import AgentBar from '@/components/Agent/AgentBar'
import AgentPanel from '@/components/Agent/AgentPanel'
import PlannerModal from '@/components/Planner/PlannerModal'
import { useRegions } from '@/hooks/useRegions'
import { useGeoJSON } from '@/hooks/useGeoJSON'
import { useAgent } from '@/hooks/useAgent'
import { useShareableLink } from '@/hooks/useShareableLink'
import { useUIStore } from '@/store/uiStore'
import { useFilterStore } from '@/store/filterStore'
import { useAuthStore } from '@/store/authStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useVisitedStore } from '@/store/visitedStore'
import { useSocialStore } from '@/store/socialStore'
import { useFriendLink } from '@/hooks/useFriendLink'
import SignupNudge from '@/components/Auth/SignupNudge'

const ACTIVITY_TOAST_MAP: Record<string, string> = {
  beach: '🏖️ Sea temperature & marine biodiversity taken into account',
  skiing: '⛷️ Snow conditions taken into account',
  surfing: '🏄 Wind conditions optimized for surfing',
  diving: '🤿 Sea conditions & marine biodiversity taken into account',
  freediving: '🤿 Calm water, sea conditions & marine biodiversity prioritized',
  hiking: '🥾 Cooler temperatures & biodiversity taken into account',
  food: '🍽️ Cuisine highlights shown',
}

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-off-black/40 font-display text-xs">
          Map failed to load. Try refreshing.
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  const { regions, allRegions, loading: regionsLoading } = useRegions()
  const { geojson } = useGeoJSON()
  const { messages, loading: agentLoading, sendMessage: _sendMessage, answerDecisionQuestion } = useAgent()
  const toggleSidePanel = useUIStore((s) => s.toggleSidePanel)
  const sidePanelOpen = useUIStore((s) => s.sidePanelOpen)
  const selectRegion = useUIStore((s) => s.selectRegion)

  const showShortlistOnly = useFilterStore((s) => s.showShortlistOnly)
  const showVisitedOnly = useFilterStore((s) => s.showVisitedOnly)

  // Deselect region when filters or color mode change (but not month selection)
  const filterKey = useFilterStore((s) =>
    `${s.busynessMax}-${s.hideRisky}-${s.colorMode}-${s.algorithmPreset}-${s.tempMin}-${s.tempMax}-${s.sunshineMin}-${s.rainfallMax}-${s.costMax}-${s.selectedActivities.length}-${s.selectedLandscapes.length}-${s.selectedContinents.length}`
  )
  const isMount = useRef(true)
  useEffect(() => {
    if (isMount.current) { isMount.current = false; return }
    selectRegion(null)
  }, [filterKey, selectRegion])

  // Activity-aware scoring toasts
  const selectedActivities = useFilterStore((s) => s.selectedActivities)
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([])
  const toastIdRef = useRef(0)
  const prevActivitiesRef = useRef<string[]>([])

  const ACTIVITY_TOASTS = ACTIVITY_TOAST_MAP

  useEffect(() => {
    const prev = prevActivitiesRef.current
    const added = selectedActivities.filter((a) => !prev.includes(a))
    prevActivitiesRef.current = selectedActivities

    for (const activity of added) {
      const msg = ACTIVITY_TOASTS[activity]
      if (msg && !toasts.some((t) => t.message === msg)) {
        const id = ++toastIdRef.current
        setToasts((t) => [...t, { id, message: msg }])
      }
    }
  }, [selectedActivities])

  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  // Initialize auth and sync data on login
  const initAuth = useAuthStore((s) => s.init)
  const authUser = useAuthStore((s) => s.user)
  const authInitialized = useAuthStore((s) => s.initialized)
  const migrateShortlist = useShortlistStore((s) => s.migrateToSupabase)
  const migrateVisited = useVisitedStore((s) => s.migrateToSupabase)

  useEffect(() => {
    const unsub = initAuth()
    return unsub
  }, [initAuth])

  // Load friends when user logs in
  const loadFriends = useSocialStore((s) => s.loadFriends)
  const loadPendingRequests = useSocialStore((s) => s.loadPendingRequests)

  // Migrate localStorage data to Supabase on first login
  const migrated = useRef(false)
  useEffect(() => {
    if (authUser && authInitialized && !migrated.current) {
      migrated.current = true
      migrateShortlist()
      migrateVisited()
      loadFriends()
      loadPendingRequests()
    }
  }, [authUser, authInitialized, migrateShortlist, migrateVisited, loadFriends, loadPendingRequests])

  // Handle ?friend= URL parameter
  useFriendLink()

  // Hydrate from URL params on mount
  useShareableLink()

  return (
    <div className="h-full w-full flex flex-col bg-cream">
      <h1 className="sr-only">Travel Concierge — Find Your Perfect Destination</h1>
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
            <MapErrorBoundary>
              <TravelMap
                regions={regions}
                geojson={geojson}
              />
            </MapErrorBoundary>
          )}

          {/* Mode headline overlay */}
          {(showShortlistOnly || showVisitedOnly) && (
            <div className="absolute top-3 left-3 z-10 px-4 py-2 bg-cream/70 backdrop-blur-sm rounded-xl border-2 border-off-black/20">
              <h2 className="font-display font-bold text-lg uppercase tracking-widest">
                {showShortlistOnly ? 'Bucket List' : 'Been There Done That'}
              </h2>
            </div>
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
        <SidePanel regions={regions} loading={regionsLoading} />
      </div>

      {/* Trip Planner Modal */}
      <PlannerModal regions={allRegions} />

      {/* Agent Panel (expanded chat) */}
      <AgentPanel
        messages={messages}
        loading={agentLoading}
        onAnswer={answerDecisionQuestion}
      />

      {/* Agent Bar (bottom) — hidden for now, will re-enable later */}
      {/* <AgentBar onSend={_sendMessage} loading={agentLoading} /> */}

      {/* Activity-aware scoring toasts */}
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} onDone={() => removeToast(toast.id)} />
      ))}

      {/* Signup nudge for anonymous users */}
      <SignupNudge />
    </div>
  )
}

export default App
