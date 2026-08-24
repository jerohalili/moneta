'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authClient, authErrorMessage } from '@/lib/auth-client'
import { SYNC_EVENTS } from '@/lib/cloudSync'

/**
 * Three ways in:
 *  - Continue with Google (button shows an honest error if the deployment
 *    hasn't configured Google credentials)
 *  - Email + password (sign in / create account toggle)
 *  - Continue as guest → Better Auth's anonymous plugin creates a real
 *    user row instantly; signing in later links it, keeping all synced data.
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
    <section className="card glow-card" style={{ maxWidth: 480 }}>
      <h2>Sign in</h2>
      <p className="empty-copy" style={{ marginBottom: 18 }}>
        Sign in to sync your income profile, write-off ledger, saved history, and custom rates across devices.
        Everything also works without an account — this only adds cross-device sync.
      </p>

      {error && (
        <div className="error-flags">
          <div className="error-flag">
            <span className="error-flag-icon" aria-hidden="true">⚠</span>
            {error}
          </div>
        </div>
      )}

      <button type="button" className="btn-primary" style={{ width: '100%', marginBottom: 18 }} onClick={handleGoogle} disabled={busy !== null}>
        {busy === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </button>

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

      <p className="disclaimer" style={{ marginTop: 18 }}>
        Or skip accounts entirely:{' '}
        <button type="button" className="linklike" onClick={handleGuest} disabled={busy !== null}>
          {busy === 'guest' ? 'Creating…' : 'continue as a guest'}
        </button>{' '}
        — you get full sync right away, and if you later sign in with Google or email on this same browser,
        your guest data carries over automatically.
      </p>
    </section>
  )
}
