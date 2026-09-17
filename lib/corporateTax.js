import { RATES } from './taxConfig'

// Corporate tax under CREATE (RA 11534): higher of RCIT vs MCIT from year 4.
export function birComputeCorporateTax({ grossIncome, netTaxableIncome, totalAssets, yearsInOperation }) {
  const qualifiesSmall = netTaxableIncome <= RATES.CORPORATE_SMALL_INCOME_CEILING && totalAssets <= RATES.CORPORATE_SMALL_ASSET_CEILING
  const rcitRate = qualifiesSmall ? RATES.CORPORATE_TAX_RATE_SMALL : RATES.CORPORATE_TAX_RATE_STANDARD
  const rcit = Math.max(0, netTaxableIncome) * rcitRate

  const mcitApplies = yearsInOperation >= 4
  const mcit = mcitApplies ? Math.max(0, grossIncome) * RATES.MCIT_RATE : 0

  const tax = mcitApplies ? Math.max(rcit, mcit) : rcit
  const usedMcit = mcitApplies && mcit > rcit

  return { qualifiesSmall, rcitRate, rcit, mcit, mcitApplies, usedMcit, tax }
}

// Back-compat alias — prefer birComputeCorporateTax in new code.
export const computeCorporateTax = birComputeCorporateTax
