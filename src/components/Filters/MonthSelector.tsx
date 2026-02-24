import { useFilterStore } from '@/store/filterStore'

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MonthSelector() {
  const selectedMonths = useFilterStore((s) => s.selectedMonths)
  const toggleMonth = useFilterStore((s) => s.toggleMonth)

  return (
    <div className="flex gap-0.5 md:gap-1 shrink-0">
      {MONTH_LABELS.map((label, i) => {
        const month = i + 1
        const isSelected = selectedMonths.includes(month)
        return (
          <button
            key={month}
            onClick={() => toggleMonth(month)}
            className={`
              px-1.5 md:px-2 py-0.5 md:py-1 text-[10px] md:text-xs font-display font-bold rounded-lg border-2 border-off-black transition-colors
              ${isSelected
                ? 'bg-red text-white'
                : 'bg-cream text-off-black hover:bg-red-light'
              }
            `}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
