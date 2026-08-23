import { computeMonthlyContributions } from './contributions'
import { applyGraduatedTable } from './freelancerTax'

/**
 * Computes take-home (net) pay for a monthly-paid employee: gross
 * compensation minus mandatory contributions minus the monthly-equivalent
 * withholding tax.
 *
 * The withholding tax shown here is a year-end-equivalent estimate (this
 * month's taxable pay annualized through the same graduated table, then
 * divided back down to a month) — it approximates what a consistent
 * monthly withholding *should* average out to, not necessarily what your
 * employer's specific BIR withholding-tax-table computation produces for
 * this exact month. The two normally converge closely over a full year.
 */
export function computeNetPay({ monthlyGrossCompensation }) {
  const gross = Math.max(0, monthlyGrossCompensation)
  const contributions = computeMonthlyContributions({ monthlyCompensation: gross })
  const monthlyTaxableIncome = Math.max(0, gross - contributions.totalEmployee)
  const annualizedTax = applyGraduatedTable(monthlyTaxableIncome * 12)
  const monthlyWithholdingTax = annualizedTax / 12
  const netPay = gross - contributions.totalEmployee - monthlyWithholdingTax

  return {
    gross,
    contributions,
    monthlyTaxableIncome,
    monthlyWithholdingTax,
    netPay,
  }
}
