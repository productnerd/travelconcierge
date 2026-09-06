import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { reportError } from './errorStore'

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
            .then(({ error }) => { reportError('Saving your visited', error) })
        } else {
          supabase.from('travel_user_regions')
            .insert({ user_id: user.id, region_slug: slug, list_type: LIST_TYPE })
            .then(({ error }) => { reportError('Saving your visited', error) })
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
    const { data, error } = await supabase
      .from('travel_user_regions')
      .select('region_slug')
      .eq('user_id', user.id)
      .eq('list_type', LIST_TYPE)
    if (reportError('Loading your visited', error)) return
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
    const migratedKey = `${STORAGE_KEY}_merged_${user.id}`
    const alreadyMerged = localStorage.getItem(migratedKey) === '1'

    // Fetch existing server data
    const { data: serverRows, error } = await supabase
      .from('travel_user_regions')
      .select('region_slug')
      .eq('user_id', user.id)
      .eq('list_type', LIST_TYPE)
    if (reportError('Loading your visited', error)) return
    const serverSlugs = (serverRows ?? []).map((r) => r.region_slug)

    if (alreadyMerged) {
      // Server is the source of truth — this browser already pushed its local data up,
      // so anything missing server-side was removed on another device.
      saveToStorage(serverSlugs)
      set({ visitedSlugs: serverSlugs })
      return
    }

    // First sign-in on this browser: don't lose anything hearted while signed out.
    const toInsert = localSlugs.filter((s) => !serverSlugs.includes(s))
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('travel_user_regions').insert(
        toInsert.map((slug) => ({ user_id: user.id, region_slug: slug, list_type: LIST_TYPE }))
      )
      if (reportError('Saving your visited', insertError)) return
    }

    const merged = [...new Set([...localSlugs, ...serverSlugs])]
    localStorage.setItem(migratedKey, '1')
    saveToStorage(merged)
    set({ visitedSlugs: merged })
  },
}))
