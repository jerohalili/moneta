import { RATES } from './taxConfig'

/** Applies the graduated bracket table to a taxable-income figure.
 * Reads the live rate table (RATES), not the compiled defaults, so
 * user-customized brackets take effect immediately. */
export function applyGraduatedTable(taxableIncome) {
  const income = Math.max(0, taxableIncome)
  const brackets = RATES.GRADUATED_BRACKETS
  const bracket = brackets.find((b) => income > b.over && income <= b.upTo)
    ?? brackets[brackets.length - 1]
  return bracket.base + (income - bracket.over) * bracket.rate
}

/**
 * Same computation as applyGraduatedTable, but returns the per-bracket
 * SLICES so the UI can show exactly how the tax was built up. This is the
 * teaching view — every peso of tax traced back to the bracket row and
 * rate that produced it.
 */
export function explainGraduatedTable(taxableIncome) {
  const income = Math.max(0, taxableIncome)
  const slices = []
  let total = 0
  for (const b of RATES.GRADUATED_BRACKETS) {
    if (income <= b.over) break
    const sliceTop = Math.min(income, b.upTo)
    const sliceAmount = sliceTop - b.over
    const sliceTax = sliceAmount * b.rate
    slices.push({
      over: b.over,
      upTo: b.upTo === Infinity ? null : b.upTo,
      rate: b.rate,
      amount: sliceAmount,
      tax: sliceTax,
    })
    total += sliceTax
  }
  return { slices, total }
}

/**
 * Graduated-rate route: deduct either OSD (40% of gross) or itemized
 * expenses, apply the bracket table, then add 3% percentage tax on gross
 * (since non-8% filers who aren't VAT-registered still owe it).
 */
export function computeGraduatedRoute({ grossReceipts, itemizedExpenses = 0, useItemized = false }) {
  const deduction = useItemized ? Math.min(itemizedExpenses, grossReceipts) : grossReceipts * RATES.OSD_RATE
  const taxableIncome = Math.max(0, grossReceipts - deduction)
  const incomeTax = applyGraduatedTable(taxableIncome)
  const percentageTax = grossReceipts * RATES.PERCENTAGE_TAX_RATE
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
function computeEightPercentRoute({ grossReceipts, applyExemption = true }) {
  const eligible = grossReceipts <= RATES.EIGHT_PERCENT_ELIGIBILITY_CEILING
  const exemption = applyExemption ? RATES.EIGHT_PERCENT_EXEMPTION : 0
  const taxableBase = Math.max(0, grossReceipts - exemption)
  const tax = eligible ? taxableBase * RATES.EIGHT_PERCENT_RATE : null
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
    vatRequired: grossReceipts > RATES.VAT_THRESHOLD,
  }
}
