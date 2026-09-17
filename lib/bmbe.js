import { RATES } from './taxConfig'
import { birCompareRoutes } from './freelancerTax'

// BMBE eligibility + income-tax savings (RA 9178). Exempts income tax only.
export function birComputeBmbeSavings({ totalAssets, grossReceipts, itemizedExpenses = 0 }) {
  const eligible = totalAssets <= RATES.BMBE_ASSET_CEILING
  const withoutBmbe = birCompareRoutes({ grossReceipts, itemizedExpenses })
  const savings = eligible ? withoutBmbe.best.total : 0

  return {
    eligible,
    incomeTaxWithoutBmbe: withoutBmbe.best.total,
    incomeTaxAsBmbe: eligible ? 0 : withoutBmbe.best.total,
    savings,
  }
}

// Back-compat alias — prefer birComputeBmbeSavings in new code.
export const computeBmbeSavings = birComputeBmbeSavings
