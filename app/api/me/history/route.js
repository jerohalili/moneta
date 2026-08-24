import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { historyEntries } from '@/lib/db/schema'
import { getSessionOrUnauthorized } from '@/lib/session'

const MAX_ENTRY_BYTES = 50_000

const entrySchema = z.object({
  id: z.string().min(1).max(80),
  calculatorName: z.string().min(1).max(120),
  summary: z.string().max(500),
  details: z.record(z.string(), z.unknown()).optional(),
  savedAt: z.string(),
})

/** Upserts one history entry. Client-generated ids are the stable merge
 * key across devices, but a malicious client could send an id owned by
 * ANOTHER user — so ownership is checked before any write. */
export async function POST(req) {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()

  const parsed = entrySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  const entry = parsed.data
  if (JSON.stringify(entry).length > MAX_ENTRY_BYTES) {
    return NextResponse.json({ error: 'Entry too large.' }, { status: 413 })
  }

  const userId = session.user.id
  const db = getDb()
  const existing = await db.select({ userId: historyEntries.userId }).from(historyEntries).where(eq(historyEntries.id, entry.id)).limit(1)
  if (existing[0] && existing[0].userId !== userId) {
    return NextResponse.json({ error: 'Conflict.' }, { status: 409 })
  }

  const savedAt = new Date(entry.savedAt)
  await db
    .insert(historyEntries)
    .values({ id: entry.id, userId, payload: entry, savedAt })
    .onConflictDoUpdate({
      target: historyEntries.id,
      set: { payload: entry, savedAt },
    })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req) {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()
  const userId = session.user.id
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  const all = url.searchParams.get('all')

  const db = getDb()
  if (all === '1') {
    await db.delete(historyEntries).where(eq(historyEntries.userId, userId))
  } else if (id) {
    // `and` with userId makes cross-user deletion impossible.
    await db.delete(historyEntries).where(and(eq(historyEntries.id, id), eq(historyEntries.userId, userId)))
  } else {
    return NextResponse.json({ error: 'Provide ?id= or ?all=1.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
