import {
  GRADUATED_BRACKETS,
  EIGHT_PERCENT_RATE,
  EIGHT_PERCENT_EXEMPTION,
  EIGHT_PERCENT_ELIGIBILITY_CEILING,
  PERCENTAGE_TAX_RATE,
  OSD_RATE,
  VAT_THRESHOLD,
} from '@/data/taxRates2026.js'

/** Applies the graduated bracket table to a taxable-income figure. */
export function applyGraduatedTable(taxableIncome) {
  const income = Math.max(0, taxableIncome)
  const bracket = GRADUATED_BRACKETS.find((b) => income > b.over && income <= b.upTo)
    ?? GRADUATED_BRACKETS[GRADUATED_BRACKETS.length - 1]
  return bracket.base + (income - bracket.over) * bracket.rate
}

/**
 * Graduated-rate route: deduct either OSD (40% of gross) or itemized
 * expenses, apply the bracket table, then add 3% percentage tax on gross
 * (since non-8% filers who aren't VAT-registered still owe it).
 */
export function computeGraduatedRoute({ grossReceipts, itemizedExpenses = 0, useItemized = false }) {
  const deduction = useItemized ? Math.min(itemizedExpenses, grossReceipts) : grossReceipts * OSD_RATE
  const taxableIncome = Math.max(0, grossReceipts - deduction)
  const incomeTax = applyGraduatedTable(taxableIncome)
  const percentageTax = grossReceipts * PERCENTAGE_TAX_RATE
  return {
    method: useItemized ? 'graduated-itemized' : 'graduated-osd',
    deduction,
    taxableIncome,
    incomeTax,
    percentageTax,
    total: incomeTax + percentageTax,
  }
}

/** 8% flat-tax route: only valid while gross receipts stay under the VAT threshold.
 * `applyExemption` should be false for mixed-income earners (someone who also has
 * compensation income) — under RR 8-2018, the ₱250,000 exemption is only available
 * to *purely* self-employed/professional taxpayers, since a mixed-income earner's
 * ₱250,000 is already accounted for on the compensation side. */
export function computeEightPercentRoute({ grossReceipts, applyExemption = true }) {
  const eligible = grossReceipts <= EIGHT_PERCENT_ELIGIBILITY_CEILING
  const exemption = applyExemption ? EIGHT_PERCENT_EXEMPTION : 0
  const taxableBase = Math.max(0, grossReceipts - exemption)
  const tax = eligible ? taxableBase * EIGHT_PERCENT_RATE : null
  return {
    method: '8-percent',
    eligible,
    exemptionApplied: exemption,
    taxableBase,
    incomeTax: tax,
    percentageTax: 0, // 8% option replaces percentage tax entirely
    total: tax,
  }
}

/**
 * Runs both routes (graduated with OSD, graduated with itemized if
 * expenses were given, and 8% if eligible) and returns them ranked by
 * total tax owed, cheapest first.
 *
 * `isMixedIncomeEarner`: pass true when this business/professional income
 * is on top of compensation income (an employer-employee relationship
 * elsewhere) — see the note on computeEightPercentRoute above.
 */
export function compareRoutes({ grossReceipts, itemizedExpenses = 0, isMixedIncomeEarner = false }) {
  const routes = [computeGraduatedRoute({ grossReceipts, itemizedExpenses: 0, useItemized: false })]

  if (itemizedExpenses > 0) {
    routes.push(computeGraduatedRoute({ grossReceipts, itemizedExpenses, useItemized: true }))
  }

  const eightPercent = computeEightPercentRoute({ grossReceipts, applyExemption: !isMixedIncomeEarner })
  if (eightPercent.eligible) routes.push(eightPercent)

  const ranked = routes
    .filter((r) => r.total !== null)
    .sort((a, b) => a.total - b.total)

  return {
    routes: ranked,
    best: ranked[0],
    vatRequired: grossReceipts > VAT_THRESHOLD,
  }
}
