import { THIRTEENTH_MONTH_EXEMPTION } from '@/data/taxRates2026'

/**
 * Computes statutory 13th-month pay: total basic salary actually earned
 * during the calendar year, divided by 12 (Presidential Decree No. 851
 * and its Implementing Rules). Only basic salary counts — overtime,
 * holiday pay, allowances, and other benefits are excluded by definition,
 * so `totalBasicSalary` should already exclude those.
 *
 * The exemption threshold (NIRC Sec. 32(B)(7)(e), as amended by TRAIN)
 * applies to 13th-month pay combined with other similar benefits — any
 * amount over ₱90,000 is taxable compensation.
 */
export function computeThirteenthMonthPay({ totalBasicSalary }) {
  const basic = Math.max(0, totalBasicSalary)
  const thirteenthMonthPay = basic / 12
  const exemptAmount = Math.min(thirteenthMonthPay, THIRTEENTH_MONTH_EXEMPTION)
  const taxableAmount = Math.max(0, thirteenthMonthPay - THIRTEENTH_MONTH_EXEMPTION)
  return { thirteenthMonthPay, exemptAmount, taxableAmount }
}
