import { useAuthStore } from '@/store/authStore'
import { useSocialStore } from '@/store/socialStore'

export default function FriendToggles() {
  const user = useAuthStore((s) => s.user)
  const friends = useSocialStore((s) => s.friends)
  const enabledFriendIds = useSocialStore((s) => s.enabledFriendIds)
  const toggleFriend = useSocialStore((s) => s.toggleFriend)
  const viewMode = useSocialStore((s) => s.viewMode)
  const setViewMode = useSocialStore((s) => s.setViewMode)

  if (!user || friends.length === 0) return null

  const hasEnabled = enabledFriendIds.length > 0

  return (
    <div className="flex items-center gap-2 mt-1.5 overflow-x-auto pb-0.5">
      <span className="text-[10px] font-display font-bold uppercase shrink-0 text-off-black/50">Friends:</span>

      {friends.map((f) => {
        const active = enabledFriendIds.includes(f.userId)
        return (
          <button
            key={f.userId}
            onClick={() => toggleFriend(f.userId)}
            className={`
              flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-display font-bold rounded-lg border-2 border-off-black transition-colors uppercase shrink-0
              ${active ? 'bg-off-black text-cream' : 'bg-cream text-off-black hover:bg-off-black/10'}
            `}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
              style={{ backgroundColor: active ? 'transparent' : f.avatarColor }}
            >
              {f.avatarEmoji}
            </span>
            {f.displayName}
          </button>
        )
      })}

      {/* View mode toggles — only when friends are enabled */}
      {hasEnabled && (
        <>
          <div className="w-px h-5 bg-off-black/20 shrink-0" />
          <button
            onClick={() => setViewMode(viewMode === 'ourHearts' ? 'default' : 'ourHearts')}
            className={`
              px-1.5 py-0.5 text-[10px] font-display font-bold rounded-lg border-2 border-off-black transition-colors uppercase shrink-0
              ${viewMode === 'ourHearts' ? 'bg-red text-white' : 'bg-cream text-off-black hover:bg-red-light'}
            `}
          >
            Our ❤️
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'ourVisits' ? 'default' : 'ourVisits')}
            className={`
              px-1.5 py-0.5 text-[10px] font-display font-bold rounded-lg border-2 border-off-black transition-colors uppercase shrink-0
              ${viewMode === 'ourVisits' ? 'bg-green text-white' : 'bg-cream text-off-black hover:bg-green/20'}
            `}
          >
            Our ✓
          </button>
        </>
      )}
    </div>
  )
}
