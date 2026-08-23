import { RPT_RATE_PROVINCE, RPT_RATE_CITY_METRO_MANILA, RPT_SEF_RATE } from '@/data/taxRates2026'

/**
 * Annual real property tax estimate (Local Government Code, RA 7160,
 * Secs. 232–235). `locationType` selects the statutory ceiling rate —
 * these are maximums; an LGU ordinance may (and often does) set a lower
 * actual rate, so treat this as an upper-bound estimate, not a bill.
 * Assessed value must be supplied directly — computing it from fair
 * market value requires property-type-specific assessment level tables
 * this tool doesn't model.
 */
export function computeRealPropertyTax({ assessedValue, locationType = 'province' }) {
  const value = Math.max(0, assessedValue)
  const baseRate = locationType === 'city' ? RPT_RATE_CITY_METRO_MANILA : RPT_RATE_PROVINCE
  const basicTax = value * baseRate
  const sefTax = value * RPT_SEF_RATE
  return { baseRate, basicTax, sefTax, total: basicTax + sefTax, quarterly: (basicTax + sefTax) / 4 }
}
