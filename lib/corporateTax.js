import {
  CORPORATE_TAX_RATE_STANDARD, CORPORATE_TAX_RATE_SMALL,
  CORPORATE_SMALL_INCOME_CEILING, CORPORATE_SMALL_ASSET_CEILING, MCIT_RATE,
} from '@/data/taxRates2026'

/**
 * Corporate income tax under the CREATE Act (RA 11534): the corporation
 * pays whichever is higher of Regular Corporate Income Tax (RCIT) or
 * Minimum Corporate Income Tax (MCIT, 2% of gross income, from the 4th
 * taxable year of operations onward).
 *
 * The 20% "small corporation" rate applies only if BOTH net taxable
 * income ≤ ₱5M AND total assets (excluding land) ≤ ₱100M — failing either
 * test reverts the corporation to the full 25% rate.
 */
export function computeCorporateTax({ grossIncome, netTaxableIncome, totalAssets, yearsInOperation }) {
  const qualifiesSmall = netTaxableIncome <= CORPORATE_SMALL_INCOME_CEILING && totalAssets <= CORPORATE_SMALL_ASSET_CEILING
  const rcitRate = qualifiesSmall ? CORPORATE_TAX_RATE_SMALL : CORPORATE_TAX_RATE_STANDARD
  const rcit = Math.max(0, netTaxableIncome) * rcitRate

  const mcitApplies = yearsInOperation >= 4
  const mcit = mcitApplies ? Math.max(0, grossIncome) * MCIT_RATE : 0

  const tax = mcitApplies ? Math.max(rcit, mcit) : rcit
  const usedMcit = mcitApplies && mcit > rcit

  return { qualifiesSmall, rcitRate, rcit, mcit, mcitApplies, usedMcit, tax }
}
