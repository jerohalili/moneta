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
 * - This assumes a single employer for the full year. Someone with more
 *   than one employer in the same year has different, stricter filing
 *   requirements (no substituted filing) that this doesn't model.
 */
export function computeEmployeeTax({ grossCompensation, mandatoryContributions = 0 }) {
  const taxableCompensation = Math.max(0, grossCompensation - mandatoryContributions)
  const incomeTax = applyGraduatedTable(taxableCompensation)
  return {
    taxableCompensation,
    incomeTax,
    total: incomeTax,
  }
}
