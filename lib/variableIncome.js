import { birComputeMonthlyContributions } from './contributions'
import { birComputeThirteenthMonthPay } from './thirteenthMonthPay'
import { birApplyGraduatedTable } from './freelancerTax'

// Annual tax + 13th-month pay for changing/partial-year salaries.
// `periods`: [{ months, monthlySalary }]; contributions per period at that salary.
export function birComputeVariableIncomeTax({ periods }) {
  let totalBasicSalary = 0
  let totalContributions = 0

  for (const period of periods) {
    const months = Math.max(0, period.months)
    const salary = Math.max(0, period.monthlySalary)
    totalBasicSalary += months * salary
    const monthlyContribution = birComputeMonthlyContributions({ monthlyCompensation: salary }).totalEmployee
    totalContributions += monthlyContribution * months
  }

  const thirteenthMonth = birComputeThirteenthMonthPay({ totalBasicSalary })
  const taxableCompensation = Math.max(0, totalBasicSalary - totalContributions)
  const incomeTax = birApplyGraduatedTable(taxableCompensation)

  return { totalBasicSalary, totalContributions, thirteenthMonth, taxableCompensation, incomeTax }
}

// Back-compat alias — prefer birComputeVariableIncomeTax in new code.
export const computeVariableIncomeTax = birComputeVariableIncomeTax
