import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useShortlistStore } from '@/store/shortlistStore'
import { useVisitedStore } from '@/store/visitedStore'

const NUDGE_KEY = 'travel_nudge_dismissed'
const THRESHOLDS = [5, 20]

function getDismissed(): number[] {
  try {
    return JSON.parse(localStorage.getItem(NUDGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function setDismissed(thresholds: number[]) {
  localStorage.setItem(NUDGE_KEY, JSON.stringify(thresholds))
}

export default function SignupNudge() {
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const shortlistCount = useShortlistStore((s) => s.shortlistedSlugs.length)
  const visitedCount = useVisitedStore((s) => s.visitedSlugs.length)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissedState] = useState<number[]>(getDismissed)

  useEffect(() => {
    if (!initialized || user) return
    const total = shortlistCount + visitedCount
    const activeThreshold = THRESHOLDS.find((t) => total >= t && !dismissed.includes(t))
    if (activeThreshold) setVisible(true)
  }, [shortlistCount, visitedCount, user, initialized, dismissed])

  const handleDismiss = () => {
    const total = shortlistCount + visitedCount
    const hit = THRESHOLDS.filter((t) => total >= t)
    const next = [...new Set([...dismissed, ...hit])]
    setDismissed(next)
    setDismissedState(next)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90vw] bg-off-black text-cream rounded-lg shadow-lg p-4 border-2 border-off-black">
      <p className="text-xs font-display font-bold mb-1">Save your progress?</p>
      <p className="text-[11px] text-cream/70 mb-3">
        If you clear browser data, your saved destinations will be lost. We recommend signing up to store your data in the cloud.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleDismiss}
          className="flex-1 px-3 py-1.5 text-[10px] font-display font-bold uppercase rounded border border-cream/30 hover:bg-cream/10 transition-colors"
        >
          Maybe Later
        </button>
        <button
          onClick={() => {
            handleDismiss()
            // Scroll to top and open auth dropdown by dispatching a custom event
            window.dispatchEvent(new CustomEvent('open-auth'))
          }}
          className="flex-1 px-3 py-1.5 text-[10px] font-display font-bold uppercase rounded bg-red text-white hover:bg-red/80 transition-colors"
        >
          Sign Up
        </button>
      </div>
    </div>
  )
}
