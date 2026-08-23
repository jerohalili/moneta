/**
 * Standard statutory BIR due dates for a calendar-year individual taxpayer.
 * month is 0-indexed (0 = January).
 *
 * These are fixed dates set by the NIRC/BIR regulations, not case-by-case
 * deadlines — if a date falls on a weekend or holiday, BIR typically moves
 * it to the next business day via a Revenue Memorandum Circular. Treat this
 * countdown as "the date to plan around," and confirm the exact moved date
 * closer to filing season if it lands near a weekend.
 */

// Applies to self-employed individuals, professionals, sole proprietors,
// and mixed-income earners (anyone with business/professional income).
export const SELF_EMPLOYED_DEADLINES = [
  { month: 0, day: 25, form: '2551Q', label: 'Percentage Tax — Q4 (prior year)' },
  { month: 3, day: 15, form: '1701', label: 'Annual Income Tax Return' },
  { month: 3, day: 25, form: '2551Q', label: 'Percentage Tax — Q1' },
  { month: 4, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q1' },
  { month: 6, day: 25, form: '2551Q', label: 'Percentage Tax — Q2' },
  { month: 7, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q2' },
  { month: 9, day: 25, form: '2551Q', label: 'Percentage Tax — Q3' },
  { month: 10, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q3' },
]

// Applies to a pure employee with a single employer. Note: most such
// employees never file this themselves — their employer handles it via
// substituted filing (BIR Form 2316) unless they have multiple employers
// or other income. This deadline is shown as context, not a personal to-do.
export const EMPLOYEE_DEADLINES = [
  { month: 3, day: 15, form: '1700', label: 'Annual Income Tax Return (only if not substituted-filed)' },
]

// Recurring monthly/quarterly obligations for a registered business —
// used by the Filing Calendar, which shows the whole year rather than
// just the next deadline. Monthly forms recur on the same day every
// month; only the day is meaningful for those entries.
export const RECURRING_BUSINESS_DEADLINES = [
  { day: 10, form: '0619-E', label: 'EWT remittance (months 1–2 of each quarter)', frequency: 'monthly' },
  { day: 20, form: '2550M', label: 'Monthly VAT declaration (VAT-registered)', frequency: 'monthly' },
  { day: 10, form: '1601-C', label: 'Withholding tax on compensation remittance', frequency: 'monthly' },
  { month: 0, day: 31, form: '1604-C', label: 'Annual alphalist of employees (compensation)', frequency: 'annual' },
  { month: 0, day: 31, form: '1604-E', label: 'Annual alphalist of payees (EWT)', frequency: 'annual' },
]

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns the next upcoming deadline (checking this year and next), plus
 * how many days away it is. `profileType === 'employee'` uses the employee
 * deadline set; every other profile type uses the self-employed set. */
export function getNextDeadline(profileType = 'freelancer', referenceDate = new Date()) {
  const today = startOfDay(referenceDate)
  const deadlineSet = profileType === 'employee' ? EMPLOYEE_DEADLINES : SELF_EMPLOYED_DEADLINES
  const candidates = deadlineSet.flatMap((d) =>
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
