import { useFilterStore } from '@/store/filterStore'

export default function TempFilter() {
  const tempMin = useFilterStore((s) => s.tempMin)
  const tempMax = useFilterStore((s) => s.tempMax)
  const setTempRange = useFilterStore((s) => s.setTempRange)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-display font-bold uppercase">Temp:</span>
      <input
        type="range"
        min={-10}
        max={45}
        value={tempMin ?? -10}
        onChange={(e) => setTempRange(Number(e.target.value), tempMax)}
        onDoubleClick={() => setTempRange(null, tempMax)}
        className="w-16"
      />
      <span className="text-xs font-mono w-8">{tempMin ?? -10}°</span>
      <span className="text-xs">—</span>
      <input
        type="range"
        min={-10}
        max={45}
        value={tempMax ?? 45}
        onChange={(e) => setTempRange(tempMin, Number(e.target.value))}
        onDoubleClick={() => setTempRange(tempMin, null)}
        className="w-16"
      />
      <span className="text-xs font-mono w-8">{tempMax ?? 45}°</span>
    </div>
  )
}
