import { RATES } from './taxConfig'

function lookupCompromise(basicTax) {
  const brackets = RATES.COMPROMISE_PENALTY_BRACKETS
  const bracket = brackets.find((b) => basicTax <= b.upTo)
  return bracket ? bracket.amount : brackets[brackets.length - 1].amount
}

// Late filing/payment: surcharge + interest + compromise (NIRC Secs. 248–249, RMO 7-2015).
// Micro/Small get reduced rates (RA 11976 + RR 6-2024); compromise is an estimate.
export function birComputePenalties({ basicTax, daysLate, isFraud = false, isMicroSmall = false }) {
  const tax = Math.max(0, basicTax)
  const days = Math.max(0, daysLate)

  const surchargeRate = isFraud
    ? RATES.SURCHARGE_RATE_FRAUD
    : isMicroSmall
      ? RATES.SURCHARGE_RATE_MICRO_SMALL
      : RATES.SURCHARGE_RATE
  const interestRate = isMicroSmall ? RATES.INTEREST_RATE_MICRO_SMALL : RATES.INTEREST_RATE

  const surcharge = tax * surchargeRate
  const interest = tax * interestRate * (days / 365)
  const compromiseBase = lookupCompromise(tax)
  const compromise = isMicroSmall ? compromiseBase * RATES.COMPROMISE_DISCOUNT_MICRO_SMALL : compromiseBase

  return {
    surcharge,
    interest,
    compromise,
    total: tax + surcharge + interest + compromise,
  }
}

// Back-compat alias — prefer birComputePenalties in new code.
export const computePenalties = birComputePenalties
