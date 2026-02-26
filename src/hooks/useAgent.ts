import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useFilterStore } from '@/store/filterStore'
import { useUIStore } from '@/store/uiStore'
import type { AgentMessage, DecisionQuestion } from '@/types'

interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown>; tool_use_id?: string; content?: string }>
}

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [loading, setLoading] = useState(false)
  const filters = useFilterStore()
  const ui = useUIStore()

  const getCurrentFilters = () => ({
    selectedMonths: filters.selectedMonths,
    busynessMax: filters.busynessMax,
    tempMin: filters.tempMin,
    tempMax: filters.tempMax,
    sunshineMin: filters.sunshineMin,
    rainfallMax: filters.rainfallMax,
    selectedActivities: filters.selectedActivities,
    selectedLandscapes: filters.selectedLandscapes,
  })

  const sendMessage = useCallback(async (userText: string) => {
    const userMsg: AgentMessage = { role: 'user', content: userText }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      // Build Anthropic message history
      const anthropicMessages: AnthropicMessage[] = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        { role: 'user' as const, content: userText },
      ]

      const currentFilters = getCurrentFilters()

      // Call edge function
      const { data, error } = await supabase.functions.invoke('travel-compass', {
        body: { messages: anthropicMessages, currentFilters },
      })

      if (error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}` },
        ])
        setLoading(false)
        return
      }

      // Process response - handle tool use loop
      await processResponse(data, anthropicMessages)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong. Please try again.` },
      ])
    } finally {
      setLoading(false)
    }
  }, [messages, filters])

  const processResponse = async (response: Record<string, unknown>, prevMessages: AnthropicMessage[]) => {
    const content = response.content as Array<{ type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }>
    if (!content) return

    let assistantText = ''
    const toolCalls: AgentMessage['toolCalls'] = []
    let decisionQuestion: DecisionQuestion | undefined

    for (const block of content) {
      if (block.type === 'text' && block.text) {
        assistantText += block.text
      }

      if (block.type === 'tool_use' && block.name && block.input) {
        const toolResult = executeToolLocally(block.name, block.input)
        toolCalls.push({ name: block.name, input: block.input, result: toolResult })

        if (block.name === 'ask_decision_question') {
          decisionQuestion = {
            question: block.input.question as string,
            options: (block.input.options as Array<{ label: string; eliminates?: string[] }>),
          }
        }
      }
    }

    const assistantMsg: AgentMessage = {
      role: 'assistant',
      content: assistantText,
      toolCalls,
      decisionQuestion,
    }
    setMessages((prev) => [...prev, assistantMsg])

    // If there were tool_use blocks and stop_reason is tool_use, continue the loop
    if (response.stop_reason === 'tool_use' && toolCalls.length > 0) {
      const toolResultMessages: AnthropicMessage[] = [
        ...prevMessages,
        { role: 'assistant' as const, content: content },
        ...toolCalls.map((tc) => ({
          role: 'user' as const,
          content: [{
            type: 'tool_result',
            tool_use_id: content.find((b) => b.type === 'tool_use' && b.name === tc.name)?.id || '',
            content: JSON.stringify(tc.result),
          }],
        })),
      ]

      const { data, error } = await supabase.functions.invoke('travel-compass', {
        body: {
          messages: toolResultMessages,
          currentFilters: getCurrentFilters(),
        },
      })

      if (data && !error) {
        await processResponse(data, toolResultMessages)
      }
    }
  }

  const executeToolLocally = (name: string, input: Record<string, unknown>): unknown => {
    switch (name) {
      case 'set_filters': {
        const filterUpdate: Record<string, unknown> = {}
        if (input.months) filterUpdate.selectedMonths = input.months
        if (input.busyness_max) filterUpdate.busynessMax = input.busyness_max
        if (input.temp_min_c !== undefined) filterUpdate.tempMin = input.temp_min_c
        if (input.temp_max_c !== undefined) filterUpdate.tempMax = input.temp_max_c
        if (input.sunshine_min_hours !== undefined) filterUpdate.sunshineMin = input.sunshine_min_hours
        if (input.rainfall_max_mm !== undefined) filterUpdate.rainfallMax = input.rainfall_max_mm
        if (input.activities) filterUpdate.selectedActivities = input.activities
        if (input.landscape_types) filterUpdate.selectedLandscapes = input.landscape_types
        filters.setFilters(filterUpdate, true)
        return { success: true, applied: Object.keys(filterUpdate) }
      }

      case 'highlight_regions': {
        const slugs = (input.region_slugs as string[]) || []
        const eliminated = (input.eliminated_slugs as string[]) || []
        const reason = (input.reason as string) || ''
        ui.setHighlights(slugs, eliminated, reason)
        if (slugs.length > 0) ui.setDecisionMode(true)
        return { success: true, highlighted: slugs.length, eliminated: eliminated.length }
      }

      case 'open_region_detail': {
        const slug = input.region_slug as string
        if (slug) ui.selectRegion(slug)
        return { success: true, opened: slug }
      }

      case 'ask_decision_question': {
        // This is handled in the UI rendering, no side effect needed
        return { success: true, question_shown: true }
      }

      case 'query_regions':
      case 'get_best_months': {
        // Executed server-side by the edge function
        return { note: 'Executed server-side' }
      }

      default:
        return { error: `Unknown tool: ${name}` }
    }
  }

  const answerDecisionQuestion = useCallback((optionLabel: string) => {
    sendMessage(optionLabel)
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    ui.clearHighlights()
  }, [])

  return {
    messages,
    loading,
    sendMessage,
    answerDecisionQuestion,
    clearMessages,
  }
}
