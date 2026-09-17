import { birComputeMonthlyContributions } from './contributions'
import { birApplyGraduatedTable } from './freelancerTax'

// Monthly take-home: gross minus contributions minus monthly-equivalent withholding.
// Withholding is annualized through graduated table then /12 — a full-year average.
export function birComputeNetPay({ monthlyGrossCompensation }) {
  const gross = Math.max(0, monthlyGrossCompensation)
  const contributions = birComputeMonthlyContributions({ monthlyCompensation: gross })
  const monthlyTaxableIncome = Math.max(0, gross - contributions.totalEmployee)
  const annualizedTax = birApplyGraduatedTable(monthlyTaxableIncome * 12)
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

// Back-compat alias — prefer birComputeNetPay in new code.
export const computeNetPay = birComputeNetPay
