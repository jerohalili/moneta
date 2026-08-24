'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient, authErrorMessage } from '@/lib/auth-client'
import { SYNC_EVENTS } from '@/lib/cloudSync'

/**
 * The welcome screen. Moneta requires an identity so profiles, ledgers,
 * history, and custom rates live per-user and sync across devices — but
 * "identity" includes a one-tap guest: no email, no password, full
 * functionality, and it links into a real account later if the guest ever
 * signs in on the same browser.
 */
export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(null) // 'google' | 'email' | 'guest' | null

  function done() {
    setTimeout(() => {
      router.push(searchParams.get('next') || '/')
      router.refresh()
    }, 50)
  }

  async function handleGoogle() {
    setError(null)
    setBusy('google')
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: searchParams.get('next') || '/',
      })
      if (result.error) {
        setError(
          result.error.status === 400
            ? 'Google sign-in isn’t configured on this deployment.'
            : authErrorMessage(result)
        )
        setBusy(null)
      }
      // Success redirects away from this page — no busy reset needed.
    } catch {
      setError('Could not start Google sign-in.')
      setBusy(null)
    }
  }

  async function handleEmail(e) {
    e.preventDefault()
    setError(null)
    setBusy('email')
    try {
      const result =
        mode === 'signup'
          ? await authClient.signUp.email({
              name: name.trim() || email.split('@')[0],
              email,
              password,
            })
          : await authClient.signIn.email({ email, password })

      if (result.error) {
        setError(authErrorMessage(result))
      } else {
        window.dispatchEvent(new Event(SYNC_EVENTS.dataImported))
        done()
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleGuest() {
    setError(null)
    setBusy('guest')
    try {
      const result = await authClient.signIn.anonymous()
      if (result.error) setError(authErrorMessage(result))
      else done()
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="card glow-card">
      <h2>Welcome in</h2>
      <p className="empty-copy" style={{ marginBottom: 18 }}>
        Your income profile, write-off ledger, saved calculations, and custom rates are kept per-account and
        sync across devices. The fastest way in is a guest pass — one tap, everything works.
      </p>

      {error && (
        <div className="error-flags">
          <div className="error-flag">
            <span className="error-flag-icon" aria-hidden="true">⚠</span>
            {error}
          </div>
        </div>
      )}

      <div className="auth-actions">
        <button type="button" className="btn-primary" onClick={handleGoogle} disabled={busy !== null}>
          {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
        </button>
        <button type="button" className="settings-secondary-btn" onClick={handleGuest} disabled={busy !== null}>
          {busy === 'guest' ? 'Creating…' : 'Continue as guest'}
        </button>
      </div>

      <p className="auth-divider">— or with email —</p>

      <form onSubmit={handleEmail}>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, margin: '0 0 12px' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
            <input type="radio" checked={mode === 'signin'} onChange={() => setMode('signin')} />
            I have an account
          </label>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
            <input type="radio" checked={mode === 'signup'} onChange={() => setMode('signup')} />
            Create one
          </label>
        </div>

        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="login-name">Name</label>
            <input id="login-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Juan Dela Cruz" />
          </div>
        )}
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input id="login-password" type="password" required minLength={8} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>
        <button type="submit" className="btn-primary btn-small" disabled={busy !== null} style={{ width: '100%' }}>
          {busy === 'email' ? 'One moment…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="disclaimer">
        Guests get a real account instantly — and if you later sign in with Google or email on this same
        browser, everything you saved as a guest carries over automatically.
      </p>
    </section>
  )
}
