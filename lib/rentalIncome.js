import { RATES } from './taxConfig'
import { birCompareRoutes } from './freelancerTax'

// Rental is business income: same 8% vs graduated+OSD/itemized choice (RR 13-2018).
export function birComputeRentalRoutes({ grossRentals, itemizedExpenses = 0 }) {
  return birCompareRoutes({
    grossReceipts: grossRentals,
    itemizedExpenses,
    isMixedIncomeEarner: false,
  })
}

// Back-compat alias — prefer birComputeRentalRoutes in new code.
export const computeRentalRoutes = birComputeRentalRoutes

// Residential units at ₱15k/mo or less per unit are percentage-tax exempt (NIRC Sec. 109).
export function residentialPercentageTaxExempt(monthlyRentPerUnit) {
  return monthlyRentPerUnit != null && monthlyRentPerUnit > 0 && monthlyRentPerUnit <= RATES.RESIDENTIAL_RENT_PCT_TAX_EXEMPT
}
