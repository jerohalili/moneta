'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

/**
 * Nav account control. Signed out → "Sign in" link. Signed in → a click-
 * to-open menu (closes on outside click / Escape) with the account identity,
 * a link back to settings, sign out, and — deliberately separated at the
 * bottom in red — delete account, which wipes the user row and everything
 * cascaded to it (profile, ledger, history, rate overrides).
 */
export default function AccountButton() {
  const { data: session, isPending: pending } = authClient.useSession()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null) // 'signout' | 'delete' | null
  const menuRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

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
    setBusy('signout')
    try {
      await authClient.signOut()
      // A reload re-seeds every localStorage-driven view from signed-out
      // local state without any cross-component messaging.
      router.push('/')
      window.location.reload()
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Delete your account and EVERYTHING saved with it — profile, write-off ledger, history, custom rates?\n\nThis cannot be undone.'
    )
    if (!confirmed) return
    setBusy('delete')
    try {
      await fetch('/api/me/account', { method: 'DELETE' })
      await authClient.signOut().catch(() => {})
      router.push('/')
      window.location.reload()
    } catch {
      setBusy(null)
    }
  }

  return (
    <span className="nav-account" ref={menuRef}>
      <button
        type="button"
        className={open ? 'account-trigger is-open' : 'account-trigger'}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={session.user.isAnonymous ? 'Guest account — syncs until you sign out or clear this browser' : session.user.email}
      >
        <span className="account-trigger-label">{label}</span>
        {session.user.isAnonymous && <span className="nav-guest-badge">guest</span>}
        <span className="account-caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="account-menu" role="menu">
          <div className="account-menu-head">
            <div className="account-menu-name">{label}</div>
            {!session.user.isAnonymous && <div className="account-menu-sub">{session.user.email}</div>}
            {session.user.isAnonymous && (
              <div className="account-menu-sub">Sign in later on this browser to keep this data.</div>
            )}
          </div>
          <Link href="/settings" role="menuitem" className="account-menu-item" onClick={() => setOpen(false)}>
            Rates &amp; Logic
          </Link>
          <button type="button" role="menuitem" className="account-menu-item" onClick={handleSignOut} disabled={busy !== null}>
            {busy === 'signout' ? 'Signing out…' : 'Sign out'}
          </button>
          <button type="button" role="menuitem" className="account-menu-item is-danger" onClick={handleDelete} disabled={busy !== null}>
            {busy === 'delete' ? 'Deleting…' : 'Delete account…'}
          </button>
        </div>
      )}
    </span>
  )
}
