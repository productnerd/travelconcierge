import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { TravelProfile } from '@/types'

interface AuthState {
  user: User | null
  profile: TravelProfile | null
  loading: boolean
  initialized: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Pick<TravelProfile, 'display_name' | 'avatar_emoji' | 'avatar_color'>>) => Promise<void>
  init: () => () => void
}

async function fetchOrCreateProfile(userId: string, email?: string): Promise<TravelProfile | null> {
  const { data } = await supabase
    .from('travel_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (data) return data as TravelProfile

  // Create new profile
  const displayName = email?.split('@')[0] ?? ''
  const { data: created } = await supabase
    .from('travel_profiles')
    .insert({ user_id: userId, display_name: displayName })
    .select('*')
    .single()

  return (created as TravelProfile) ?? null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: false,
  initialized: false,

  signInWithMagicLink: async (email) => {
    set({ loading: true })
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + (import.meta.env.BASE_URL || '/') },
    })
    set({ loading: false })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  updateProfile: async (updates) => {
    const { profile } = get()
    if (!profile) return
    const { data } = await supabase
      .from('travel_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select('*')
      .single()
    if (data) set({ profile: data as TravelProfile })
  },

  init: () => {
    // Single source of truth: onAuthStateChange handles all auth events
    // including INITIAL_SESSION (page load), SIGNED_IN (magic link redirect),
    // TOKEN_REFRESHED, and SIGNED_OUT.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user.id, session.user.email)
        set({ user: session.user, profile, initialized: true })
      } else {
        set({ user: null, profile: null, initialized: true })
      }
    })

    // Trigger initial session check + URL hash processing for magic link redirects
    supabase.auth.getSession()

    return () => subscription.unsubscribe()
  },
}))
