import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { incomeProfiles } from '@/lib/db/schema'
import { getSessionOrUnauthorized } from '@/lib/session'

// The profile blob is client-shaped by design (it mirrors the localStorage
// structure exactly). Validate the envelope and size, not every field —
// the server stores snapshots, it never computes with them.
const bodySchema = z.object({
  data: z.record(z.string(), z.unknown()),
})

const MAX_BYTES = 300_000

export async function PUT(req) {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  if (JSON.stringify(parsed.data.data).length > MAX_BYTES) {
    return NextResponse.json({ error: 'Profile snapshot too large.' }, { status: 413 })
  }

  const db = getDb()
  const now = new Date()
  await db
    .insert(incomeProfiles)
    .values({ userId: session.user.id, data: parsed.data.data, updatedAt: now })
    .onConflictDoUpdate({
      target: incomeProfiles.userId,
      set: { data: parsed.data.data, updatedAt: now },
    })

  return NextResponse.json({ ok: true, updatedAt: now.toISOString() })
}
