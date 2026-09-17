import { birComputeEmployeeTax } from './employeeTax'
import { birCompareRoutes } from './freelancerTax'

// Combined tax for mixed earners (compensation + business in one year).
// Business uses isMixedIncomeEarner so 8% loses ₱250k exemption (RR 8-2018).
export function birComputeMixedIncomeTax({
  grossCompensation,
  mandatoryContributions = 0,
  grossReceipts,
  itemizedExpenses = 0,
}) {
  const employee = birComputeEmployeeTax({ grossCompensation, mandatoryContributions })
  const business = birCompareRoutes({ grossReceipts, itemizedExpenses, isMixedIncomeEarner: true })

  return {
    employee,
    business,
    totalTax: employee.total + business.best.total,
  }
}

// Back-compat alias — prefer birComputeMixedIncomeTax in new code.
export const computeMixedIncomeTax = birComputeMixedIncomeTax
