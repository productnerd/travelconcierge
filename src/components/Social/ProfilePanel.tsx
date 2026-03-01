import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSocialStore } from '@/store/socialStore'

const EMOJI_OPTIONS = ['🌍', '✈️', '🏔️', '🌴', '🏖️', '🧭', '🗺️', '⛵', '🎒', '🦊', '🐬', '🌺']
const COLOR_OPTIONS = ['#D93B2B', '#3B7A4A', '#2563EB', '#F5C842', '#8B5CF6', '#EC4899']

interface ProfilePanelProps {
  open: boolean
  onClose: () => void
}

export default function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const signOut = useAuthStore((s) => s.signOut)
  const friends = useSocialStore((s) => s.friends)
  const pendingRequests = useSocialStore((s) => s.pendingRequests)
  const sendFriendRequest = useSocialStore((s) => s.sendFriendRequest)
  const acceptRequest = useSocialStore((s) => s.acceptRequest)
  const declineRequest = useSocialStore((s) => s.declineRequest)
  const removeFriend = useSocialStore((s) => s.removeFriend)

  const [friendCode, setFriendCode] = useState('')
  const [friendError, setFriendError] = useState<string | null>(null)
  const [friendSuccess, setFriendSuccess] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile?.display_name ?? '')
  const [copied, setCopied] = useState(false)

  if (!open || !user || !profile) return null

  const friendLink = `${window.location.origin}${import.meta.env.BASE_URL || '/'}?friend=${profile.friend_code}`

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(friendLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendRequest = async () => {
    setFriendError(null)
    setFriendSuccess(false)
    const { error } = await sendFriendRequest(friendCode.trim())
    if (error) setFriendError(error)
    else { setFriendSuccess(true); setFriendCode('') }
  }

  const handleSaveName = () => {
    updateProfile({ display_name: nameInput })
    setEditingName(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-off-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-cream border-2 border-off-black rounded-lg shadow-lg w-[90vw] max-w-md max-h-[80vh] overflow-y-auto p-5">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-3 right-3 text-off-black/40 hover:text-off-black text-lg">
          ✕
        </button>

        <h2 className="text-sm font-display font-bold uppercase mb-4">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 border-off-black"
            style={{ backgroundColor: profile.avatar_color }}
          >
            {profile.avatar_emoji}
          </span>
          <div>
            {editingName ? (
              <div className="flex items-center gap-1">
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-2 py-1 text-xs font-body border-2 border-off-black rounded bg-white w-32"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                />
                <button onClick={handleSaveName} className="text-[10px] font-display font-bold text-green">✓</button>
              </div>
            ) : (
              <button onClick={() => { setNameInput(profile.display_name); setEditingName(true) }} className="text-xs font-display font-bold hover:text-red transition-colors">
                {profile.display_name || 'Set name'} ✎
              </button>
            )}
            <p className="text-[10px] text-off-black/50">{user.email}</p>
          </div>
        </div>

        {/* Emoji picker */}
        <div className="mb-3">
          <p className="text-[10px] font-display font-bold uppercase mb-1 text-off-black/60">Avatar</p>
          <div className="flex flex-wrap gap-1">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => updateProfile({ avatar_emoji: e })}
                className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border-2 transition-colors
                  ${profile.avatar_emoji === e ? 'border-off-black bg-off-black/10' : 'border-transparent hover:border-off-black/30'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
        <div className="mb-4">
          <p className="text-[10px] font-display font-bold uppercase mb-1 text-off-black/60">Color</p>
          <div className="flex gap-1">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                onClick={() => updateProfile({ avatar_color: c })}
                className={`w-7 h-7 rounded-full border-2 transition-all
                  ${profile.avatar_color === c ? 'border-off-black scale-110' : 'border-transparent hover:border-off-black/30'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-off-black/15 mb-4" />

        {/* Friend Link */}
        <div className="mb-4">
          <p className="text-[10px] font-display font-bold uppercase mb-1 text-off-black/60">Invite a friend</p>
          <div className="flex gap-2">
            <div className="flex-1 px-2 py-1.5 text-[10px] font-mono bg-white border-2 border-off-black/20 rounded truncate">
              {friendLink}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-[10px] font-display font-bold uppercase rounded border-2 border-off-black bg-off-black text-cream hover:bg-off-black/80 transition-colors shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Add friend by code */}
        <div className="mb-4">
          <p className="text-[10px] font-display font-bold uppercase mb-1 text-off-black/60">Add friend by code</p>
          <div className="flex gap-2">
            <input
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value)}
              placeholder="Paste friend code"
              className="flex-1 px-2 py-1.5 text-[10px] font-mono border-2 border-off-black/20 rounded bg-white"
            />
            <button
              onClick={handleSendRequest}
              disabled={!friendCode.trim()}
              className="px-3 py-1.5 text-[10px] font-display font-bold uppercase rounded border-2 border-off-black bg-off-black text-cream hover:bg-off-black/80 disabled:opacity-30 transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {friendError && <p className="text-[10px] text-red mt-1">{friendError}</p>}
          {friendSuccess && <p className="text-[10px] text-green mt-1">Friend request sent!</p>}
        </div>

        {/* Pending requests */}
        {pendingRequests.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-display font-bold uppercase mb-2 text-off-black/60">Pending Requests</p>
            {pendingRequests.map((req) => (
              <div key={req.friendshipId} className="flex items-center gap-2 mb-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-off-black/20"
                  style={{ backgroundColor: req.requesterProfile.avatar_color }}
                >
                  {req.requesterProfile.avatar_emoji}
                </span>
                <span className="text-xs font-display flex-1">{req.requesterProfile.display_name}</span>
                <button
                  onClick={() => acceptRequest(req.friendshipId)}
                  className="px-2 py-0.5 text-[10px] font-display font-bold rounded border-2 border-green bg-green text-white"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineRequest(req.friendshipId)}
                  className="px-2 py-0.5 text-[10px] font-display font-bold rounded border-2 border-off-black/30 text-off-black/50 hover:text-off-black"
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Friends list */}
        {friends.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-display font-bold uppercase mb-2 text-off-black/60">Friends ({friends.length})</p>
            {friends.map((friend) => (
              <div key={friend.friendshipId} className="flex items-center gap-2 mb-2">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-off-black/20"
                  style={{ backgroundColor: friend.avatarColor }}
                >
                  {friend.avatarEmoji}
                </span>
                <span className="text-xs font-display flex-1">{friend.displayName}</span>
                <button
                  onClick={() => removeFriend(friend.friendshipId)}
                  className="text-[10px] text-off-black/30 hover:text-red transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="w-full h-px bg-off-black/15 mb-4" />

        <button
          onClick={async () => { await signOut(); onClose() }}
          className="w-full px-3 py-2 text-[10px] font-display font-bold uppercase rounded-lg border-2 border-off-black bg-cream text-off-black hover:bg-off-black/10 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
