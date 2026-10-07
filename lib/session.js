import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'

/**
 * Session guard for /api/me/* routes. Returns { session } or a ready-made
 * 401 response — callers do `if (!session) return unauthorized()` so every
 * sync endpoint fails closed: no cookie, no data, ever.
 *
 * `unauthorized` is always a function (even when a session exists) so
 * checkJs call sites don't need null-narrowing.
 * @returns {Promise<{ session: import('better-auth').Session | null, unauthorized: () => Response }>}
 */
export async function getSessionOrUnauthorized() {
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: await headers() })
  const unauthorized = () => NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
  if (!session) {
    return { session: null, unauthorized }
  }
  return { session, unauthorized }
}
