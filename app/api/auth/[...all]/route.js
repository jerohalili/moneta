import { getAuth } from '@/lib/auth'

/**
 * Catch-all Better Auth endpoint: /api/auth/sign-in/*, /api/auth/callback/*,
 * etc. Resolves the lazy auth instance per request so the build never needs
 * database credentials.
 */
async function handle(req) {
  const auth = await Promise.resolve(getAuth())
  return auth.handler(req)
}

export const GET = handle
export const POST = handle
