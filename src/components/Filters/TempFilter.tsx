import { useFilterStore } from '@/store/filterStore'

const MIN = -10
const MAX = 45

export default function TempFilter() {
  const tempMin = useFilterStore((s) => s.tempMin)
  const tempMax = useFilterStore((s) => s.tempMax)
  const setTempRange = useFilterStore((s) => s.setTempRange)

  const lo = tempMin ?? MIN
  const hi = tempMax ?? MAX

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-[10px] font-display font-bold uppercase">Temp:</span>
      <div className="relative w-24 h-5">
        {/* Track fill between thumbs */}
        <div
          className="absolute top-1/2 h-[3px] bg-off-black/40 rounded-full -translate-y-1/2 pointer-events-none"
          style={{
            left: `${((lo - MIN) / (MAX - MIN)) * 100}%`,
            right: `${100 - ((hi - MIN) / (MAX - MIN)) * 100}%`,
          }}
        />
        {/* Min slider */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={lo}
          onChange={(e) => {
            const v = Number(e.target.value)
            setTempRange(v <= MIN ? null : v, tempMax)
          }}
          onDoubleClick={() => setTempRange(null, tempMax)}
          className="range-dual range-dual-min"
        />
        {/* Max slider */}
        <input
          type="range"
          min={MIN}
          max={MAX}
          value={hi}
          onChange={(e) => {
            const v = Number(e.target.value)
            setTempRange(tempMin, v >= MAX ? null : v)
          }}
          onDoubleClick={() => setTempRange(tempMin, null)}
          className="range-dual range-dual-max"
        />
      </div>
      <span className="text-xs font-mono whitespace-nowrap">{lo}°–{hi}°</span>
    </div>
  )
}
