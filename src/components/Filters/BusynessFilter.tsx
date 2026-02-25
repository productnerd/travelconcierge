import { useFilterStore } from '@/store/filterStore'

const OPTIONS = [
  { label: 'Any', value: 10 },
  { label: 'Quiet', value: 4 },
  { label: 'Moderate', value: 6 },
  { label: 'Busy', value: 8 },
]

export default function BusynessFilter() {
  const busynessMax = useFilterStore((s) => s.busynessMax)
  const setBusynessMax = useFilterStore((s) => s.setBusynessMax)

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-display font-bold mr-1">Busy:</span>
      {OPTIONS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setBusynessMax(value)}
          className={`
            px-2 py-1 text-xs font-display rounded-lg border-2 border-off-black transition-colors
            ${busynessMax === value
              ? 'bg-red text-white font-bold'
              : 'bg-cream text-off-black hover:bg-red-light'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
