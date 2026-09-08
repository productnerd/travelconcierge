import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { reportError } from './errorStore'

const STORAGE_KEY = 'travel_notes'

type Notes = Record<string, string>

function loadFromStorage(): Notes {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(notes: Notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
}

interface NotesState {
  notes: Notes
  setNote: (slug: string, note: string) => void
  migrateToSupabase: () => Promise<void>
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: loadFromStorage(),

  setNote: (slug, note) => {
    const trimmed = note.trim()
    const next = { ...get().notes }
    if (trimmed) next[slug] = trimmed
    else delete next[slug]
    saveToStorage(next)
    set({ notes: next })

    const user = useAuthStore.getState().user
    if (!user) return

    if (trimmed) {
      supabase.from('travel_region_notes')
        .upsert(
          { user_id: user.id, region_slug: slug, note: trimmed, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,region_slug' }
        )
        .then(({ error }) => { reportError('Saving your note', error) })
    } else {
      supabase.from('travel_region_notes')
        .delete()
        .eq('user_id', user.id)
        .eq('region_slug', slug)
        .then(({ error }) => { reportError('Saving your note', error) })
    }
  },

  migrateToSupabase: async () => {
    const user = useAuthStore.getState().user
    if (!user) return
    const localNotes = get().notes
    const migratedKey = `${STORAGE_KEY}_merged_${user.id}`
    const alreadyMerged = localStorage.getItem(migratedKey) === '1'

    const { data: serverRows, error } = await supabase
      .from('travel_region_notes')
      .select('region_slug, note')
      .eq('user_id', user.id)
    if (reportError('Loading your notes', error)) return

    const serverNotes: Notes = {}
    for (const row of serverRows ?? []) serverNotes[row.region_slug] = row.note

    if (alreadyMerged) {
      // Server is the source of truth once this browser has pushed its notes up.
      saveToStorage(serverNotes)
      set({ notes: serverNotes })
      return
    }

    // First sign-in on this browser: keep notes written while signed out.
    // A note already on the server wins, since it may have been edited elsewhere.
    const toInsert = Object.entries(localNotes).filter(([slug]) => !(slug in serverNotes))
    if (toInsert.length > 0) {
      const { error: insertError } = await supabase.from('travel_region_notes').insert(
        toInsert.map(([slug, note]) => ({ user_id: user.id, region_slug: slug, note }))
      )
      if (reportError('Saving your notes', insertError)) return
    }

    const merged = { ...localNotes, ...serverNotes }
    localStorage.setItem(migratedKey, '1')
    saveToStorage(merged)
    set({ notes: merged })
  },
}))
