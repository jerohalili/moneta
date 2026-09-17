// Statutory BIR due dates for calendar-year individuals (NIRC/BIR regs; month is 0-indexed).
// If a date lands on a weekend/holiday, BIR moves it via RMC — confirm near filing season.

// Applies to self-employed individuals, professionals, sole proprietors,
// and mixed-income earners (anyone with business/professional income).
export const SELF_EMPLOYED_DEADLINES = [
  { month: 0, day: 25, form: '2551Q', label: 'Percentage Tax — Q4 (prior year)' },
  { month: 3, day: 15, form: '1701', label: 'Annual Income Tax Return' },
  { month: 3, day: 25, form: '2551Q', label: 'Percentage Tax — Q1' },
  { month: 4, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q1 (45 days after Q1 close)' },
  { month: 6, day: 25, form: '2551Q', label: 'Percentage Tax — Q2' },
  { month: 7, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q2 (45 days after Q2 close)' },
  { month: 9, day: 25, form: '2551Q', label: 'Percentage Tax — Q3' },
  { month: 10, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q3 (45 days after Q3 close)' },
]

// Pure compensation earners; single-employer via substituted filing (BIR Form 2316).
// Multi-employer staff must file Form 1700 themselves.
export const EMPLOYEE_DEADLINES = [
  { month: 3, day: 15, form: '1700', label: 'Annual Income Tax Return (only if not substituted-filed)' },
]

// Domestic corporations (incl. One Person Corporations): 1702Q is due on
// the 60th day after each of the first three quarters; the annual 1702 on
// April 15 (NIRC Secs. 28/65).
const CORPORATE_DEADLINES = [
  { month: 3, day: 15, form: '1702', label: 'Annual Corporate Income Tax Return' },
  { month: 4, day: 30, form: '1702Q', label: 'Quarterly Corporate Income Tax — Q1' },
  { month: 7, day: 29, form: '1702Q', label: 'Quarterly Corporate Income Tax — Q2' },
  { month: 10, day: 29, form: '1702Q', label: 'Quarterly Corporate Income Tax — Q3' },
]

// Estates and trusts file like individuals (NIRC Sec. 60): the annual
// 1701 and the three quarterly 1701Q returns (45 days after each of the
// first three quarters, per NIRC Sec. 65).
const ESTATE_TRUST_DEADLINES = [
  { month: 3, day: 15, form: '1701', label: 'Annual Income Tax Return (estate/trust)' },
  { month: 4, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q1' },
  { month: 7, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q2' },
  { month: 10, day: 15, form: '1701Q', label: 'Quarterly Income Tax — Q3' },
]

// Recurring monthly/quarterly business obligations for the Filing Calendar (day = due day).
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

// Next upcoming deadline for the profile type; business income uses the self-employed set.
const DEADLINE_SETS = {
  employee: EMPLOYEE_DEADLINES,
  'employee-multi': EMPLOYEE_DEADLINES,
  smwe: EMPLOYEE_DEADLINES,
  ofw: EMPLOYEE_DEADLINES,
  corporation: CORPORATE_DEADLINES,
  'estate-trust': ESTATE_TRUST_DEADLINES,
}

export function getNextDeadline(profileType = 'freelancer', referenceDate = new Date()) {
  const today = startOfDay(referenceDate)
  const deadlineSet = DEADLINE_SETS[profileType] ?? SELF_EMPLOYED_DEADLINES
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
