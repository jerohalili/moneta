import { getAuth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

/**
 * Catch-all Better Auth endpoint: /api/auth/sign-in/*, /api/auth/callback/*,
 * etc. Uses toNextJsHandler to properly handle Next.js App Router concerns
 * (cookie setting, URL parsing, redirects) — required for OAuth callbacks.
 */
export const { GET, POST } = toNextJsHandler(getAuth())
