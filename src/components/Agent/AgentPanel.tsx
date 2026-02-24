import { useEffect, useRef } from 'react'
import { useUIStore } from '@/store/uiStore'
import type { AgentMessage } from '@/types'

interface Props {
  messages: AgentMessage[]
  loading: boolean
  onAnswer: (label: string) => void
}

export default function AgentPanel({ messages, loading, onAnswer }: Props) {
  const agentPanelOpen = useUIStore((s) => s.agentPanelOpen)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!agentPanelOpen) return null

  return (
    <div className="h-[200px] md:h-[320px] bg-cream border-t-2 border-off-black shrink-0 flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-off-black/30 font-display text-sm mt-8">
            Ask Compass anything about where to travel
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {/* Message bubble */}
            <div
              className={`
                max-w-[85%] px-3 py-2 rounded-xl text-sm
                ${msg.role === 'user'
                  ? 'ml-auto bg-red text-white'
                  : 'mr-auto bg-cream border-2 border-off-black text-off-black'
                }
              `}
            >
              {msg.content}
            </div>

            {/* Tool call indicators */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1 ml-1">
                {msg.toolCalls.map((tc, j) => (
                  <span
                    key={j}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono bg-off-black/5 border border-off-black/20 rounded text-off-black/60"
                  >
                    {tc.name === 'set_filters' && 'Applied filters'}
                    {tc.name === 'highlight_regions' && 'Highlighted regions'}
                    {tc.name === 'open_region_detail' && 'Opened detail'}
                    {tc.name === 'query_regions' && 'Searched regions'}
                    {tc.name === 'ask_decision_question' && 'Asked question'}
                  </span>
                ))}
              </div>
            )}

            {/* Decision question UI */}
            {msg.decisionQuestion && (
              <div className="mt-2 bg-cream border-2 border-off-black rounded-xl p-3 mr-auto max-w-[85%]">
                <p className="text-sm font-display font-bold mb-2">{msg.decisionQuestion.question}</p>
                <div className="flex flex-wrap gap-1">
                  {msg.decisionQuestion.options.map((opt, k) => (
                    <button
                      key={k}
                      onClick={() => onAnswer(opt.label)}
                      className="px-3 py-1.5 text-xs font-display font-bold bg-cream border-2 border-off-black rounded-lg hover:bg-red hover:text-white transition-colors btn-pressed"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="mr-auto bg-cream border-2 border-off-black rounded-xl px-3 py-2 text-sm text-off-black/40">
            Thinking...
          </div>
        )}
      </div>
    </div>
  )
}
