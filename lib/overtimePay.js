import { RATES } from './taxConfig'

// Multipliers are resolved at call time from RATES (not stored here), so
// edits on /settings apply to the very next computation.
const OT_MULTIPLIER_KEYS = {
  regular: 'OT_REGULAR_MULTIPLIER',
  'rest-day': 'OT_REST_DAY_MULTIPLIER',
  'rest-day-ot': 'OT_REST_DAY_OT_MULTIPLIER',
  'special-holiday': 'OT_SPECIAL_HOLIDAY_MULTIPLIER',
  'special-holiday-ot': 'OT_SPECIAL_HOLIDAY_OT_MULTIPLIER',
  'regular-holiday': 'OT_REGULAR_HOLIDAY_MULTIPLIER',
  'regular-holiday-ot': 'OT_REGULAR_HOLIDAY_OT_MULTIPLIER',
}

export const OT_CATEGORIES = [
  { id: 'regular', label: 'Regular overtime (beyond 8 hrs, ordinary day)' },
  { id: 'rest-day', label: 'Work on a rest day (within 8 hrs)' },
  { id: 'rest-day-ot', label: 'Overtime on a rest day' },
  { id: 'special-holiday', label: 'Special (non-working) holiday, within 8 hrs' },
  { id: 'special-holiday-ot', label: 'Overtime on a special holiday' },
  { id: 'regular-holiday', label: 'Regular holiday, within 8 hrs' },
  { id: 'regular-holiday-ot', label: 'Overtime on a regular holiday' },
]

/** Pay for a block of hours worked under one OT/holiday category, plus an
 * optional night-differential add-on for hours falling within 10PM–6AM
 * (Labor Code Art. 86). Night differential stacks additively on top of
 * whatever category rate already applies. */
export function computeOvertimePay({ hourlyRate, hours, categoryId, nightDiffHours = 0 }) {
  const category = OT_CATEGORIES.find((c) => c.id === categoryId) ?? OT_CATEGORIES[0]
  const multiplier = RATES[OT_MULTIPLIER_KEYS[category.id]] ?? 1
  const rate = Math.max(0, hourlyRate)
  const h = Math.max(0, hours)
  const nd = Math.min(h, Math.max(0, nightDiffHours))

  const basePay = rate * h * multiplier
  const nightDiffPay = rate * nd * multiplier * RATES.NIGHT_DIFFERENTIAL_MULTIPLIER
  const total = basePay + nightDiffPay

  return { category, multiplier, basePay, nightDiffPay, total }
}
