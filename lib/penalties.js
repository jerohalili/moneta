import {
  SURCHARGE_RATE, SURCHARGE_RATE_FRAUD, SURCHARGE_RATE_MICRO_SMALL,
  INTEREST_RATE, INTEREST_RATE_MICRO_SMALL,
  COMPROMISE_DISCOUNT_MICRO_SMALL, COMPROMISE_PENALTY_BRACKETS,
} from '@/data/taxRates2026'

function lookupCompromise(basicTax) {
  const bracket = COMPROMISE_PENALTY_BRACKETS.find((b) => basicTax <= b.upTo)
  return bracket ? bracket.amount : COMPROMISE_PENALTY_BRACKETS[COMPROMISE_PENALTY_BRACKETS.length - 1].amount
}

/**
 * Estimates surcharge + interest + compromise penalty for a late BIR
 * filing/payment (NIRC Secs. 248–249, RMO 7-2015).
 *
 * `isMicroSmall`: the Ease of Paying Taxes Act (RA 11976) + RR 6-2024 give
 * taxpayers classified as Micro or Small a reduced 10% surcharge, 6%
 * interest, and a 50%-discounted compromise penalty — check this if that
 * classification applies to you. It never reduces the 50% fraud surcharge.
 *
 * The compromise penalty figure is a representative estimate, not exact —
 * see the comment on COMPROMISE_PENALTY_BRACKETS in data/taxRates2026.js.
 */
export function computePenalties({ basicTax, daysLate, isFraud = false, isMicroSmall = false }) {
  const tax = Math.max(0, basicTax)
  const days = Math.max(0, daysLate)

  const surchargeRate = isFraud ? SURCHARGE_RATE_FRAUD : isMicroSmall ? SURCHARGE_RATE_MICRO_SMALL : SURCHARGE_RATE
  const interestRate = isMicroSmall ? INTEREST_RATE_MICRO_SMALL : INTEREST_RATE

  const surcharge = tax * surchargeRate
  const interest = tax * interestRate * (days / 365)
  const compromiseBase = lookupCompromise(tax)
  const compromise = isMicroSmall ? compromiseBase * COMPROMISE_DISCOUNT_MICRO_SMALL : compromiseBase

  return {
    surcharge,
    interest,
    compromise,
    total: tax + surcharge + interest + compromise,
  }
}
