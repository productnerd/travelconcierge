import { useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useShareableLink } from '@/hooks/useShareableLink'

interface Props {
  onSend: (text: string) => void
  loading: boolean
}

export default function AgentBar({ onSend, loading }: Props) {
  const [input, setInput] = useState('')
  const [sharePopup, setSharePopup] = useState(false)
  const [copied, setCopied] = useState(false)
  const toggleAgentPanel = useUIStore((s) => s.toggleAgentPanel)
  const agentPanelOpen = useUIStore((s) => s.agentPanelOpen)
  const { shareFilters, shareShortlist } = useShareableLink()

  const handleSubmit = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  const handleShare = async (type: 'filters' | 'shortlist') => {
    if (type === 'filters') {
      shareFilters()
    } else {
      await shareShortlist()
    }
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setSharePopup(false)
    }, 1500)
  }

  return (
    <div className="h-12 md:h-14 bg-black flex items-center px-2 md:px-4 gap-2 md:gap-3 shrink-0 relative">
      {/* Compass label + expand toggle */}
      <button
        onClick={toggleAgentPanel}
        className="font-mono text-white text-xs md:text-sm hover:text-red-light transition-colors shrink-0"
      >
        <span className="hidden md:inline">Compass </span>
        <span className="md:hidden">&#9774; </span>
        {agentPanelOpen ? '▼' : '▲'}
      </button>

      {/* Input */}
      <div className="flex-1 flex min-w-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          onFocus={() => {
            if (!agentPanelOpen) toggleAgentPanel()
          }}
          placeholder="Ask Compass anything..."
          className="flex-1 min-w-0 bg-cream text-off-black border-2 border-off-black rounded-l-lg px-2 md:px-3 py-1.5 text-sm font-body placeholder:text-off-black/40 outline-none"
          disabled={loading}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !input.trim()}
          className="bg-red text-white font-display text-sm font-bold px-3 py-1.5 border-2 border-l-0 border-off-black rounded-r-lg disabled:opacity-50"
        >
          {loading ? '...' : '→'}
        </button>
      </div>

      {/* Share button */}
      <div className="relative">
        <button
          onClick={() => setSharePopup(!sharePopup)}
          className="bg-red text-white font-display text-xs md:text-sm font-bold px-2 md:px-4 py-1.5 rounded-lg border-2 border-off-black btn-pressed shrink-0"
        >
          {copied ? '✓' : 'Share'}
        </button>

        {sharePopup && !copied && (
          <div className="absolute bottom-full right-0 mb-2 bg-cream border-2 border-off-black rounded-xl p-2 w-48 z-50">
            <button
              onClick={() => handleShare('filters')}
              className="w-full text-left text-xs font-display px-2 py-1.5 rounded hover:bg-red-light transition-colors"
            >
              Share search results
            </button>
            <button
              onClick={() => handleShare('shortlist')}
              className="w-full text-left text-xs font-display px-2 py-1.5 rounded hover:bg-red-light transition-colors"
            >
              Share my shortlist
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
