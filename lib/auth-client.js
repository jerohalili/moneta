'use client'

import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'

/**
 * Client-side Better Auth (React bindings). The anonymousClient plugin
 * mirrors the server's guest plugin — it's REQUIRED client-side for
 * authClient.signIn.anonymous() to exist.
 */
export const authClient = createAuthClient({
  plugins: [anonymousClient()],
})

export function authErrorMessage(err) {
  // Better Auth shapes vary: { error: { message, status, statusText } },
  // bare { message }, or a thrown Error. Surface EVERYTHING real before
  // falling back — "try again" with no reason hides fixable problems.
  const e = err?.error ?? err ?? {}
  const parts = []
  if (e.message) parts.push(e.message)
  else if (typeof err === 'string') parts.push(err)
  if (e.status) parts.push(`(HTTP ${e.status}${e.statusText ? ` ${e.statusText}` : ''})`)

  const raw = parts.join(' ')
  if (/invalid credentials/i.test(raw)) return 'Wrong email or password.'
  if (/already.*(registered|exists)|user.*exists/i.test(raw)) return 'That email is already registered — try signing in instead.'

  return raw || 'Something went wrong. Check the dev-server terminal for the full error, then try again.'
}
