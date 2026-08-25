import { applyGraduatedTable } from './freelancerTax'

/**
 * Estimates annual income tax on compensation income (an employee's salary),
 * using the same graduated bracket table the BIR uses to true up
 * withholding at year-end (NIRC Sec. 24(A)).
 *
 * IMPORTANT SIMPLIFICATIONS (v1, not built out yet — see CONTINUE.md):
 * - `mandatoryContributions` (SSS + PhilHealth + Pag-IBIG) must be entered
 *   manually. The official 2026 contribution tables aren't in this codebase
 *   yet, so this can't compute them for you — enter your actual total.
 * - Enter regular taxable compensation only. Exclude 13th-month pay and
 *   other de minimis benefits up to ₱90,000, since those are tax-exempt
 *   under NIRC Sec. 32(B)(7)(e) and shouldn't be lumped into this figure.
 * - `withheldTax` (optional) is the total tax already withheld by the
 *   employer(s) during the year. When provided, the result reports the
 *   balance still payable (or the overpayment refundable) at annual
 *   true-up — the situation a multi-employer employee faces when filing
 *   BIR Form 1700, since each employer withholds against their own
 *   salary alone and the combined income usually lands in a higher
 *   bracket than either employer's withholding assumed.
 */
export function computeEmployeeTax({ grossCompensation, mandatoryContributions = 0, withheldTax = null }) {
  const taxableCompensation = Math.max(0, grossCompensation - mandatoryContributions)
  const incomeTax = applyGraduatedTable(taxableCompensation)
  const balanceDue = withheldTax === null ? null : Math.max(0, incomeTax - withheldTax)
  const overpayment = withheldTax === null ? null : Math.max(0, withheldTax - incomeTax)
  return {
    taxableCompensation,
    incomeTax,
    total: incomeTax,
    withheldTax,
    balanceDue,
    overpayment,
  }
}
