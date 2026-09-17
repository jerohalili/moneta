import { RATES } from './taxConfig'

// Annual RPT estimate (RA 7160 Secs. 232–235). Rate is statutory ceiling; LGU may set lower.
// Assessed value supplied directly — FMV-to-assessed tables not modeled.
export function birComputeRealPropertyTax({ assessedValue, locationType = 'province' }) {
  const value = Math.max(0, assessedValue)
  const baseRate = locationType === 'city' ? RATES.RPT_RATE_CITY_METRO_MANILA : RATES.RPT_RATE_PROVINCE
  const basicTax = value * baseRate
  const sefTax = value * RATES.RPT_SEF_RATE
  return { baseRate, basicTax, sefTax, total: basicTax + sefTax, quarterly: (basicTax + sefTax) / 4 }
}

// Back-compat alias — prefer birComputeRealPropertyTax in new code.
export const computeRealPropertyTax = birComputeRealPropertyTax
