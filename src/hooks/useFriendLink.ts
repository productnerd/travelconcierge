import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSocialStore } from '@/store/socialStore'

/**
 * Detects `?friend=<code>` URL parameter and sends a friend request.
 * If user is not logged in, stores the code and processes it after login.
 */
export function useFriendLink() {
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const sendFriendRequest = useSocialStore((s) => s.sendFriendRequest)
  const processed = useRef(false)

  useEffect(() => {
    if (!initialized || processed.current) return

    const params = new URLSearchParams(window.location.search)
    const friendCode = params.get('friend')
    if (!friendCode) return

    // Clean the URL
    const url = new URL(window.location.href)
    url.searchParams.delete('friend')
    window.history.replaceState({}, '', url.pathname + url.search)

    if (!user) {
      // Store for later — when they log in, we'll process it
      sessionStorage.setItem('pending_friend_code', friendCode)
      // Open auth dropdown
      window.dispatchEvent(new CustomEvent('open-auth'))
      return
    }

    processed.current = true
    sendFriendRequest(friendCode)
  }, [initialized, user, sendFriendRequest])

  // Process stored friend code after login
  useEffect(() => {
    if (!user) return
    const pendingCode = sessionStorage.getItem('pending_friend_code')
    if (pendingCode && !processed.current) {
      processed.current = true
      sessionStorage.removeItem('pending_friend_code')
      sendFriendRequest(pendingCode)
    }
  }, [user, sendFriendRequest])
}
