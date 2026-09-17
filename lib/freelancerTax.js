import { RATES } from './taxConfig'

// NIRC Sec. 24(A): graduated table. Reads live RATES so /settings edits apply.
export function birApplyGraduatedTable(taxableIncome) {
  const income = Math.max(0, taxableIncome)
  const brackets = RATES.GRADUATED_BRACKETS
  const bracket = brackets.find((b) => income > b.over && income <= b.upTo)
    ?? brackets[brackets.length - 1]
  return bracket.base + (income - bracket.over) * bracket.rate
}

// Back-compat alias — prefer birApplyGraduatedTable in new code.
export const applyGraduatedTable = birApplyGraduatedTable

// Same as above but returns per-bracket slices for the walkthrough UI.
export function birExplainGraduatedTable(taxableIncome) {
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

// Back-compat alias — prefer birExplainGraduatedTable in new code.
export const explainGraduatedTable = birExplainGraduatedTable

// Graduated route: OSD or itemized deduction, then brackets + 3% percentage tax (NIRC Sec. 116).
export function birComputeGraduatedRoute({ grossReceipts, itemizedExpenses = 0, useItemized = false }) {
  const deduction = useItemized ? Math.min(itemizedExpenses, grossReceipts) : grossReceipts * RATES.OSD_RATE
  const taxableIncome = Math.max(0, grossReceipts - deduction)
  const incomeTax = birApplyGraduatedTable(taxableIncome)
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

// Back-compat alias — prefer birComputeGraduatedRoute in new code.
export const computeGraduatedRoute = birComputeGraduatedRoute

// RR 8-2018: mixed earners lose the ₱250k here — already used on compensation side.
function birComputeEightPercentRoute({ grossReceipts, applyExemption = true }) {
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

// Rank OSD / itemized / 8% routes cheapest-first. Set isMixedIncomeEarner for RR 8-2018 handling.
export function birCompareRoutes({ grossReceipts, itemizedExpenses = 0, isMixedIncomeEarner = false }) {
  const routes = [birComputeGraduatedRoute({ grossReceipts, itemizedExpenses: 0, useItemized: false })]

  if (itemizedExpenses > 0) {
    routes.push(birComputeGraduatedRoute({ grossReceipts, itemizedExpenses, useItemized: true }))
  }

  const eightPercent = birComputeEightPercentRoute({ grossReceipts, applyExemption: !isMixedIncomeEarner })
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

// Back-compat alias — prefer birCompareRoutes in new code.
export const compareRoutes = birCompareRoutes
