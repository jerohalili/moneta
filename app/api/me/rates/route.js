import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { rateOverrides } from '@/lib/db/schema'
import { getSessionOrUnauthorized } from '@/lib/session'

// Rate overrides are { key: value } — keys are re-validated against the
// registry on the client when applied (lib/taxConfig.sanitizeOverride);
// here we only bound size and shape so junk can't be persisted.
const bodySchema = z.object({
  overrides: z.record(z.string(), z.unknown()),
})

const MAX_BYTES = 100_000

export async function PUT(req) {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  if (JSON.stringify(parsed.data.overrides).length > MAX_BYTES) {
    return NextResponse.json({ error: 'Rate overrides too large.' }, { status: 413 })
  }

  const db = getDb()
  const now = new Date()
  await db
    .insert(rateOverrides)
    .values({ userId: session.user.id, overrides: parsed.data.overrides, updatedAt: now })
    .onConflictDoUpdate({
      target: rateOverrides.userId,
      set: { overrides: parsed.data.overrides, updatedAt: now },
    })

  return NextResponse.json({ ok: true, updatedAt: now.toISOString() })
}
