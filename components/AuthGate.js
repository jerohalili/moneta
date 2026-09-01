'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const PUBLIC_PATHS = ['/login']

/**
 * The front door. Every route except /login requires SOME identity — a
 * real account or a one-tap guest — because profiles, ledgers, history,
 * and custom rates are per-user server records now. Signed-out visitors
 * see only the welcome screen; the APIs were already failing closed, so
 * this aligns the UI with what the server enforced all along.
 */
export default function AuthGate({ children }) {
  const { data: session, pending } = authClient.useSession()
  const pathname = usePathname()
  const router = useRouter()

  const isPublic = PUBLIC_PATHS.includes(pathname ?? '')
  const hasUser = Boolean(session?.user)

  useEffect(() => {
    if (pending) return
    if (!hasUser && !isPublic) router.replace('/login')
    if (hasUser && isPublic) router.replace('/')
  }, [pending, hasUser, isPublic, router])

  // While the session resolves, or while redirecting, show a quiet splash
  // instead of flashing app content for logged-out eyes.
  // Also show when a logged-in user hits /login (hasUser && isPublic) so
  // they don't see the login form flash before being redirected home.
  if (pending || (!hasUser && !isPublic) || (hasUser && isPublic)) {
    return (
      <div className="auth-splash" role="status">
        <span className="auth-splash-mark">Moneta</span>
        <span className="auth-splash-note">Opening your ledger…</span>
      </div>
    )
  }

  return children
}
