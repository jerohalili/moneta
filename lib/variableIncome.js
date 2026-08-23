import { computeMonthlyContributions } from './contributions'
import { computeThirteenthMonthPay } from './thirteenthMonthPay'
import { applyGraduatedTable } from './freelancerTax'

/**
 * Computes annual income tax and 13th-month pay when salary changed
 * mid-year or someone worked partial months — e.g. a raise in Q3, a new
 * job partway through the year, or months with no pay at all.
 *
 * `periods`: array of { months, monthlySalary } — each a stretch of the
 * year at one salary level. Contributions are computed per period at
 * that period's own salary (not blended), since SSS/PhilHealth/Pag-IBIG
 * brackets depend on the actual monthly amount.
 */
export function computeVariableIncomeTax({ periods }) {
  let totalBasicSalary = 0
  let totalContributions = 0

  for (const period of periods) {
    const months = Math.max(0, period.months)
    const salary = Math.max(0, period.monthlySalary)
    totalBasicSalary += months * salary
    const monthlyContribution = computeMonthlyContributions({ monthlyCompensation: salary }).totalEmployee
    totalContributions += monthlyContribution * months
  }

  const thirteenthMonth = computeThirteenthMonthPay({ totalBasicSalary })
  const taxableCompensation = Math.max(0, totalBasicSalary - totalContributions)
  const incomeTax = applyGraduatedTable(taxableCompensation)

  return { totalBasicSalary, totalContributions, thirteenthMonth, taxableCompensation, incomeTax }
}
