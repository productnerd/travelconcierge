import { useFilterStore } from '@/store/filterStore'
import { busynessLabel } from '@/types'

export default function BusynessFilter() {
  const busynessMax = useFilterStore((s) => s.busynessMax)
  const setBusynessMax = useFilterStore((s) => s.setBusynessMax)

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-display font-bold uppercase">Crowds:</span>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={busynessMax}
        onChange={(e) => setBusynessMax(Number(e.target.value))}
        className="w-20 h-1 accent-red"
      />
      <span className="text-xs font-mono">
        {busynessMax >= 5 ? 'Any' : `≤${busynessMax} ${busynessLabel(busynessMax)}`}
      </span>
    </div>
  )
}
