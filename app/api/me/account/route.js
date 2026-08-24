import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { getSessionOrUnauthorized } from '@/lib/session'

/**
 * Deletes the signed-in account. The user row's ON DELETE CASCADE
 * relationships take everything with it: auth sessions/accounts, income
 * profile, rate overrides, history. The session cookie dies naturally
 * because its row is gone — the client follows up with signOut() to clear
 * it immediately.
 */
export async function DELETE() {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()

  const db = getDb()
  await db.delete(user).where(eq(user.id, session.user.id))
  return NextResponse.json({ ok: true })
}
