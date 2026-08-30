import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import { getDb } from '@/lib/db'

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
      baseURL: {
        allowedHosts: ['localhost:3000', 'moneta-lovat.vercel.app'],
        fallback: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
        protocol: process.env.NODE_ENV === 'production' ? 'https' : 'http',
      },
      trustedOrigins: [
        'http://localhost:3000',
        'https://moneta-lovat.vercel.app',
      ],
      database: drizzleAdapter(getDb(), {
        provider: 'pg',
        // Use Drizzle's internal fullSchema which has proper fieldName mappings
        // instead of raw pgTable objects
      }),
      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
      },
      socialProviders: google ? { google } : {},
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 300,
          strategy: 'compact',
          refreshCache: { updateAge: 60 },
          version: '1',
        },
      },
      rateLimit: {
        enabled: true,
        window: 10,
        max: 100,
        storage: 'memory',
      },
      advanced: {
        useSecureCookies: process.env.NODE_ENV === 'production',
        crossSubDomainCookies: { enabled: false },
        cookiePrefix: 'moneta',
        defaultCookieAttributes: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          httpOnly: true,
          path: '/',
        },
        trustedProxyHeaders: true,
      },
      plugins: [anonymous(), nextCookies()],
    })
  }
  return _auth
}
