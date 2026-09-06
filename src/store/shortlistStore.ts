import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { reportError } from './errorStore'

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
            .then(({ error }) => { reportError('Saving your shortlist', error) })
        } else {
          supabase.from('travel_user_regions')
            .insert({ user_id: user.id, region_slug: slug, list_type: LIST_TYPE })
            .then(({ error }) => { reportError('Saving your shortlist', error) })
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
    const { data, error } = await supabase
      .from('travel_user_regions')
      .select('region_slug')
      .eq('user_id', user.id)
      .eq('list_type', LIST_TYPE)
    if (reportError('Loading your shortlist', error)) return
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
    const migratedKey = `${STORAGE_KEY}_merged_${user.id}`
    const alreadyMerged = localStorage.getItem(migratedKey) === '1'

    // Fetch existing server data
    const { data: serverRows, error } = await supabase
      .from('travel_user_regions')
      .select('region_slug')
      .eq('user_id', user.id)
      .eq('list_type', LIST_TYPE)
    if (reportError('Loading your shortlist', error)) return
    const serverSlugs = (serverRows ?? []).map((r) => r.region_slug)

    if (alreadyMerged) {
      // Server is the source of truth — this browser already pushed its local data up,
      // so anything missing server-side was removed on another device.
      saveToStorage(serverSlugs)
      set({ shortlistedSlugs: serverSlugs })
      return
    }

    // First sign-in on this browser: don't lose anything hearted while signed out.
    const toInsert = localSlugs.filter((s) => !serverSlugs.includes(s))
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('travel_user_regions').insert(
        toInsert.map((slug) => ({ user_id: user.id, region_slug: slug, list_type: LIST_TYPE }))
      )
      if (reportError('Saving your shortlist', insertError)) return
    }

    const merged = [...new Set([...localSlugs, ...serverSlugs])]
    localStorage.setItem(migratedKey, '1')
    saveToStorage(merged)
    set({ shortlistedSlugs: merged })
  },
}))
