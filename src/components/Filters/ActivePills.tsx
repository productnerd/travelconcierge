import { useFilterStore } from '@/store/filterStore'

export default function ActivePills() {
  const filters = useFilterStore()

  const pills: { key: string; label: string; isAgent: boolean }[] = []

  if (filters.busynessMax < 5) {
    const label = filters.busynessMax <= 2 ? 'Quiet only' : `Busyness ≤ ${filters.busynessMax}/5`
    pills.push({ key: 'busynessMax', label, isAgent: filters.agentAppliedKeys.includes('busynessMax') })
  }

  if (filters.tempMin !== null && filters.tempMin > -10) {
    pills.push({ key: 'tempMin', label: `Temp ≥ ${filters.tempMin}°C`, isAgent: filters.agentAppliedKeys.includes('tempMin') })
  }

  if (filters.tempMax !== null && filters.tempMax < 45) {
    pills.push({ key: 'tempMax', label: `Temp ≤ ${filters.tempMax}°C`, isAgent: filters.agentAppliedKeys.includes('tempMax') })
  }

  if (filters.sunshineMin !== null) {
    pills.push({ key: 'sunshineMin', label: `Sun ≥ ${filters.sunshineMin}h`, isAgent: filters.agentAppliedKeys.includes('sunshineMin') })
  }

  if (filters.rainfallMax !== null) {
    pills.push({ key: 'rainfallMax', label: `Rain ≤ ${filters.rainfallMax}mm`, isAgent: filters.agentAppliedKeys.includes('rainfallMax') })
  }

  // Activities and landscapes are toggled directly from the filter bar pills — no X-tags needed

  if (filters.showShortlistOnly) {
    pills.push({ key: 'showShortlistOnly', label: 'Shortlist only', isAgent: false })
  }

  if (pills.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {pills.map((pill) => (
        <button
          key={pill.key}
          onClick={() => {
            if (pill.key.startsWith('activity-')) {
              filters.toggleActivity(pill.key.replace('activity-', ''))
            } else if (pill.key.startsWith('landscape-')) {
              filters.toggleLandscape(pill.key.replace('landscape-', ''))
            } else {
              filters.clearFilter(pill.key)
            }
          }}
          className={`
            flex items-center gap-1 px-2 py-0.5 text-[10px] font-display rounded-lg border-2 border-off-black transition-colors uppercase
            ${pill.isAgent
              ? 'bg-red text-white'
              : 'bg-cream text-off-black hover:bg-red-light'
            }
          `}
        >
          {pill.isAgent && <span>&#10024;</span>}
          {pill.label}
          <span className="ml-1 opacity-60">&#10005;</span>
        </button>
      ))}
    </div>
  )
}
