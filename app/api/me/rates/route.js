import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db'
import { rateOverrides } from '@/lib/db/schema'
import { getSessionOrUnauthorized } from '@/lib/session'
import { RATE_REGISTRY } from '@/lib/taxConfig'

// Rate overrides are { key: value } — keys are allowlisted against the
// registry here (unknown keys → 400) and re-validated against the registry
// on the client when applied (lib/taxConfig.sanitizeOverride).
const KNOWN_KEYS = new Set(RATE_REGISTRY.map((entry) => entry.key))

const bodySchema = z.object({
  overrides: z.record(z.string(), z.unknown()),
})

const MAX_BYTES = 100_000
const MAX_KEYS = 200

/** @param {Request} req */
export async function PUT(req) {
  const { session, unauthorized } = await getSessionOrUnauthorized()
  if (!session) return unauthorized()

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  const keys = Object.keys(parsed.data.overrides)
  if (keys.length > MAX_KEYS) {
    return NextResponse.json({ error: 'Rate overrides too large.' }, { status: 413 })
  }
  const unknown = keys.filter((k) => !KNOWN_KEYS.has(k))
  if (unknown.length > 0) {
    return NextResponse.json({ error: `Unknown rate keys: ${unknown.slice(0, 5).join(', ')}.` }, { status: 400 })
  }
  for (const value of Object.values(parsed.data.overrides)) {
    if (typeof value === 'number' ? !Number.isFinite(value) : !Array.isArray(value)) {
      return NextResponse.json({ error: 'Invalid rate value.' }, { status: 400 })
    }
  }
  if (JSON.stringify(parsed.data.overrides).length > MAX_BYTES) {
    return NextResponse.json({ error: 'Rate overrides too large.' }, { status: 413 })
  }

  let db
  try {
    db = getDb()
  } catch {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 })
  }
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
