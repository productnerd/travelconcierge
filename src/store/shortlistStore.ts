import { create } from 'zustand'

const STORAGE_KEY = 'travel_shortlist'

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

interface ShortlistState {
  shortlistedSlugs: string[]
  toggle: (slug: string) => void
  isShortlisted: (slug: string) => boolean
  setAll: (slugs: string[]) => void
  clear: () => void
}

export const useShortlistStore = create<ShortlistState>((set, get) => ({
  shortlistedSlugs: loadFromStorage(),

  toggle: (slug) =>
    set((s) => {
      const next = s.shortlistedSlugs.includes(slug)
        ? s.shortlistedSlugs.filter((s) => s !== slug)
        : [...s.shortlistedSlugs, slug]
      saveToStorage(next)
      return { shortlistedSlugs: next }
    }),

  isShortlisted: (slug) => get().shortlistedSlugs.includes(slug),

  setAll: (slugs) => {
    saveToStorage(slugs)
    set({ shortlistedSlugs: slugs })
  },

  clear: () => {
    saveToStorage([])
    set({ shortlistedSlugs: [] })
  },
}))
