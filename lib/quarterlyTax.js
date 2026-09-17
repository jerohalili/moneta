import { RATES } from './taxConfig'
import { birApplyGraduatedTable } from './freelancerTax'

// Form 1701Q quarterly tax for self-employed (NIRC Sec. 65; due 45 days after Q1–Q3).
// Graduated follows RR 8-2018 cumulative-average worksheet; 8% follows RR 13-2018; EWT (Form 2307) credits both.
export function birComputeQuarterlyTax({ mode = 'graduated', quarters }) {
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
      cumTax = birApplyGraduatedTable(cumTaxable / n) * n
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

// Back-compat alias — prefer birComputeQuarterlyTax in new code.
export const computeQuarterlyTax = birComputeQuarterlyTax
