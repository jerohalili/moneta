import { RATES } from './taxConfig'

// Unfiled returns after stopping without BIR closure (Form 1905/1906). Estimate only (RMO 7-2015).
export function birComputeClosurePenalty({ unfiledReturnsCount }) {
  const count = Math.max(0, Math.round(unfiledReturnsCount))
  const perReturnMinimum = RATES.COMPROMISE_PENALTY_BRACKETS[0].amount // the ₱1,000 "no tax due" floor
  return {
    count,
    perReturnMinimum,
    estimatedTotal: count * perReturnMinimum,
  }
}

// Back-compat alias — prefer birComputeClosurePenalty in new code.
export const computeClosurePenalty = birComputeClosurePenalty
