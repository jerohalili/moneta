import { RATES } from './taxConfig'
import { applyGraduatedTable } from './freelancerTax'

/**
 * BIR Form 1701Q — the quarterly income tax computation for self-employed
 * individuals and professionals (NIRC Sec. 65: due 45 days after each of
 * the first three quarters; Q4 settles on the annual 1701).
 *
 * The graduated method follows the official worksheet (RR 8-2018): take
 * CUMULATIVE net taxable income year-to-date, divide by the number of
 * quarters elapsed, run that average through the ANNUAL bracket table,
 * multiply back by quarters elapsed — then subtract taxes already paid in
 * prior quarters and creditable tax withheld year-to-date. This is why
 * quarterly tax is NOT four equal slices of the annual figure: a lumpy
 * income year compounds through the brackets quarter by quarter.
 *
 * The 8% method (RR 13-2018): 8% of cumulative gross receipts minus the
 * ₱250,000 exemption prorated per quarter elapsed, less prior payments
 * and creditable withholding.
 *
 * Withholding credit: creditable EWT (BIR Form 2307) is creditable
 * against the quarterly due under BOTH methods.
 *
 * @param {string} mode     'graduated' | 'eight-percent'
 * @param {Array}  quarters [{ gross, deductions, withheld }] for Q1..Q3;
 *                 trailing blank quarters (gross === null) are skipped
 */
export function computeQuarterlyTax({ mode = 'graduated', quarters }) {
  const active = []
  for (const q of quarters) {
    if (q.gross === null || q.gross === undefined) break
    active.push(q)
  }
  if (active.length === 0) return null

  const rows = []
  let cumGross = 0
  let cumTaxable = 0
  let cumWithheld = 0
  let paidPrior = 0

  for (let i = 0; i < active.length; i++) {
    const q = active[i]
    const n = i + 1
    const gross = Math.max(0, q.gross || 0)
    const deductions = Math.max(0, q.deductions || 0)
    const withheld = Math.max(0, q.withheld || 0)

    cumGross += gross
    cumWithheld += withheld
    let cumTax

    if (mode === 'eight-percent') {
      const exemption = RATES.EIGHT_PERCENT_EXEMPTION * (n / 4)
      cumTax = Math.max(0, cumGross - exemption) * RATES.EIGHT_PERCENT_RATE
    } else {
      cumTaxable += Math.max(0, gross - deductions)
      cumTax = applyGraduatedTable(cumTaxable / n) * n
    }

    const payable = Math.max(0, cumTax - paidPrior - cumWithheld)
    rows.push({
      quarter: n,
      gross,
      deductions,
      withheld,
      cumTaxable: mode === 'eight-percent' ? cumGross : cumTaxable,
      cumTax,
      withheldYTD: cumWithheld,
      payable,
    })
    paidPrior += payable
  }

  return {
    mode,
    rows,
    totalPaid: rows.reduce((sum, r) => sum + r.payable, 0),
    cumTaxable: rows[rows.length - 1].cumTaxable,
    cumWithheld: rows[rows.length - 1].withheldYTD,
    annualTaxEstimate: rows[rows.length - 1].cumTax,
  }
}
