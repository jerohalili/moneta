import { RATES } from './taxConfig'
import { compareRoutes } from './freelancerTax'

/**
 * Rental income is business income for BIR purposes, so an individual
 * lessor faces the SAME route choice as a freelancer: the 8% flat rate on
 * gross rentals (if eligible) vs. the graduated table with either the 40%
 * OSD or itemized rental expenses — plus percentage tax on the graduated
 * routes (RR 13-2018 extends the 8% election explicitly to rental
 * income).
 *
 * Delegates to the exact same route comparison the Freelancer calculator
 * uses — the label is different, the math isn't.
 */
export function computeRentalRoutes({ grossRentals, itemizedExpenses = 0 }) {
  return compareRoutes({
    grossReceipts: grossRentals,
    itemizedExpenses,
    isMixedIncomeEarner: false,
  })
}

/**
 * Residential units actually rented at ₱15,000/month or less (per unit)
 * are EXEMPT from percentage tax — income tax still applies on that rent
 * (NIRC Sec. 109 as amended; RR 13-2018 §4). This is a per-unit test the
 * route math can't see, so it's surfaced as a note the component shows.
 */
export function residentialPercentageTaxExempt(monthlyRentPerUnit) {
  return monthlyRentPerUnit != null && monthlyRentPerUnit > 0 && monthlyRentPerUnit <= RATES.RESIDENTIAL_RENT_PCT_TAX_EXEMPT
}
