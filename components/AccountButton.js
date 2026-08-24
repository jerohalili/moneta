'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

/**
 * Nav-right account control. Three states:
 *  - loading  → invisible spacer (no layout flash)
 *  - signed out → plain "Sign in" link
 *  - signed in → name (or "Guest"), guest badge, sign-out button
 */
export default function AccountButton() {
  const { data: session, pending } = authClient.useSession()
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  if (pending) return <span className="nav-account-spacer" aria-hidden="true" />

  if (!session?.user) {
    return (
      <Link href="/login" className="nav-link">
        Sign in
      </Link>
    )
  }

  const label = session.user.isAnonymous ? 'Guest' : session.user.name || session.user.email

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await authClient.signOut()
      // A reload re-seeds every localStorage-driven view from the (now
      // signed-out) local state without any cross-component messaging.
      router.push('/')
      window.location.reload()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <span className="nav-account">
      <Link href="/login" className="nav-account-name" title={session.user.isAnonymous ? 'Guest account — data syncs until you sign out' : session.user.email}>
        {label}
        {session.user.isAnonymous && <span className="nav-guest-badge">guest</span>}
      </Link>
      <button type="button" className="nav-signout" onClick={handleSignOut} disabled={signingOut}>
        {signingOut ? '…' : 'Sign out'}
      </button>
    </span>
  )
}
