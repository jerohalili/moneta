/**
 * Standard statutory BIR due dates for a calendar-year individual taxpayer
 * (self-employed / freelancer profile). month is 0-indexed (0 = January).
 *
 * These are the fixed dates set by the NIRC/BIR regulations, not
 * case-by-case deadlines — if a date falls on a weekend or holiday, BIR
 * typically moves it to the next business day via a Revenue Memorandum
 * Circular. Treat this countdown as "the date to plan around," and confirm
 * the exact moved date closer to filing season if it lands near a weekend.
 */
export const DEADLINES = [
  { month: 0, day: 25, form: '2551Q', label: 'Percentage Tax — Q4 (prior year)' },
  { month: 3, day: 15, form: '1701', label: 'Annual Income Tax Return' },
  { month: 3, day: 25, form: '2551Q', label: 'Percentage Tax — Q1' },
  { month: 4, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q1' },
  { month: 6, day: 25, form: '2551Q', label: 'Percentage Tax — Q2' },
  { month: 7, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q2' },
  { month: 9, day: 25, form: '2551Q', label: 'Percentage Tax — Q3' },
  { month: 10, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q3' },
]

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns the next upcoming deadline (checking this year and next), plus
 * how many days away it is. */
export function getNextDeadline(referenceDate = new Date()) {
  const today = startOfDay(referenceDate)
  const candidates = DEADLINES.flatMap((d) =>
    [0, 1].map((yearOffset) => ({
      ...d,
      date: new Date(today.getFullYear() + yearOffset, d.month, d.day),
    }))
  )
  const next = candidates
    .filter((c) => c.date >= today)
    .sort((a, b) => a.date - b.date)[0]

  const daysUntil = Math.round((next.date - today) / 86_400_000)
  return { ...next, daysUntil }
}
