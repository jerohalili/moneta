'use client'

import { createAuthClient } from 'better-auth/react'
import { anonymousClient } from 'better-auth/client/plugins'

// Better Auth client. anonymousClient mirrors server guest plugin for signIn.anonymous().
export const authClient = createAuthClient({
  plugins: [anonymousClient()],
})

export function authErrorMessage(err) {
  // Auth errors vary in shape — surface the real message + status first.
  const e = err?.error ?? err ?? {}
  const parts = []
  if (e.message) parts.push(e.message)
  else if (typeof err === 'string') parts.push(err)
  if (e.status) parts.push(`(HTTP ${e.status}${e.statusText ? ` ${e.statusText}` : ''})`)

  const raw = parts.join(' ')
  if (/invalid credentials/i.test(raw)) return 'Wrong email or password.'
  if (/already.*(registered|exists)|user.*exists/i.test(raw)) return 'That email is already registered — try signing in instead.'

  return raw || 'Sign-in failed with no details from the server. Check the dev terminal, then try again.'
}
