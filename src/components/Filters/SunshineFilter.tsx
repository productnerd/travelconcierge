import { useFilterStore } from '@/store/filterStore'

export default function SunshineFilter() {
  const sunshineMin = useFilterStore((s) => s.sunshineMin)
  const setSunshineMin = useFilterStore((s) => s.setSunshineMin)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-xs font-display font-bold">Sun:</span>
      <input
        type="range"
        min={0}
        max={12}
        step={0.5}
        value={sunshineMin ?? 0}
        onChange={(e) => {
          const v = Number(e.target.value)
          setSunshineMin(v === 0 ? null : v)
        }}
        className="w-20 h-1 accent-amber"
      />
      <span className="text-xs font-mono">{sunshineMin ?? 0}h+</span>
    </div>
  )
}
