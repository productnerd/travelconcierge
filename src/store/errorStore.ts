import { create } from 'zustand'

export interface AppError {
  id: number
  context: string
  message: string
}

interface ErrorState {
  errors: AppError[]
  report: (context: string, message: string) => void
  dismiss: (id: number) => void
}

let nextId = 0

export const useErrorStore = create<ErrorState>((set, get) => ({
  errors: [],

  report: (context, message) => {
    console.error(`[${context}] ${message}`)
    // Don't stack duplicates of the same failure
    if (get().errors.some((e) => e.context === context && e.message === message)) return
    set((s) => ({ errors: [...s.errors, { id: ++nextId, context, message }] }))
  },

  dismiss: (id) => set((s) => ({ errors: s.errors.filter((e) => e.id !== id) })),
}))

/** Report a Supabase/PostgrestError-shaped failure. Returns true if there was one. */
export function reportError(context: string, error: { message: string } | null | undefined): boolean {
  if (!error) return false
  useErrorStore.getState().report(context, error.message)
  return true
}
