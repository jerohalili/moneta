import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'

/**
 * Session guard for /api/me/* routes. Returns { session } or a ready-made
 * 401 response — callers do `if (!session) return unauthorized()` so every
 * sync endpoint fails closed: no cookie, no data, ever.
 */
export async function getSessionOrUnauthorized() {
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return {
      session: null,
      unauthorized: () => NextResponse.json({ error: 'Not signed in.' }, { status: 401 }),
    }
  }
  return { session, unauthorized: null }
}
