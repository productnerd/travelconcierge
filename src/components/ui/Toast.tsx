import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  duration?: number
  onDone: () => void
}

export default function Toast({ message, duration = 3000, onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDone])

  return (
    <div
      className={`
        fixed bottom-20 left-1/2 -translate-x-1/2 z-50
        px-4 py-2 bg-off-black text-cream text-sm font-display rounded-lg
        shadow-lg transition-opacity duration-300
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {message}
    </div>
  )
}
