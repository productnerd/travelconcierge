import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { TravelProfile } from '@/types'

export interface Friend {
  friendshipId: string
  userId: string
  displayName: string
  avatarEmoji: string
  avatarColor: string
}

export interface PendingRequest {
  friendshipId: string
  requesterProfile: TravelProfile
}

export interface FriendData {
  shortlistedSlugs: string[]
  visitedSlugs: string[]
}

type ViewMode = 'default' | 'ourHearts' | 'ourVisits'

interface SocialState {
  friends: Friend[]
  pendingRequests: PendingRequest[]
  enabledFriendIds: string[]
  friendData: Record<string, FriendData>
  viewMode: ViewMode

  loadFriends: () => Promise<void>
  loadPendingRequests: () => Promise<void>
  toggleFriend: (userId: string) => void
  loadFriendData: (userId: string) => Promise<void>
  setViewMode: (mode: ViewMode) => void
  sendFriendRequest: (friendCode: string) => Promise<{ error: string | null }>
  acceptRequest: (friendshipId: string) => Promise<void>
  declineRequest: (friendshipId: string) => Promise<void>
  removeFriend: (friendshipId: string) => Promise<void>
  reset: () => void
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  enabledFriendIds: [],
  friendData: {},
  viewMode: 'default',

  loadFriends: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const { data } = await supabase
      .from('travel_friendships')
      .select('id, requester_id, addressee_id, status')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    if (!data || data.length === 0) { set({ friends: [] }); return }

    // Get friend user IDs
    const friendUserIds = data.map((f) =>
      f.requester_id === user.id ? f.addressee_id : f.requester_id
    )

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('travel_profiles')
      .select('*')
      .in('user_id', friendUserIds)

    const friends: Friend[] = (data ?? []).map((f) => {
      const friendUserId = f.requester_id === user.id ? f.addressee_id : f.requester_id
      const profile = profiles?.find((p) => p.user_id === friendUserId)
      return {
        friendshipId: f.id,
        userId: friendUserId,
        displayName: profile?.display_name ?? 'Friend',
        avatarEmoji: profile?.avatar_emoji ?? '🌍',
        avatarColor: profile?.avatar_color ?? '#D93B2B',
      }
    })

    set({ friends })
  },

  loadPendingRequests: async () => {
    const user = useAuthStore.getState().user
    if (!user) return

    const { data } = await supabase
      .from('travel_friendships')
      .select('id, requester_id')
      .eq('addressee_id', user.id)
      .eq('status', 'pending')

    if (!data || data.length === 0) { set({ pendingRequests: [] }); return }

    const requesterIds = data.map((r) => r.requester_id)
    const { data: profiles } = await supabase
      .from('travel_profiles')
      .select('*')
      .in('user_id', requesterIds)

    const pendingRequests: PendingRequest[] = data.map((r) => ({
      friendshipId: r.id,
      requesterProfile: profiles?.find((p) => p.user_id === r.requester_id) as TravelProfile,
    })).filter((r) => r.requesterProfile)

    set({ pendingRequests })
  },

  toggleFriend: (userId) => {
    const { enabledFriendIds, loadFriendData, friendData } = get()
    const isEnabled = enabledFriendIds.includes(userId)

    if (isEnabled) {
      set({
        enabledFriendIds: enabledFriendIds.filter((id) => id !== userId),
        viewMode: enabledFriendIds.length <= 1 ? 'default' : get().viewMode,
      })
    } else {
      set({ enabledFriendIds: [...enabledFriendIds, userId] })
      if (!friendData[userId]) loadFriendData(userId)
    }
  },

  loadFriendData: async (userId) => {
    const { data } = await supabase
      .from('travel_user_regions')
      .select('region_slug, list_type')
      .eq('user_id', userId)

    if (data) {
      set((s) => ({
        friendData: {
          ...s.friendData,
          [userId]: {
            shortlistedSlugs: data.filter((r) => r.list_type === 'shortlist').map((r) => r.region_slug),
            visitedSlugs: data.filter((r) => r.list_type === 'visited').map((r) => r.region_slug),
          },
        },
      }))
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  sendFriendRequest: async (friendCode) => {
    const user = useAuthStore.getState().user
    if (!user) return { error: 'Not logged in' }

    // Look up the friend code
    const { data: profile } = await supabase
      .from('travel_profiles')
      .select('user_id')
      .eq('friend_code', friendCode)
      .single()

    if (!profile) return { error: 'Friend code not found' }
    if (profile.user_id === user.id) return { error: 'That\'s your own code!' }

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from('travel_friendships')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profile.user_id}),and(requester_id.eq.${profile.user_id},addressee_id.eq.${user.id})`)

    if (existing && existing.length > 0) {
      const f = existing[0]
      if (f.status === 'accepted') return { error: 'Already friends!' }
      if (f.status === 'pending') return { error: 'Request already pending' }
    }

    const { error } = await supabase
      .from('travel_friendships')
      .insert({ requester_id: user.id, addressee_id: profile.user_id })

    return { error: error?.message ?? null }
  },

  acceptRequest: async (friendshipId) => {
    await supabase
      .from('travel_friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    get().loadFriends()
    get().loadPendingRequests()
  },

  declineRequest: async (friendshipId) => {
    await supabase
      .from('travel_friendships')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', friendshipId)
    get().loadPendingRequests()
  },

  removeFriend: async (friendshipId) => {
    await supabase
      .from('travel_friendships')
      .delete()
      .eq('id', friendshipId)

    set((s) => ({
      friends: s.friends.filter((f) => f.friendshipId !== friendshipId),
    }))
  },

  reset: () => set({
    friends: [],
    pendingRequests: [],
    enabledFriendIds: [],
    friendData: {},
    viewMode: 'default',
  }),
}))
