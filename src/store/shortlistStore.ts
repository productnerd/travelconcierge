import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'

const STORAGE_KEY = 'travel_shortlist'
const LIST_TYPE = 'shortlist'

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
  syncFromSupabase: () => Promise<void>
  migrateToSupabase: () => Promise<void>
}

export const useShortlistStore = create<ShortlistState>((set, get) => ({
  shortlistedSlugs: loadFromStorage(),

  toggle: (slug) =>
    set((s) => {
      const removing = s.shortlistedSlugs.includes(slug)
      const next = removing
        ? s.shortlistedSlugs.filter((x) => x !== slug)
        : [...s.shortlistedSlugs, slug]
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
      set({ shortlistedSlugs: slugs })
    }
  },

  migrateToSupabase: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    const localSlugs = get().shortlistedSlugs

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
    set({ shortlistedSlugs: merged })
  },
}))
