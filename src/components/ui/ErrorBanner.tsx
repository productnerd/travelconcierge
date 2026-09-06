import { useErrorStore } from '@/store/errorStore'

export default function ErrorBanner() {
  const errors = useErrorStore((s) => s.errors)
  const dismiss = useErrorStore((s) => s.dismiss)

  if (errors.length === 0) return null

  return (
    <div role="alert" aria-live="assertive" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] w-[min(560px,calc(100vw-2rem))] flex flex-col gap-2">
      {errors.map((e) => (
        <div key={e.id} className="flex items-start gap-3 px-4 py-3 bg-off-black text-cream rounded-lg shadow-lg border-2 border-red-500">
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[10px] uppercase tracking-widest text-red-400">{e.context} failed</div>
            <div className="text-sm break-words">{e.message}</div>
          </div>
          <button
            onClick={() => dismiss(e.id)}
            aria-label="Dismiss error"
            className="shrink-0 px-2 text-cream/60 hover:text-cream text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
