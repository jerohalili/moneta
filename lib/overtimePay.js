import {
  OT_REGULAR_MULTIPLIER, OT_REST_DAY_MULTIPLIER, OT_REST_DAY_OT_MULTIPLIER,
  OT_SPECIAL_HOLIDAY_MULTIPLIER, OT_SPECIAL_HOLIDAY_OT_MULTIPLIER,
  OT_REGULAR_HOLIDAY_MULTIPLIER, OT_REGULAR_HOLIDAY_OT_MULTIPLIER,
  NIGHT_DIFFERENTIAL_MULTIPLIER,
} from '@/data/taxRates2026'

export const OT_CATEGORIES = [
  { id: 'regular', label: 'Regular overtime (beyond 8 hrs, ordinary day)', multiplier: OT_REGULAR_MULTIPLIER },
  { id: 'rest-day', label: 'Work on a rest day (within 8 hrs)', multiplier: OT_REST_DAY_MULTIPLIER },
  { id: 'rest-day-ot', label: 'Overtime on a rest day', multiplier: OT_REST_DAY_OT_MULTIPLIER },
  { id: 'special-holiday', label: 'Special (non-working) holiday, within 8 hrs', multiplier: OT_SPECIAL_HOLIDAY_MULTIPLIER },
  { id: 'special-holiday-ot', label: 'Overtime on a special holiday', multiplier: OT_SPECIAL_HOLIDAY_OT_MULTIPLIER },
  { id: 'regular-holiday', label: 'Regular holiday, within 8 hrs', multiplier: OT_REGULAR_HOLIDAY_MULTIPLIER },
  { id: 'regular-holiday-ot', label: 'Overtime on a regular holiday', multiplier: OT_REGULAR_HOLIDAY_OT_MULTIPLIER },
]

/** Pay for a block of hours worked under one OT/holiday category, plus an
 * optional night-differential add-on for hours falling within 10PM–6AM
 * (Labor Code Art. 86). Night differential stacks additively on top of
 * whatever category rate already applies. */
export function computeOvertimePay({ hourlyRate, hours, categoryId, nightDiffHours = 0 }) {
  const category = OT_CATEGORIES.find((c) => c.id === categoryId) ?? OT_CATEGORIES[0]
  const rate = Math.max(0, hourlyRate)
  const h = Math.max(0, hours)
  const nd = Math.min(h, Math.max(0, nightDiffHours))

  const basePay = rate * h * category.multiplier
  const nightDiffPay = rate * nd * category.multiplier * NIGHT_DIFFERENTIAL_MULTIPLIER
  const total = basePay + nightDiffPay

  return { category, basePay, nightDiffPay, total }
}
