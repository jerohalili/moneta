import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db = null

/**
 * Lazily creates the Drizzle-over-Neon client on first use.
 *
 * LAZY ON PURPOSE: `neon(undefined)` throws at import time, and Next's
 * build evaluates route modules — eager init would make the whole build
 * fail without a DATABASE_URL. With lazy init, builds are clean and the
 * error only surfaces when a request actually needs the database (where
 * a clear message beats a stack trace).
 */
export function getDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error(
        'DATABASE_URL is not set. Create a Neon database (see CONTINUE.md), then set it in .env.local locally and in the Vercel project environment.'
      )
    }
    _db = drizzle(neon(url), { schema })
  }
  return _db
}
