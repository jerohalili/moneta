import { loadJSON, saveJSON, removeJSON } from './localStore'
import * as DEFAULTS from '@/data/taxRates2026'

/**
 * The live rate layer.
 *
 * `data/taxRates2026.js` holds the COMPILED defaults (verified figures for
 * tax year 2026). This module wraps them in a mutable `RATES` object that
 * every calculator reads at call time, plus a localStorage-backed override
 * store. When the government changes a rate, the user edits it here —
 * no redeploy needed.
 *
 * HYDRATION CONTRACT: `RATES` starts as an exact copy of the defaults so
 * server rendering and the client's first paint always agree. Stored
 * overrides are applied AFTER mount (components/TaxConfigSync.js calls
 * applyStoredOverrides()), which fires notifications that subscribed
 * hooks (useTaxRatesVersion) listen to and re-render from. Never read
 * localStorage during initial render — same rule the theme toggle follows.
 */

export const RATES = { ...DEFAULTS }

const STORAGE_KEY = 'rate-overrides'

// ------------------------------------------------------------------
// Registry — what's editable, and how to talk about it.
// `unit`: 'currency' | 'percent' (stored as a fraction) | 'multiplier'
//         | 'number'. Tables carry `columns` instead.
// Descriptions are written to teach, not just to label: this UI doubles
// as the documentation for what each figure legally does.
// ------------------------------------------------------------------

export const RATE_GROUPS = [
  {
    id: 'income-tax',
    label: 'Income Tax',
    description:
      'The graduated bracket table and the self-employed flat-rate alternative. These drive every personal income-tax number in the app.',
  },
  {
    id: 'vat',
    label: 'VAT',
    description:
      'Registration threshold and the VAT rate itself. Crossing the threshold changes which routes a taxpayer qualifies for.',
  },
  {
    id: 'contributions',
    label: 'Contributions & Benefits',
    description:
      'SSS, PhilHealth, Pag-IBIG schedules and the 13th-month exemption. Contribution figures change almost yearly — this is the group to check first each January.',
  },
  {
    id: 'corporate',
    label: 'Corporate & BMBE',
    description:
      'CREATE Act corporate rates and the Barangay Micro Business Enterprise asset ceiling.',
  },
  {
    id: 'ewt',
    label: 'Withholding Tax (EWT)',
    description:
      'Expanded withholding tax rates withheld on payments to professionals, contractors, landlords, and government suppliers.',
  },
  {
    id: 'property',
    label: 'Property & Transfer Taxes',
    description:
      'Capital gains, documentary stamp, estate, donor’s, and real property taxes.',
  },
  {
    id: 'penalties',
    label: 'Penalties',
    description:
      'Surcharge, interest, and compromise-penalty figures for late filing/payment.',
  },
  {
    id: 'overtime',
    label: 'Overtime & Premium Pay',
    description:
      'Labor Code multipliers for overtime, rest days, holidays, and night differential.',
  },
  {
    id: 'passive',
    label: 'Passive Income & Final Taxes',
    description:
      'Final withholding taxes on interest, dividends, royalties, share gains, and prizes — withheld at source, so they never enter the annual graduated return. These rates are set by the NIRC and rarely move.',
  },
]

export const RATE_REGISTRY = [
  // --- Passive income final taxes ---
  {
    key: 'FINAL_TAX_INTEREST_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — interest (peso deposits)',
    description:
      'Withheld by the bank on interest from peso bank deposits, deposit substitutes, and trust funds (NIRC Sec. 24(B)(1)). Final — you never file it; the bank remits it for you.',
  },
  {
    key: 'FINAL_TAX_FC_INTEREST_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — interest (foreign currency deposits)',
    description:
      'Interest on foreign-currency deposits under the FCDU system, per RA 6426 as amended. Offshore/dollar accounts outside the FCDU system may be treated differently — check with your bank.',
  },
  {
    key: 'FINAL_TAX_DIVIDEND_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — dividends from domestic corporations',
    description:
      'Withheld by the corporation before the dividend reaches you (NIRC Sec. 24(B)(1)(a)). Dividends from foreign corporations are generally NOT this rate — they may be part of regular income.',
  },
  {
    key: 'FINAL_TAX_ROYALTY_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — royalties (general)',
    description:
      'Royalties from patents, copyrights (other than books), mining claims, franchise grants, and similar (NIRC Sec. 24(B)(1)).',
  },
  {
    key: 'FINAL_TAX_ROYALTY_BOOKS_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — royalties (books, lectures)',
    description:
      'The reduced rate for royalties from books, literary works, and musical compositions, and for lectures (NIRC Sec. 24(B)(1)(b)).',
  },
  {
    key: 'FINAL_TAX_CGT_SHARES_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — capital gains on unlisted shares',
    description:
      'Tax on the GAIN from selling shares of stock not traded on the stock exchange (NIRC Sec. 24(C)). Shares traded on the PSE instead pay the stock transaction tax on the gross.',
  },
  {
    key: 'STOCK_TRANSACTION_TAX_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Stock transaction tax (PSE-traded shares)',
    description:
      'Levied on the GROSS selling price of shares traded through the local stock exchange — no gain computation, no exemption threshold (NIRC Sec. 127(A)).',
  },
  {
    key: 'FINAL_TAX_PRIZES_RATE',
    group: 'passive',
    unit: 'percent',
    label: 'Final tax — prizes & winnings',
    description:
      'Prizes and winnings above the per-occasion exemption are taxed at 20% (NIRC Sec. 24(B)(1)). Amounts at or below the exemption are tax-free; PCSO/jackpot winnings above ₱10,000 are taxed under a separate provision.',
  },
  {
    key: 'FINAL_TAX_PRIZES_EXEMPTION',
    group: 'passive',
    unit: 'currency',
    label: 'Prizes & winnings — per-occasion exemption',
    description:
      'The first ₱10,000 of prizes/winnings per occasion is untaxed; only the excess is subject to the 20% final tax.',
  },
  {
    key: 'RESIDENTIAL_RENT_PCT_TAX_EXEMPT',
    group: 'vat',
    unit: 'currency',
    label: 'Residential rent — monthly percentage-tax exemption',
    description:
      'Residential units with monthly rent at or below this amount (per unit) are exempt from percentage tax — income tax still applies on the rent (NIRC Sec. 109 as amended, RR 13-2018).',
  },
  // --- Income tax ---
  {
    key: 'GRADUATED_BRACKETS',
    group: 'income-tax',
    kind: 'table',
    label: 'Graduated income tax brackets',
    description:
      'Annual taxable income slices. Each row: income OVER the lower bound up to the upper bound is taxed at the rate, after adding the cumulative base tax from all lower brackets. The last row’s upper bound is open-ended (∞). If you edit rates, use “Fix cumulative bases” afterwards so the base column stays consistent.',
    columns: [
      { id: 'over', label: 'Over (₱)', unit: 'currency' },
      { id: 'upTo', label: 'Up to (₱)', unit: 'currency-or-inf' },
      { id: 'base', label: 'Base tax (₱)', unit: 'currency' },
      { id: 'rate', label: 'Rate', unit: 'percent' },
    ],
    fixBases: true,
  },
  {
    key: 'EIGHT_PERCENT_RATE',
    group: 'income-tax',
    unit: 'percent',
    label: '8% flat option rate',
    description:
      'The flat rate a purely self-employed/professional taxpayer can elect INSTEAD of graduated income tax + percentage tax (NIRC Sec. 24(A)(2)(b)). Election happens at registration or at the start of a taxable year.',
  },
  {
    key: 'EIGHT_PERCENT_EXEMPTION',
    group: 'income-tax',
    unit: 'currency',
    label: '8% option — exempt first ₱ of gross',
    description:
      'First ₱250,000 of gross receipts/sales is untaxed under the 8% option — but ONLY for purely self-employed earners. Mixed-income earners don’t get it (RR 8-2018), because their ₱250,000 allowance is already consumed by compensation income.',
  },
  {
    key: 'EIGHT_PERCENT_ELIGIBILITY_CEILING',
    group: 'income-tax',
    unit: 'currency',
    label: '8% option — eligibility ceiling',
    description:
      'Gross receipts/sales above this disqualify the 8% option entirely. Currently aligned with the VAT threshold — if one moves, check whether the other did too.',
  },
  {
    key: 'PERCENTAGE_TAX_RATE',
    group: 'income-tax',
    unit: 'percent',
    label: 'Percentage tax rate',
    description:
      'Tax on gross sales/receipts for non-VAT businesses that did NOT elect the 8% option (NIRC Sec. 116). Reverted to 3% after the temporary CREATE Act relief expired June 30, 2023.',
  },
  {
    key: 'OSD_RATE',
    group: 'income-tax',
    unit: 'percent',
    label: 'Optional Standard Deduction',
    description:
      'Flat deduction from gross sales/receipts in lieu of itemizing actual expenses (NIRC Sec. 34(L)). No receipts/bookkeeping required to claim it.',
  },

  // --- VAT ---
  {
    key: 'VAT_THRESHOLD',
    group: 'vat',
    unit: 'currency',
    label: 'VAT registration threshold',
    description:
      'Gross sales/receipts above this force VAT registration: the 12% VAT replaces percentage tax, and the 8% option disappears for the year.',
  },
  {
    key: 'VAT_RATE',
    group: 'vat',
    unit: 'percent',
    label: 'VAT rate',
    description:
      'Applied to vatable sales (output VAT) and claimable on vatable purchases (input VAT); the net amount is what’s remitted to the BIR.',
  },

  // --- Contributions ---
  {
    key: 'SSS_RATE',
    group: 'contributions',
    unit: 'percent',
    label: 'SSS total contribution rate',
    description:
      'Total contribution on the Monthly Salary Credit (RA 11199). Split between employee and employer shares below. SSS raises this on a published schedule — verify each year.',
  },
  {
    key: 'SSS_EMPLOYEE_SHARE',
    group: 'contributions',
    unit: 'percent',
    label: 'SSS employee share',
    description:
      'Portion of the SSS rate deducted from the employee’s pay. The rest comes from the employer.',
  },
  {
    key: 'SSS_EMPLOYER_SHARE',
    group: 'contributions',
    unit: 'percent',
    label: 'SSS employer share',
    description:
      'Employer-funded portion of the SSS contribution, plus the small EC (Employees’ Compensation) premium below. Doesn’t reduce the employee’s taxable income.',
  },
  {
    key: 'SSS_MIN_MSC',
    group: 'contributions',
    unit: 'currency',
    label: 'SSS minimum Monthly Salary Credit',
    description:
      'Even a ₱1 salary is credited as at least this amount — which is why tiny incomes produce surprisingly large contributions.',
  },
  {
    key: 'SSS_MAX_MSC',
    group: 'contributions',
    unit: 'currency',
    label: 'SSS maximum Monthly Salary Credit',
    description:
      'Salaries above this stop accruing additional SSS contribution — high earners hit this ceiling.',
  },
  {
    key: 'SSS_MSC_STEP',
    group: 'contributions',
    unit: 'currency',
    label: 'SSS MSC rounding step',
    description:
      'The app estimates the MSC by rounding salary to this step inside the min–max band. Official tables publish fixed ranges; this approximates them.',
  },
  {
    key: 'SSS_EC_LOW',
    group: 'contributions',
    unit: 'currency',
    label: 'SSS EC premium (MSC ≤ threshold)',
    description:
      'Fixed employer-only Employees’ Compensation premium for lower salary credits.',
  },
  {
    key: 'SSS_EC_HIGH',
    group: 'contributions',
    unit: 'currency',
    label: 'SSS EC premium (MSC > threshold)',
    description:
      'Fixed employer-only Employees’ Compensation premium above the EC threshold.',
  },
  {
    key: 'SSS_EC_THRESHOLD',
    group: 'contributions',
    unit: 'currency',
    label: 'SSS EC threshold',
    description:
      'Monthly Salary Credit at which the EC premium steps from the low to the high amount.',
  },
  {
    key: 'PHILHEALTH_RATE',
    group: 'contributions',
    unit: 'percent',
    label: 'PhilHealth premium rate',
    description:
      'Premium on monthly basic salary under the UHC Law (RA 11223), split evenly between employee and employer.',
  },
  {
    key: 'PHILHEALTH_FLOOR',
    group: 'contributions',
    unit: 'currency',
    label: 'PhilHealth salary floor',
    description:
      'Minimum salary the premium rate applies to — another reason very low incomes still generate real contributions.',
  },
  {
    key: 'PHILHEALTH_CEILING',
    group: 'contributions',
    unit: 'currency',
    label: 'PhilHealth salary ceiling',
    description:
      'Maximum salary the premium rate applies to.',
  },
  {
    key: 'PAGIBIG_RATE',
    group: 'contributions',
    unit: 'percent',
    label: 'Pag-IBIG rate',
    description:
      'Employee and employer each contribute this rate on monthly compensation, up to the ceiling.',
  },
  {
    key: 'PAGIBIG_CEILING',
    group: 'contributions',
    unit: 'currency',
    label: 'Pag-IBIG compensation ceiling',
    description:
      'Compensation above this stops accruing additional Pag-IBIG contribution.',
  },
  {
    key: 'THIRTEENTH_MONTH_EXEMPTION',
    group: 'contributions',
    unit: 'currency',
    label: '13th-month & bonuses exemption',
    description:
      '13th-month pay PLUS other similar benefits (bonuses) up to this total are tax-exempt (NIRC Sec. 32(B)(7)(e)). Keeping bonuses inside this envelope is legal tax planning.',
  },

  // --- Corporate ---
  {
    key: 'CORPORATE_TAX_RATE_STANDARD',
    group: 'corporate',
    unit: 'percent',
    label: 'Corporate RCIT — standard rate',
    description:
      'Regular Corporate Income Tax on net taxable income (CREATE Act, RA 11534).',
  },
  {
    key: 'CORPORATE_TAX_RATE_SMALL',
    group: 'corporate',
    unit: 'percent',
    label: 'Corporate RCIT — small business rate',
    description:
      'Reduced rate if BOTH tests below pass (net income ceiling AND asset ceiling, excluding land).',
  },
  {
    key: 'CORPORATE_SMALL_INCOME_CEILING',
    group: 'corporate',
    unit: 'currency',
    label: 'Small-corp net income ceiling',
    description: 'Net taxable income at or below this qualifies for the reduced rate.',
  },
  {
    key: 'CORPORATE_SMALL_ASSET_CEILING',
    group: 'corporate',
    unit: 'currency',
    label: 'Small-corp total assets ceiling',
    description: 'Total assets (excluding land) at or below this qualifies for the reduced rate.',
  },
  {
    key: 'MCIT_RATE',
    group: 'corporate',
    unit: 'percent',
    label: 'MCIT rate',
    description:
      'Minimum Corporate Income Tax on GROSS income, from the 4th taxable year onward. The corporation pays whichever is higher: RCIT or MCIT.',
  },
  {
    key: 'BMBE_ASSET_CEILING',
    group: 'corporate',
    unit: 'currency',
    label: 'BMBE asset ceiling',
    description:
      'A registered Barangay Micro Business Enterprise with total assets (excluding land) at or below this is 100% exempt from INCOME tax on operating income (RA 9178). Percentage/VAT tax still applies.',
  },

  // --- EWT ---
  {
    key: 'EWT_PROFESSIONAL_INDIVIDUAL_LOW',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — professional, individual, low tier',
    description:
      'Withheld on professional fees paid to individuals whose annual gross income is at or below the threshold below (needs a sworn declaration).',
  },
  {
    key: 'EWT_PROFESSIONAL_INDIVIDUAL_HIGH',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — professional, individual, high tier',
    description: 'Rate above the individual income threshold.',
  },
  {
    key: 'EWT_PROFESSIONAL_INDIVIDUAL_THRESHOLD',
    group: 'ewt',
    unit: 'currency',
    label: 'EWT — individual professional income threshold',
    description: 'Payee annual gross income dividing the two tiers.',
  },
  {
    key: 'EWT_PROFESSIONAL_CORPORATE_LOW',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — professional, corporate, low tier',
    description: 'Withheld on professional fees paid to corporations below the threshold.',
  },
  {
    key: 'EWT_PROFESSIONAL_CORPORATE_HIGH',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — professional, corporate, high tier',
    description: 'Rate above the corporate income threshold.',
  },
  {
    key: 'EWT_PROFESSIONAL_CORPORATE_THRESHOLD',
    group: 'ewt',
    unit: 'currency',
    label: 'EWT — corporate professional income threshold',
    description: 'Payee annual gross income dividing the two corporate tiers.',
  },
  {
    key: 'EWT_RENTAL_RATE',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — rental',
    description: 'Withheld on rental payments (real or personal property).',
  },
  {
    key: 'EWT_CONTRACTOR_RATE',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — contractors',
    description: 'Withheld on payments to contractors/sub-contractors.',
  },
  {
    key: 'EWT_GOVT_GOODS_RATE',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — government goods',
    description: 'Withheld on government money payments for goods.',
  },
  {
    key: 'EWT_GOVT_SERVICES_RATE',
    group: 'ewt',
    unit: 'percent',
    label: 'EWT — government services',
    description: 'Withheld on government money payments for services.',
  },

  // --- Property ---
  {
    key: 'CAPITAL_GAINS_TAX_RATE',
    group: 'property',
    unit: 'percent',
    label: 'Capital gains tax (raw land/house sale)',
    description:
      'Flat rate on the HIGHER of selling price, zonal value, or fair market value when selling capital-asset real property (NIRC Sec. 24(D)).',
  },
  {
    key: 'DOCUMENTARY_STAMP_TAX_RATE',
    group: 'property',
    unit: 'percent',
    label: 'Documentary stamp tax (conveyance)',
    description: 'Stamp tax on the same base as CGT for the deed of sale (NIRC Sec. 196).',
  },
  {
    key: 'ESTATE_TAX_RATE',
    group: 'property',
    unit: 'percent',
    label: 'Estate tax rate',
    description: 'Flat rate on the NET estate after deductions (TRAIN-amended NIRC Sec. 84).',
  },
  {
    key: 'ESTATE_STANDARD_DEDUCTION',
    group: 'property',
    unit: 'currency',
    label: 'Estate standard deduction',
    description: 'Automatic deduction from the gross estate before computing tax.',
  },
  {
    key: 'ESTATE_FAMILY_HOME_DEDUCTION_CAP',
    group: 'property',
    unit: 'currency',
    label: 'Estate family-home deduction cap',
    description: 'Maximum deductible value of the family home, on top of the standard deduction.',
  },
  {
    key: 'DONORS_TAX_RATE',
    group: 'property',
    unit: 'percent',
    label: 'Donor’s tax rate',
    description: 'Flat rate on net gifts above the yearly exemption (TRAIN-amended NIRC Sec. 99).',
  },
  {
    key: 'DONORS_TAX_EXEMPTION',
    group: 'property',
    unit: 'currency',
    label: 'Donor’s tax yearly exemption',
    description:
      'Cumulative per calendar year across ALL donations — not per gift. Spreading large gifts across years uses multiple exemptions.',
  },
  {
    key: 'RPT_RATE_PROVINCE',
    group: 'property',
    unit: 'percent',
    label: 'Real property tax — province ceiling',
    description:
      'Statutory CEILING for provinces; LGU ordinances often set less. Treat results as upper bounds.',
  },
  {
    key: 'RPT_RATE_CITY_METRO_MANILA',
    group: 'property',
    unit: 'percent',
    label: 'Real property tax — city/Metro Manila ceiling',
    description: 'Same ceiling concept for cities and Metro Manila municipalities.',
  },
  {
    key: 'RPT_SEF_RATE',
    group: 'property',
    unit: 'percent',
    label: 'Special Education Fund rate',
    description: 'Added on top of basic RPT in every LGU.',
  },
  {
    key: 'DST_LOAN_RATE_PER_200',
    group: 'property',
    unit: 'number',
    label: 'DST — loan instruments (₱ per ₱200)',
    description: 'Documentary stamp on loan agreements: this peso amount per ₱200 or fraction of face value.',
  },
  {
    key: 'DST_LEASE_RATE_FIRST_2000',
    group: 'property',
    unit: 'number',
    label: 'DST — lease, first ₱2,000 (₱)',
    description: 'Flat stamp amount on the first ₱2,000 of the lease contract price.',
  },
  {
    key: 'DST_LEASE_RATE_PER_1000_EXCESS',
    group: 'property',
    unit: 'number',
    label: 'DST — lease, per ₱1,000 excess (₱)',
    description: 'Stamp amount per ₱1,000 or fraction beyond the first tranche.',
  },

  // --- Penalties ---
  {
    key: 'SURCHARGE_RATE',
    group: 'penalties',
    unit: 'percent',
    label: 'Surcharge — ordinary late filing/payment',
    description: 'Added on top of the unpaid tax (NIRC Sec. 248).',
  },
  {
    key: 'SURCHARGE_RATE_FRAUD',
    group: 'penalties',
    unit: 'percent',
    label: 'Surcharge — willful neglect/fraud',
    description:
      'Much heavier surcharge for willful cases. Never reduced by micro/small classification.',
  },
  {
    key: 'INTEREST_RATE',
    group: 'penalties',
    unit: 'percent',
    label: 'Interest on delinquency (per annum)',
    description: 'Accrues daily on the unpaid tax until fully paid (NIRC Sec. 249).',
  },
  {
    key: 'SURCHARGE_RATE_MICRO_SMALL',
    group: 'penalties',
    unit: 'percent',
    label: 'Surcharge — micro/small taxpayers',
    description:
      'Reduced surcharge under the Ease of Paying Taxes Act (RA 11976) + RR 6-2024.',
  },
  {
    key: 'INTEREST_RATE_MICRO_SMALL',
    group: 'penalties',
    unit: 'percent',
    label: 'Interest — micro/small taxpayers',
    description: 'Reduced interest rate for micro/small classification.',
  },
  {
    key: 'COMPROMISE_DISCOUNT_MICRO_SMALL',
    group: 'penalties',
    unit: 'percent',
    label: 'Compromise discount — micro/small',
    description: 'Fraction by which the compromise penalty is discounted for micro/small taxpayers.',
  },
  {
    key: 'COMPROMISE_PENALTY_BRACKETS',
    group: 'penalties',
    kind: 'table',
    label: 'Compromise penalty schedule',
    description:
      'Fixed compromise amounts by size of the unpaid tax (RMO 7-2015 Annex A). BIR source tables disagree across violation types — treat as representative. Last row’s bound is open-ended (∞).',
    columns: [
      { id: 'upTo', label: 'Basic tax up to (₱)', unit: 'currency-or-inf' },
      { id: 'amount', label: 'Compromise (₱)', unit: 'currency' },
    ],
    fixBases: false,
  },

  // --- Overtime ---
  {
    key: 'OT_REGULAR_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Overtime — ordinary day',
    description: 'Hourly-rate multiplier for work beyond 8 hours on a normal day.',
  },
  {
    key: 'OT_REST_DAY_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Rest day (within 8 hrs)',
    description: 'Multiplier for work on a scheduled rest day.',
  },
  {
    key: 'OT_REST_DAY_OT_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Overtime on a rest day',
    description: 'Rest-day rate compounded again for hours beyond 8.',
  },
  {
    key: 'OT_SPECIAL_HOLIDAY_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Special holiday (within 8 hrs)',
    description: 'Multiplier for special non-working holidays.',
  },
  {
    key: 'OT_SPECIAL_HOLIDAY_OT_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Overtime on a special holiday',
    description: 'Special-holiday rate compounded for hours beyond 8.',
  },
  {
    key: 'OT_REGULAR_HOLIDAY_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Regular holiday (within 8 hrs)',
    description: 'Multiplier for regular holidays — double pay for the day itself.',
  },
  {
    key: 'OT_REGULAR_HOLIDAY_OT_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Overtime on a regular holiday',
    description: 'Regular-holiday rate compounded for hours beyond 8.',
  },
  {
    key: 'NIGHT_DIFFERENTIAL_MULTIPLIER',
    group: 'overtime',
    unit: 'multiplier',
    label: 'Night differential add-on',
    description:
      'Additional fraction of the hourly rate for hours worked 10PM–6AM (Labor Code Art. 86). Stacks additively on any category above.',
  },
]

const REGISTRY_BY_KEY = Object.fromEntries(RATE_REGISTRY.map((e) => [e.key, e]))

// ------------------------------------------------------------------
// Persistence + live application
// ------------------------------------------------------------------

// Tables are arrays of flat numeric objects whose values can include
// Infinity (open-ended brackets). Spread-copying preserves Infinity,
// which a JSON round-trip would silently destroy (it becomes null).
function clone(value) {
  if (Array.isArray(value)) return value.map((row) => ({ ...row }))
  return value
}

function clampNumber(entry, n) {
  const min = typeof entry.min === 'number' ? entry.min : 0
  const max = typeof entry.max === 'number' ? entry.max : Infinity
  return Math.min(max, Math.max(min, n))
}

/** Validates one override value against its registry entry. Returns the
 * sanitized value, or null if unusable. */
function sanitizeOverride(entry, value) {
  if (!entry) return null
  if (entry.kind === 'table') {
    if (!Array.isArray(value) || value.length === 0) return null
    const rows = []
    for (const row of value) {
      if (!row || typeof row !== 'object') return null
      const clean = {}
      for (const col of entry.columns) {
        if (col.unit === 'currency-or-inf') {
          clean[col.id] =
            row[col.id] === Infinity || row[col.id] === null || row[col.id] === '' || row[col.id] === 'Infinity'
              ? Infinity
              : nonNegative(row[col.id])
        } else {
          clean[col.id] = nonNegative(row[col.id])
        }
        // Infinity is a LEGAL value here — it marks an open-ended final
        // bracket — everything else must be a real number.
        if (!Number.isFinite(clean[col.id]) && clean[col.id] !== Infinity) return null
      }
      rows.push(clean)
    }
    return rows
  }
  const n = Number(value)
  if (!Number.isFinite(n)) return null
  return clampNumber(entry, n)
}

function nonNegative(raw) {
  const n = Number(raw)
  return Number.isFinite(n) ? Math.max(0, n) : NaN
}

export function getStoredOverrides() {
  const saved = loadJSON(STORAGE_KEY, {})
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {}
}

function persist(overrides) {
  if (Object.keys(overrides).length === 0) removeJSON(STORAGE_KEY)
  else saveJSON(STORAGE_KEY, overrides)
}

const listeners = new Set()

/** Subscribe to live rate changes. Returns an unsubscribe function. */
export function subscribeToRates(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notifyRatesChanged() {
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      // A broken listener must never break the others.
    }
  }
}

/** Reads stored overrides and mutates RATES accordingly. Called ONCE,
 * after mount, by components/TaxConfigSync.js — never during render.
 * Returns how many overrides were applied. */
export function applyStoredOverrides() {
  const overrides = getStoredOverrides()
  let applied = 0
  for (const entry of RATE_REGISTRY) {
    if (Object.prototype.hasOwnProperty.call(overrides, entry.key)) {
      const clean = sanitizeOverride(entry, overrides[entry.key])
      if (clean !== null) {
        RATES[entry.key] = clean
        applied += 1
        continue
      }
    }
    RATES[entry.key] = clone(DEFAULTS[entry.key])
  }
  if (applied > 0) notifyRatesChanged()
  return applied
}

/** Sets (or updates) a single override and pushes it into RATES live. */
export function setRateOverride(key, value) {
  const entry = REGISTRY_BY_KEY[key]
  if (!entry) throw new Error(`Unknown rate key: ${key}`)
  const clean = sanitizeOverride(entry, value)
  if (clean === null) throw new Error(`Invalid value for ${key}`)
  const overrides = getStoredOverrides()
  overrides[key] = clean
  persist(overrides)
  RATES[key] = clone(clean)
  notifyRatesChanged()
}

/** Removes one override, restoring the compiled default for that key. */
export function resetRate(key) {
  if (!REGISTRY_BY_KEY[key]) return
  const overrides = getStoredOverrides()
  delete overrides[key]
  persist(overrides)
  RATES[key] = clone(DEFAULTS[key])
  notifyRatesChanged()
}

/** Clears every override — back to the compiled defaults. */
export function resetAllRates() {
  persist({})
  for (const entry of RATE_REGISTRY) {
    RATES[entry.key] = clone(DEFAULTS[entry.key])
  }
  notifyRatesChanged()
}

/** Serializes the current overrides for sharing/backing up. */
export function exportOverrides() {
  return JSON.stringify(
    {
      _format: 'moneta-rate-overrides',
      _exportedAt: new Date().toISOString(),
      overrides: getStoredOverrides(),
    },
    null,
    2
  )
}

/** Parses an exported config (or a bare {key: value} object). Returns
 * { ok: true, applied } or { ok: false, error }. Only keys present in the
 * registry are accepted — anything else is reported, never silently
 * ignored, since importing a stale/mismatched file should be loud. */
export function importOverrides(jsonText) {
  let parsed
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return { ok: false, error: 'That file isn’t valid JSON.' }
  }

  const incoming =
    parsed && typeof parsed === 'object' && parsed.overrides && typeof parsed.overrides === 'object'
      ? parsed.overrides
      : parsed

  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return { ok: false, error: 'Expected an object mapping rate keys to values.' }
  }

  const unknown = Object.keys(incoming).filter((k) => k.startsWith('_') === false && !REGISTRY_BY_KEY[k])
  if (unknown.length > 0) {
    return {
      ok: false,
      error: `Unrecognized rate key${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}. This file may target a different app version.`,
    }
  }

  const sanitized = {}
  const invalid = []
  for (const [key, value] of Object.entries(incoming)) {
    if (key.startsWith('_')) continue
    const clean = sanitizeOverride(REGISTRY_BY_KEY[key], value)
    if (clean === null) invalid.push(key)
    else sanitized[key] = clean
  }
  if (invalid.length > 0) {
    return { ok: false, error: `Invalid value${invalid.length > 1 ? 's' : ''} for: ${invalid.join(', ')}.` }
  }

  persist(sanitized)
  for (const entry of RATE_REGISTRY) {
    RATES[entry.key] = Object.prototype.hasOwnProperty.call(sanitized, entry.key)
      ? clone(sanitized[entry.key])
      : clone(DEFAULTS[entry.key])
  }
  notifyRatesChanged()
  return { ok: true, applied: Object.keys(sanitized).length }
}


