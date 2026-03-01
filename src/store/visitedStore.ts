import { create } from 'zustand'

const STORAGE_KEY = 'travel_visited'

function loadFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveToStorage(slugs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
}

interface VisitedState {
  visitedSlugs: string[]
  toggle: (slug: string) => void
  isVisited: (slug: string) => boolean
  setAll: (slugs: string[]) => void
  clear: () => void
}

export const useVisitedStore = create<VisitedState>((set, get) => ({
  visitedSlugs: loadFromStorage(),

  toggle: (slug) =>
    set((s) => {
      const next = s.visitedSlugs.includes(slug)
        ? s.visitedSlugs.filter((v) => v !== slug)
        : [...s.visitedSlugs, slug]
      saveToStorage(next)
      return { visitedSlugs: next }
    }),

  isVisited: (slug) => get().visitedSlugs.includes(slug),

  setAll: (slugs) => {
    saveToStorage(slugs)
    set({ visitedSlugs: slugs })
  },

  clear: () => {
    saveToStorage([])
    set({ visitedSlugs: [] })
  },
}))
