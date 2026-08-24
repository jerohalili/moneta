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
  const message = err?.error?.message ?? err?.message
  if (!message) return 'Something went wrong. Please try again.'
  if (/invalid credentials/i.test(message)) return 'Wrong email or password.'
  if (/already.*(registered|exists)/i.test(message)) return 'That email is already registered — try signing in instead.'
  return message
}
