import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'

const STORAGE_KEY = 'travel_visited'
const LIST_TYPE = 'visited'

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
  syncFromSupabase: () => Promise<void>
  migrateToSupabase: () => Promise<void>
}

export const useVisitedStore = create<VisitedState>((set, get) => ({
  visitedSlugs: loadFromStorage(),

  toggle: (slug) =>
    set((s) => {
      const removing = s.visitedSlugs.includes(slug)
      const next = removing
        ? s.visitedSlugs.filter((v) => v !== slug)
        : [...s.visitedSlugs, slug]
      saveToStorage(next)

      // Sync to Supabase if logged in
      const user = useAuthStore.getState().user
      if (user) {
        if (removing) {
          supabase.from('travel_user_regions')
            .delete()
            .eq('user_id', user.id)
            .eq('region_slug', slug)
            .eq('list_type', LIST_TYPE)
            .then(() => {})
        } else {
          supabase.from('travel_user_regions')
            .insert({ user_id: user.id, region_slug: slug, list_type: LIST_TYPE })
            .then(() => {})
        }
      }

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

  syncFromSupabase: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    const { data } = await supabase
      .from('travel_user_regions')
      .select('region_slug')
      .eq('user_id', user.id)
      .eq('list_type', LIST_TYPE)
    if (data) {
      const slugs = data.map((r) => r.region_slug)
      saveToStorage(slugs)
      set({ visitedSlugs: slugs })
    }
  },

  migrateToSupabase: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    const localSlugs = get().visitedSlugs

    // Fetch existing server data
    const { data: serverRows } = await supabase
      .from('travel_user_regions')
      .select('region_slug')
      .eq('user_id', user.id)
      .eq('list_type', LIST_TYPE)
    const serverSlugs = (serverRows ?? []).map((r) => r.region_slug)

    // Merge: union of local + server
    const merged = [...new Set([...localSlugs, ...serverSlugs])]

    // Insert any local-only slugs to server
    const toInsert = localSlugs.filter((s) => !serverSlugs.includes(s))
    if (toInsert.length > 0) {
      await supabase.from('travel_user_regions').insert(
        toInsert.map((slug) => ({ user_id: user.id, region_slug: slug, list_type: LIST_TYPE }))
      )
    }

    // Update local state with merged set
    saveToStorage(merged)
    set({ visitedSlugs: merged })
  },
}))
