/**
 * Philippine BIR tax figures — Tax Year 2026.
 *
 * Legal basis: TRAIN Law (RA 10963), effective brackets since Jan 1, 2023.
 * These have not changed for 2026. Percentage tax reverted to its
 * statutory 3% rate (NIRC Sec. 116) after the temporary 1% CREATE Act
 * relief expired June 30, 2023.
 *
 * IMPORTANT: If you're revisiting this file in a future tax year, verify
 * these figures against bir.gov.ph or a recent BIR Revenue Regulation
 * before trusting them — do not assume they're still current.
 *
 * Sources checked Aug 2026:
 * - https://quickbooks.intuit.com/ph/tax-brackets-and-tax-tables/
 * - https://www.taxumo.com/blog/bir-tax-table-2026/
 */

// Graduated income tax brackets (annual taxable income, in PHP).
// Structure: income above `over` up to `upTo` is taxed at `rate`,
// with `base` being the cumulative tax owed on all lower brackets.
export const GRADUATED_BRACKETS = [
  { over: 0, upTo: 250_000, base: 0, rate: 0 },
  { over: 250_000, upTo: 400_000, base: 0, rate: 0.15 },
  { over: 400_000, upTo: 800_000, base: 22_500, rate: 0.20 },
  { over: 800_000, upTo: 2_000_000, base: 102_500, rate: 0.25 },
  { over: 2_000_000, upTo: 8_000_000, base: 402_500, rate: 0.30 },
  { over: 8_000_000, upTo: Infinity, base: 2_202_500, rate: 0.35 },
]

// Self-employed / professional 8% flat-tax option (NIRC Sec. 24(A)(2)(b)).
export const EIGHT_PERCENT_RATE = 0.08
export const EIGHT_PERCENT_EXEMPTION = 250_000 // first ₱250,000 of gross is untaxed
export const EIGHT_PERCENT_ELIGIBILITY_CEILING = 3_000_000 // must stay non-VAT to qualify

// Percentage tax under the graduated route (NIRC Sec. 116), applies to
// non-VAT-registered self-employed individuals who did NOT elect 8%.
export const PERCENTAGE_TAX_RATE = 0.03

// Optional Standard Deduction — flat deduction in lieu of itemizing
// actual business expenses (NIRC Sec. 34(L)).
export const OSD_RATE = 0.40

// VAT registration threshold — gross sales/receipts above this force
// VAT registration and disqualify the 8% option entirely.
export const VAT_THRESHOLD = 3_000_000
export const VAT_RATE = 0.12
