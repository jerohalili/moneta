import { RATES } from './taxConfig'

/**
 * Estimates penalties accumulated from returns that went unfiled after a
 * business stopped operating without a formal BIR closure (BIR Form
 * 1905/1906 + surrender of the Certificate of Registration). Filing
 * obligations don't stop just because the business stopped — each missed
 * return (monthly/quarterly percentage tax, VAT, or annual ITR) typically
 * draws at minimum a compromise penalty even with zero tax due, per RMO
 * 7-2015 (see the same caveat as lib/penalties.js: this is a
 * representative estimate, not an exact BIR quote).
 */
export function computeClosurePenalty({ unfiledReturnsCount }) {
  const count = Math.max(0, Math.round(unfiledReturnsCount))
  const perReturnMinimum = RATES.COMPROMISE_PENALTY_BRACKETS[0].amount // the ₱1,000 "no tax due" floor
  return {
    count,
    perReturnMinimum,
    estimatedTotal: count * perReturnMinimum,
  }
}
