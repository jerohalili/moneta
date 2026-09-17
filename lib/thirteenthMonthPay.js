import { RATES } from './taxConfig'

// Statutory 13th-month pay: basic salary / 12 (PD 851). Only basic salary counts.
// Amount over ₱90k combined with other benefits is taxable (NIRC Sec. 32(B)(7)(e)).
export function birComputeThirteenthMonthPay({ totalBasicSalary }) {
  const basic = Math.max(0, totalBasicSalary)
  const thirteenthMonthPay = basic / 12
  const exemptAmount = Math.min(thirteenthMonthPay, RATES.THIRTEENTH_MONTH_EXEMPTION)
  const taxableAmount = Math.max(0, thirteenthMonthPay - RATES.THIRTEENTH_MONTH_EXEMPTION)
  return { thirteenthMonthPay, exemptAmount, taxableAmount }
}

// Back-compat alias — prefer birComputeThirteenthMonthPay in new code.
export const computeThirteenthMonthPay = birComputeThirteenthMonthPay
