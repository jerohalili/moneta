import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { getDb } from '@/lib/db'
import * as authSchema from '@/lib/db/schema'

let _auth = null

/**
 * Better Auth instance. LAZY (same reason as lib/db): construction needs
 * env vars that don't exist at build time, and Next evaluates route
 * modules during `next build`.
 *
 * Sign-in methods:
 * - Google OAuth     → enabled when AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET are set
 * - Email + password → enabled; email verification stays OFF for now (needs
 *                      a transactional mailer before requireEmailVerification
 *                      can go on — see CONTINUE.md's public-launch checklist)
 * - Guest            → the anonymous plugin: one tap creates a real user row
 *                      with isAnonymous=true. When that guest later signs in
 *                      with Google or email/password, Better Auth links the
 *                      accounts into the same user — every synced row (which
 *                      references user.id) carries over automatically.
 */
export function getAuth() {
  if (!_auth) {
    const secret =
      process.env.BETTER_AUTH_SECRET ??
      (process.env.NODE_ENV !== 'production' ? 'dev-only-insecure-secret' : undefined)
    if (!secret) {
      throw new Error(
        'BETTER_AUTH_SECRET is not set in production. Generate one with: openssl rand -base64 32'
      )
    }

    const google =
      process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
        ? {
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }
        : null

    _auth = betterAuth({
      appName: 'Moneta',
      secret,
      baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      database: drizzleAdapter(getDb(), {
        provider: 'pg',
        schema: {
          user: authSchema.user,
          session: authSchema.session,
          account: authSchema.account,
          verification: authSchema.verification,
        },
      }),
      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
      },
      socialProviders: google ? { google } : {},
      plugins: [anonymous(), nextCookies()],
    })
  }
  return _auth
}
