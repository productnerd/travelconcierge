import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useSocialStore } from '@/store/socialStore'
import ProfilePanel from '@/components/Social/ProfilePanel'

export default function AuthButton() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const loading = useAuthStore((s) => s.loading)
  const signIn = useAuthStore((s) => s.signInWithMagicLink)
  const pendingCount = useSocialStore((s) => s.pendingRequests.length)
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Listen for open-auth event from SignupNudge / friend link
  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener('open-auth', handler)
    return () => window.removeEventListener('open-auth', handler)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error: err } = await signIn(email)
    if (err) setError(err)
    else setSent(true)
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => {
            if (user) { setProfileOpen(true) }
            else { setOpen(!open); setSent(false); setError(null) }
          }}
          className={`
            relative flex items-center justify-center w-8 h-8 text-sm rounded-lg border-2 border-off-black transition-colors
            ${user ? '' : 'bg-cream text-off-black hover:bg-off-black/10'}
          `}
          style={user && profile ? { backgroundColor: profile.avatar_color, color: '#fff' } : undefined}
        >
          {user && profile ? profile.avatar_emoji : '👤'}
          {/* Pending request badge */}
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red rounded-full text-[8px] text-white flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Logged-out dropdown: magic link form */}
        {open && !user && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-cream border-2 border-off-black rounded-lg shadow-lg z-50 p-4">
            <p className="text-xs font-display font-bold uppercase mb-2">Sign in</p>
            <p className="text-[11px] text-off-black/60 mb-3">
              Save your destinations to the cloud and connect with friends.
            </p>
            {sent ? (
              <div className="text-xs text-green font-display font-bold text-center py-4">
                ✓ Check your email for the magic link!
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-body border-2 border-off-black rounded-lg bg-white focus:outline-none focus:border-red mb-2"
                />
                {error && <p className="text-[10px] text-red mb-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-3 py-2 text-[10px] font-display font-bold uppercase rounded-lg border-2 border-off-black bg-off-black text-cream hover:bg-off-black/80 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Profile panel (modal) for logged-in users */}
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
