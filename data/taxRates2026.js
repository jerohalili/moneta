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

// --- Payroll contributions (2026 schedules) ---
// SSS: RA 11199 (Social Security Act of 2018), final scheduled rate step
// reached Jan 2025 and unchanged for 2026 (verified via multiple 2026
// payroll-guide sources, Aug 2026 — sss.gov.ph doesn't publish a
// machine-readable table, so cross-check there if this is stale).
export const SSS_RATE = 0.15 // total; split 5% employee / 10% employer
export const SSS_EMPLOYEE_SHARE = 0.05
export const SSS_EMPLOYER_SHARE = 0.10
export const SSS_MIN_MSC = 5_000
export const SSS_MAX_MSC = 35_000
export const SSS_MSC_STEP = 500
export const SSS_EC_LOW = 10 // employer-only Employees' Compensation premium, MSC ≤ threshold
export const SSS_EC_HIGH = 30 // MSC above threshold
export const SSS_EC_THRESHOLD = 14_500

// PhilHealth: 5% of monthly basic salary under the UHC Law (RA 11223)
// schedule, split evenly. Floor/ceiling per 2026 payroll guides.
export const PHILHEALTH_RATE = 0.05
export const PHILHEALTH_FLOOR = 10_000
export const PHILHEALTH_CEILING = 100_000

// Pag-IBIG (HDMF): 2% employee + 2% employer, capped at this monthly
// compensation ceiling (so max ₱200 each side).
export const PAGIBIG_RATE = 0.02
export const PAGIBIG_CEILING = 10_000

// 13th-month pay: tax-exempt up to this amount (NIRC Sec. 32(B)(7)(e), as
// amended by TRAIN); excess is taxable compensation.
export const THIRTEENTH_MONTH_EXEMPTION = 90_000

// --- Property & transfer taxes (TRAIN Law flat rates) ---
export const CAPITAL_GAINS_TAX_RATE = 0.06 // real property classified as a capital asset, NIRC Sec. 24(D)
export const DOCUMENTARY_STAMP_TAX_RATE = 0.015 // real property conveyances, NIRC Sec. 196
export const ESTATE_TAX_RATE = 0.06 // flat, NIRC Sec. 84 as amended by TRAIN
export const ESTATE_STANDARD_DEDUCTION = 5_000_000
export const ESTATE_FAMILY_HOME_DEDUCTION_CAP = 10_000_000
export const DONORS_TAX_RATE = 0.06 // flat, NIRC Sec. 99 as amended by TRAIN
export const DONORS_TAX_EXEMPTION = 250_000 // per calendar year, cumulative across donations

// --- BIR penalties (NIRC Secs. 248–249, as amended) ---
export const SURCHARGE_RATE = 0.25 // ordinary late filing/payment
export const SURCHARGE_RATE_FRAUD = 0.50 // willful neglect or fraud — never reduced for micro/small
export const INTEREST_RATE = 0.12 // per annum, Sec. 249
// Ease of Paying Taxes Act (RA 11976) + RR 6-2024: reduced rates for
// taxpayers classified as Micro or Small under the Act.
export const SURCHARGE_RATE_MICRO_SMALL = 0.10
export const INTEREST_RATE_MICRO_SMALL = 0.06
export const COMPROMISE_DISCOUNT_MICRO_SMALL = 0.5

// Compromise penalty schedule (NIRC Sec. 275, RMO 7-2015 Annex A). BIR
// source tables are inconsistent across violation types and several
// secondary sources disagree on exact bracket boundaries — treat this as
// a representative estimate, not the exact figure your RDO will assess.
// Compromise amounts are also technically "suggested" and negotiated, not
// strictly fixed (RMO 7-2015 itself says so).
export const COMPROMISE_PENALTY_BRACKETS = [
  { upTo: 5_000, amount: 1_000 },
  { upTo: 20_000, amount: 3_000 },
  { upTo: 50_000, amount: 5_000 },
  { upTo: 100_000, amount: 10_000 },
  { upTo: 500_000, amount: 15_000 },
  { upTo: 1_000_000, amount: 20_000 },
  { upTo: Infinity, amount: 25_000 },
]
