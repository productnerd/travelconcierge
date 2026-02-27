import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  duration?: number
  onDone: () => void
}

export default function Toast({ message, duration = 3000, onDone }: ToastProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter')

  useEffect(() => {
    // Trigger enter animation on next frame
    const enterTimer = requestAnimationFrame(() => setPhase('visible'))

    const exitTimer = setTimeout(() => {
      setPhase('exit')
      setTimeout(onDone, 400)
    }, duration)

    return () => {
      cancelAnimationFrame(enterTimer)
      clearTimeout(exitTimer)
    }
  }, [duration, onDone])

  return (
    <div
      className="fixed top-4 right-4 z-50 px-4 py-2 bg-off-black text-cream text-sm font-display rounded-lg shadow-lg"
      style={{
        transform: phase === 'visible' ? 'translateX(0)' : 'translateX(120%)',
        opacity: phase === 'visible' ? 1 : 0,
        transition: phase === 'exit'
          ? 'transform 400ms cubic-bezier(0.4, 0, 0.8, 0.2), opacity 400ms cubic-bezier(0.4, 0, 0.8, 0.2)'
          : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {message}
    </div>
  )
}
