import { RATES } from './taxConfig'
import { compareRoutes } from './freelancerTax'

/**
 * Checks BMBE (Barangay Micro Business Enterprise) eligibility and, if
 * eligible, shows the income tax savings from registering.
 *
 * A registered BMBE is 100% exempt from income tax on income from its
 * operations (RA 9178 Sec. 7 / NIRC Sec. 27(D)). This is NOT automatic —
 * it requires a BMBE Certificate of Authority from DTI (sole
 * proprietorships) or the city/municipal office (partnerships,
 * corporations, cooperatives). BMBE status does NOT exempt percentage tax
 * or VAT — only income tax.
 */
export function computeBmbeSavings({ totalAssets, grossReceipts, itemizedExpenses = 0 }) {
  const eligible = totalAssets <= RATES.BMBE_ASSET_CEILING
  const withoutBmbe = compareRoutes({ grossReceipts, itemizedExpenses })
  const savings = eligible ? withoutBmbe.best.total : 0

  return {
    eligible,
    incomeTaxWithoutBmbe: withoutBmbe.best.total,
    incomeTaxAsBmbe: eligible ? 0 : withoutBmbe.best.total,
    savings,
  }
}
