import { birApplyGraduatedTable } from './freelancerTax'

// Compensation tax via the graduated table (NIRC Sec. 24(A)); contributions entered manually.
// Excludes 13th-month/de minimis up to ₱90k (NIRC Sec. 32(B)(7)(e)); optional withheldTax enables 1700 true-up.
export function birComputeEmployeeTax({ grossCompensation, mandatoryContributions = 0, withheldTax = null }) {
  const taxableCompensation = Math.max(0, grossCompensation - mandatoryContributions)
  const incomeTax = birApplyGraduatedTable(taxableCompensation)
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

// Back-compat alias — prefer birComputeEmployeeTax in new code.
export const computeEmployeeTax = birComputeEmployeeTax
