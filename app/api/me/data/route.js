import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { getDb } from '@/lib/db'
import { historyEntries, incomeProfiles, rateOverrides } from '@/lib/db/schema'
import { getSessionOrUnauthorized } from '@/lib/session'

/**
 * One-shot initial sync payload for a signed-in user: profile, rate
 * overrides, and history in a single round trip (CloudSyncManager calls
 * this once per sign-in, not per page view).
 */
export async function GET() {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()
  const userId = session.user.id
  const db = getDb()

  const [profileRows, rateRows, historyRows] = await Promise.all([
    db.select().from(incomeProfiles).where(eq(incomeProfiles.userId, userId)).limit(1),
    db.select().from(rateOverrides).where(eq(rateOverrides.userId, userId)).limit(1),
    db
      .select()
      .from(historyEntries)
      .where(eq(historyEntries.userId, userId))
      .orderBy(desc(historyEntries.savedAt))
      .limit(500),
  ])

  return NextResponse.json({
    profile: profileRows[0] ?? null,
    rates: rateRows[0] ?? null,
    history: historyRows.map((row) => row.payload),
  })
}
