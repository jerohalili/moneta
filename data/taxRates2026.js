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

// --- Corporate income tax (CREATE Act, RA 11534) ---
export const CORPORATE_TAX_RATE_STANDARD = 0.25
export const CORPORATE_TAX_RATE_SMALL = 0.20 // net taxable income ≤5M AND total assets ≤100M (excl. land)
export const CORPORATE_SMALL_INCOME_CEILING = 5_000_000
export const CORPORATE_SMALL_ASSET_CEILING = 100_000_000
export const MCIT_RATE = 0.02 // of gross income, from the 4th taxable year of operations onward

// --- BMBE (Barangay Micro Business Enterprise, RA 9178) ---
export const BMBE_ASSET_CEILING = 3_000_000 // excluding land

// --- VAT & Percentage Tax context ---
// (VAT_RATE, VAT_THRESHOLD, PERCENTAGE_TAX_RATE already defined above)

// --- Expanded Withholding Tax (EWT), RR 2-98 as amended by RR 11-2018 ---
export const EWT_PROFESSIONAL_INDIVIDUAL_LOW = 0.05 // payee's annual gross income ≤ ₱3M, with sworn declaration
export const EWT_PROFESSIONAL_INDIVIDUAL_HIGH = 0.10
export const EWT_PROFESSIONAL_INDIVIDUAL_THRESHOLD = 3_000_000
export const EWT_PROFESSIONAL_CORPORATE_LOW = 0.10 // payee's annual gross income ≤ ₱720k
export const EWT_PROFESSIONAL_CORPORATE_HIGH = 0.15
export const EWT_PROFESSIONAL_CORPORATE_THRESHOLD = 720_000
export const EWT_RENTAL_RATE = 0.05
export const EWT_CONTRACTOR_RATE = 0.02
export const EWT_GOVT_GOODS_RATE = 0.01 // government money payments, goods
export const EWT_GOVT_SERVICES_RATE = 0.02 // government money payments, services
export const EWT_TOP_AGENT_GOODS_RATE = 0.01
export const EWT_TOP_AGENT_SERVICES_RATE = 0.02

// --- Real Property Tax (Local Government Code, RA 7160) ---
// Statutory ceilings — an LGU ordinance may (and often does) set a lower
// actual rate, so these are upper bounds, not universal figures.
export const RPT_RATE_PROVINCE = 0.01
export const RPT_RATE_CITY_METRO_MANILA = 0.02
export const RPT_SEF_RATE = 0.01 // Special Education Fund, added on top, all LGUs

// --- Documentary stamp tax, other instrument types (NIRC Title VII) ---
export const DST_LOAN_RATE_PER_200 = 1.50 // per ₱200 (or fraction) of the loan/debt instrument's face value
export const DST_LEASE_RATE_FIRST_2000 = 6 // flat, first ₱2,000 of the lease term's total contract price
export const DST_LEASE_RATE_PER_1000_EXCESS = 2 // per ₱1,000 (or fraction) thereafter

// --- Overtime & premium pay (Labor Code, as amended; DOLE) ---
export const OT_REGULAR_MULTIPLIER = 1.25 // ordinary OT, on top of the hourly rate
export const OT_REST_DAY_MULTIPLIER = 1.30
export const OT_REST_DAY_OT_MULTIPLIER = 1.30 * 1.30
export const OT_SPECIAL_HOLIDAY_MULTIPLIER = 1.30
export const OT_SPECIAL_HOLIDAY_OT_MULTIPLIER = 1.30 * 1.30
export const OT_REGULAR_HOLIDAY_MULTIPLIER = 2.00
export const OT_REGULAR_HOLIDAY_OT_MULTIPLIER = 2.00 * 1.30
export const NIGHT_DIFFERENTIAL_MULTIPLIER = 0.10 // additional, for hours worked 10PM–6AM

// --- Passive income final taxes (withheld at source, NIRC Secs. 24(B)(1),
// 27(D)(1), 57(A)) — these never enter the annual graduated return ---
export const FINAL_TAX_INTEREST_RATE = 0.20 // peso bank deposits, deposit substitutes, trust funds
export const FINAL_TAX_FC_INTEREST_RATE = 0.15 // foreign-currency deposits under the FCDU system, RA 6426
export const FINAL_TAX_DIVIDEND_RATE = 0.10 // cash/property dividends from domestic corporations
export const FINAL_TAX_ROYALTY_RATE = 0.20 // royalties, general
export const FINAL_TAX_ROYALTY_BOOKS_RATE = 0.10 // royalties from books, literary works, lectures (Sec. 24(B)(1)(b))
export const FINAL_TAX_CGT_SHARES_RATE = 0.15 // capital gains on shares NOT traded on the stock exchange
export const STOCK_TRANSACTION_TAX_RATE = 0.006 // shares traded on the stock exchange, on gross selling price
export const FINAL_TAX_PRIZES_RATE = 0.20 // prizes & winnings above the per-occasion exemption
export const FINAL_TAX_PRIZES_EXEMPTION = 10_000 // per occasion

// Residential units rented at or below this monthly amount per unit are
// exempt from PERCENTAGE tax (income tax still applies) — NIRC Sec. 109
// as amended, RR 13-2018.
export const RESIDENTIAL_RENT_PCT_TAX_EXEMPT = 15_000
