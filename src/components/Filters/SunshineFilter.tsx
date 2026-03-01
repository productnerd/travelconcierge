import { useFilterStore } from '@/store/filterStore'

export default function SunshineFilter() {
  const sunshineMin = useFilterStore((s) => s.sunshineMin)
  const setSunshineMin = useFilterStore((s) => s.setSunshineMin)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-display font-bold uppercase">Sun:</span>
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
        onDoubleClick={() => setSunshineMin(null)}
        className="w-20 h-1 accent-red"
      />
      <span className="text-xs font-mono">{sunshineMin ?? 0}h+</span>
    </div>
  )
}
