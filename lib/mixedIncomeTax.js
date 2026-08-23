import { computeEmployeeTax } from './employeeTax'
import { compareRoutes } from './freelancerTax'

/**
 * Computes combined tax for a mixed-income earner (compensation +
 * business/professional income in the same year).
 *
 * Compensation is taxed under the regular graduated table exactly like a
 * pure employee (lib/employeeTax.js). Business/professional income is
 * taxed via compareRoutes() with `isMixedIncomeEarner: true` — the RR
 * 8-2018 rule that a mixed-income earner's 8% election does NOT get the
 * ₱250,000 exemption, since that exemption is already used up on the
 * compensation side.
 */
export function computeMixedIncomeTax({
  grossCompensation,
  mandatoryContributions = 0,
  grossReceipts,
  itemizedExpenses = 0,
}) {
  const employee = computeEmployeeTax({ grossCompensation, mandatoryContributions })
  const business = compareRoutes({ grossReceipts, itemizedExpenses, isMixedIncomeEarner: true })

  return {
    employee,
    business,
    totalTax: employee.total + business.best.total,
  }
}
