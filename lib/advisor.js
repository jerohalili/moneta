import { RATES } from './taxConfig'
import { explainGraduatedTable, computeGraduatedRoute } from './freelancerTax'
import { computePenalties } from './penalties'

/**
 * Rule-based tips for the freelancer calculator. Each rule is a pure
 * function of the inputs/results — no ML, no guessing, just codified
 * BIR rules so every tip is traceable to a specific provision.
 *
 * Keep this list conservative: only include tips we can defend with a
 * cited rule. This is general information, not a substitute for a CPA.
 */
export function getFreelancerTips({ grossReceipts, itemizedExpenses, comparison }) {
  const tips = []
  const { routes, best, vatRequired } = comparison

  const eightPercentRoute = routes.find((r) => r.method === '8-percent')
  const graduatedOsd = routes.find((r) => r.method === 'graduated-osd')
  const graduatedItemized = routes.find((r) => r.method === 'graduated-itemized')

  if (eightPercentRoute && best.method === '8-percent') {
    tips.push({
      title: 'The 8% flat rate is your cheapest legal option',
      detail: 'It replaces both the graduated income tax and the 3% percentage tax. You must elect it at BIR registration or the start of the taxable year (Form 1901/1701Q) — it cannot be switched mid-year.',
    })
  }

  if (graduatedItemized && graduatedOsd && graduatedItemized.total < graduatedOsd.total) {
    tips.push({
      title: 'Itemizing beats the standard deduction for you',
      detail: `Your actual expenses (₱${itemizedExpenses.toLocaleString()}) exceed the ${RATES.OSD_RATE * 100}% Optional Standard Deduction (₱${graduatedOsd.deduction.toLocaleString()}). If you're on the graduated route, itemizing lowers your taxable income further — but you must keep receipts and books of accounts to support it.`,
    })
  } else if (graduatedOsd && itemizedExpenses > 0 && itemizedExpenses < graduatedOsd.deduction) {
    tips.push({
      title: 'OSD beats itemizing your actual expenses',
      detail: `The ${RATES.OSD_RATE * 100}% Optional Standard Deduction (₱${graduatedOsd.deduction.toLocaleString()}) is larger than your itemized expenses (₱${itemizedExpenses.toLocaleString()}). Taking OSD also means you don't need to substantiate every expense with receipts.`,
    })
  }

  if (
    grossReceipts > RATES.EIGHT_PERCENT_ELIGIBILITY_CEILING * 0.85 &&
    grossReceipts <= RATES.VAT_THRESHOLD
  ) {
    tips.push({
      title: `You're close to the ₱${RATES.VAT_THRESHOLD.toLocaleString()} VAT threshold`,
      detail: 'Crossing it mid-year forces VAT registration and disqualifies you from the 8% option for the year. If a large payment can legally be timed into the next tax year, it keeps you eligible for simpler compliance this year.',
    })
  }

  if (vatRequired) {
    tips.push({
      title: 'You are required to register as a VAT taxpayer',
      detail: `Gross receipts above ₱${RATES.VAT_THRESHOLD.toLocaleString()}/year require VAT registration (${RATES.VAT_RATE * 100}%) and disqualify the 8% option — only the graduated rate applies. This calculator doesn't yet compute VAT input/output credits; treat these figures as income-tax-only.`,
    })
  }

  if (tips.length === 0) {
    tips.push({
      title: 'No additional flags for these numbers',
      detail: `Based on what you entered, the cheapest route shown above (${best.method}) is likely your best legal option.`,
    })
  }

  return tips
}

// =====================================================================
// Advice plan — the Dashboard's advisor engine.
//
// Given everything the Income Profile knows, produce:
//   actions     — ranked, peso-valued things the person can actually DO
//                 to legally lower their tax or avoid penalties
//   walkthroughs— line-by-line explanations of how each of their taxes
//                 was computed, with their real numbers substituted in
//
// Every action cites the rule it stands on. Impacts are estimates by
// definition (they model "if you did X"), and say so where it matters.
// =====================================================================

function bracketFor(taxableIncome) {
  const brackets = RATES.GRADUATED_BRACKETS
  return (
    brackets.find((b) => taxableIncome > b.over && taxableIncome <= b.upTo) ??
    brackets[brackets.length - 1]
  )
}

function formatRange(s) {
  const upper = s.upTo === null ? 'above' : `– ₱${Math.round(s.upTo).toLocaleString()}`
  return `₱${Math.round(s.over).toLocaleString()} ${upper}`
}

function buildSlices(taxableIncome) {
  return explainGraduatedTable(taxableIncome).slices.map((s) => ({
    rangeLabel: formatRange(s),
    rate: s.rate,
    amount: s.amount,
    tax: s.tax,
  }))
}

/**
 * @param {object} input
 * @param {string|null} input.profileType
 * @param {number} input.grossCompensation   annual, ≥0
 * @param {number} input.grossReceipts       annual, ≥0
 * @param {number} input.itemizedExpenses
 * @param {number} input.mandatoryContributions  annual employee-share total
 * @param {number|null} input.totalAssets    business assets excl. land; null = unknown
 * @param {boolean} input.vatRegistered
 * @param {boolean} input.hasEmployeeIncome
 * @param {boolean} input.hasBusinessIncome
 * @param {boolean} input.isMixed
 * @param {object|null} input.employeeResult computeEmployeeTax output
 * @param {object|null} input.comparison     compareRoutes output
 * @param {object|null} input.thirteenthMonthResult
 */
export function buildAdvicePlan({
  profileType,
  grossCompensation,
  grossReceipts,
  itemizedExpenses,
  mandatoryContributions,
  totalAssets,
  vatRegistered,
  hasEmployeeIncome,
  hasBusinessIncome,
  isMixed,
  employeeResult,
  comparison,
  thirteenthMonthResult,
}) {
  const actions = []
  const walkthroughs = []

  // ------------------------------------------------------------------
  // Business / professional income side
  // ------------------------------------------------------------------
  if (hasBusinessIncome && comparison) {
    const { routes, best } = comparison
    const eightPercent = routes.find((r) => r.method === '8-percent')
    const graduatedOsd = routes.find((r) => r.method === 'graduated-osd')
    const graduatedItemized = routes.find((r) => r.method === 'graduated-itemized')
    const cheapestGraduated = routes
      .filter((r) => r.method.startsWith('graduated'))
      .sort((a, b) => a.total - b.total)[0]

    // --- Route optimization -------------------------------------
    if (eightPercent && best.method === '8-percent' && cheapestGraduated) {
      actions.push({
        id: 'elect-8-percent',
        tag: 'route',
        title: 'Elect the 8% flat rate',
        impact: Math.max(0, cheapestGraduated.total - eightPercent.total),
        detail:
          `Filing under the 8% option pays ${RATES.EIGHT_PERCENT_RATE * 100}% on gross receipts after the first ` +
          `${formatPHPShort(RATES.EIGHT_PERCENT_EXEMPTION)}, and REPLACES both the graduated income tax and the ` +
          `${RATES.PERCENTAGE_TAX_RATE * 100}% percentage tax — one flat payment instead of two taxes. ` +
          'The catch: you must elect it at BIR registration or at the START of the taxable year (Form 1901 or ' +
          '1701Q); you cannot switch mid-year.',
        href: '/calculators/freelancer',
      })
    }

    if (graduatedItemized && best.method === 'graduated-itemized' && graduatedOsd) {
      actions.push({
        id: 'keep-receipts-itemized',
        tag: 'route',
        title: 'Keep itemizing — your receipts beat the standard deduction',
        impact: Math.max(0, graduatedOsd.total - graduatedItemized.total),
        detail:
          `Your logged expenses (${formatPHPShort(itemizedExpenses)}) exceed the ${RATES.OSD_RATE * 100}% Optional ` +
          `Standard Deduction (${formatPHPShort(graduatedOsd.deduction)}), so claiming actual expenses lowers your ` +
          'taxable income more than the flat OSD would. To defend this on audit you need receipts and books of ' +
          'accounts — the ledger below is your running evidence file.',
        href: null,
      })
    }

    // --- BMBE ----------------------------------------------------
    const bmbeEligible =
      profileType !== 'employee' &&
      profileType !== null &&
      !vatRegistered &&
      totalAssets !== null &&
      totalAssets <= RATES.BMBE_ASSET_CEILING &&
      grossReceipts <= RATES.VAT_THRESHOLD

    if (bmbeEligible && best.total > 0) {
      // Under BMBE the income tax goes to zero but percentage/VAT tax does
      // not — so the honest savings figure compares today's best route
      // against that route's NON-income-tax portion.
      const nonIncomeTaxPortion = best.method === '8-percent'
        ? grossReceipts * RATES.PERCENTAGE_TAX_RATE // 8% filers would owe this again on a graduated+BMBE setup
        : best.percentageTax
      const bmbeSavings = Math.max(0, best.total - nonIncomeTaxPortion)
      if (bmbeSavings > 0) {
        actions.push({
          id: 'bmbe-registration',
          tag: 'registration',
          title: `Register as a BMBE — exempts your entire income tax`,
          impact: bmbeSavings,
          detail:
            `Your assets (${formatPHPShort(totalAssets)}) are under the ${formatPHPShort(RATES.BMBE_ASSET_CEILING)} ` +
            'ceiling, so registering as a Barangay Micro Business Enterprise (RA 9178) makes your operating income ' +
            '100% income-tax-exempt. You still pay percentage/VAT tax — only income tax is waived. Requires a BMBE ' +
            'Certificate of Authority from DTI (sole proprietors) or your city/municipal office, registered with ' +
            'your RDO. Licensed professionals practicing their profession cannot register — check with DTI first.',
          href: '/calculators/bmbe',
        })
      }
    }

    // --- Deduction headroom --------------------------------------
    if (best.taxableIncome > 0 && best.method !== '8-percent') {
      const EXAMPLE_EXTRA = 25_000
      const headroomSaving =
        explainGraduatedTable(best.taxableIncome).total -
        explainGraduatedTable(Math.max(0, best.taxableIncome - EXAMPLE_EXTRA)).total
      if (headroomSaving > 0) {
        actions.push({
          id: 'expense-headroom',
          tag: 'deductions',
          title: `Documenting ₱${EXAMPLE_EXTRA.toLocaleString()} more deductible expenses saves ≈${formatPHPShort(headroomSaving)}`,
          impact: headroomSaving,
          detail:
            best.method === 'graduated-osd'
              ? `You're currently on the ${RATES.OSD_RATE * 100}% standard deduction, which ignores actual expenses. ` +
                'Once your real tracked expenses exceed the OSD amount, switching to itemized claims them instead — ' +
                'every legitimate business expense (rent, utilities, supplies, professional services) shrinks your ' +
                'taxable income. Log them in the ledger below through the year.'
              : 'Every legitimate, ordinary-and-necessary business expense documented with a receipt reduces your ' +
                'taxable income peso-for-peso before the bracket rates apply. Rent, utilities, internet, supplies, ' +
                'professional fees all count. Log them in the ledger below as you go — reconstructing receipts in ' +
                'April is where deductions die.',
          href: null,
        })
      }
    }

    // --- VAT threshold awareness ---------------------------------
    const headroom = RATES.VAT_THRESHOLD - grossReceipts
    if (!vatRegistered && headroom > 0 && headroom <= RATES.VAT_THRESHOLD * 0.15) {
      actions.push({
        id: 'vat-proximity',
        tag: 'timing',
        title: `₱${Math.round(headroom).toLocaleString()} of headroom before mandatory VAT`,
        impact: null,
        detail:
          `Crossing ${formatPHPShort(RATES.VAT_THRESHOLD)} in gross receipts forces VAT registration ` +
          `(${RATES.VAT_RATE * 100}%) mid-year and disqualifies the 8% option for the whole year. If a client ` +
          'payment can legitimately be invoiced in January instead of December, it keeps this year simple — ' +
          'invoice timing must reflect when the service was actually rendered, though. This is planning ' +
          'awareness, not advice to hide income.',
        href: '/calculators/business',
      })
    }

    if (!vatRegistered && headroom <= 0) {
      actions.push({
        id: 'vat-required',
        tag: 'registration',
        title: 'VAT registration is now mandatory for you',
        impact: null,
        detail:
          `Gross receipts above ${formatPHPShort(RATES.VAT_THRESHOLD)} require VAT registration within 45 days ` +
          `of crossing the threshold. Your invoices must show VAT, you file monthly/quarterly VAT returns, and ` +
          'you can credit VAT paid on purchases against VAT collected on sales — the Business Taxes calculator ' +
          'computes that net figure. The 8% option is off the table.',
        href: '/calculators/business',
      })
    }

    if (vatRegistered) {
      actions.push({
        id: 'vat-already-registered',
        tag: 'registration',
        title: 'VAT-registered: these figures are income tax only',
        impact: null,
        detail:
          'As a VAT registrant you don’t pay percentage tax, and the 8% option isn’t available — the graduated ' +
          'route is your only income-tax path. On top of income tax you remit VAT (output minus input) per ' +
          'filing period; the Business Taxes calculator computes that net figure from your sales and purchases.',
        href: '/calculators/business',
      })
    }

    // Walkthrough: business income, line by line -------------------
    walkthroughs.push(buildBusinessWalkthrough(best, grossReceipts))
  }

  // ------------------------------------------------------------------
  // Compensation income side
  // ------------------------------------------------------------------
  if (hasEmployeeIncome && employeeResult) {
    // Bonus structuring around the 13th-month exemption
    if (thirteenthMonthResult && thirteenthMonthResult.taxableAmount > 0) {
      const rate = bracketFor(employeeResult.taxableCompensation).rate
      const saving = thirteenthMonthResult.taxableAmount * rate
      if (saving > 0) {
        actions.push({
          id: 'bonus-envelope',
          tag: 'exemption',
          title: `Keep bonuses inside the ${formatPHPShort(RATES.THIRTEENTH_MONTH_EXEMPTION)} exemption envelope`,
          impact: saving,
          detail:
            `Your 13th-month pay plus ALL other similar benefits (bonuses, incentives) share ONE tax-exempt ` +
            `bucket of ${formatPHPShort(RATES.THIRTEENTH_MONTH_EXEMPTION)} per year (NIRC Sec. 32(B)(7)(e)). ` +
            `${formatPHPShort(thirteenthMonthResult.taxableAmount)} of yours spills past it and is taxed at your ` +
            `marginal ${(rate * 100).toFixed(0)}%. If your employer can structure bonuses to stay within the ` +
            'envelope (or you time them across calendar years), that spillover becomes tax-free.',
          href: '/calculators/thirteenth-month',
        })
      }
    }

    walkthroughs.push(buildEmployeeWalkthrough(grossCompensation, mandatoryContributions, employeeResult))
  }

  // ------------------------------------------------------------------
  // Compliance: quantify what lateness actually costs
  // ------------------------------------------------------------------
  const estimatedAnnualTax = (employeeResult?.total ?? 0) + (comparison?.best?.total ?? 0)
  if (estimatedAnnualTax > 0) {
    const penaltyExample = computePenalties({ basicTax: estimatedAnnualTax, daysLate: 30 })
    const avoidedCost = penaltyExample.surcharge + penaltyExample.interest + penaltyExample.compromise
    actions.push({
      id: 'file-on-time',
      tag: 'compliance',
      title: `A one-month-late filing would cost ≈${formatPHPShort(avoidedCost)}`,
      impact: null,
      detail:
        `On a tax bill of ${formatPHPShort(estimatedAnnualTax)}, being 30 days late triggers a ` +
        `${RATES.SURCHARGE_RATE * 100}% surcharge (${formatPHPShort(penaltyExample.surcharge)}), daily interest, ` +
        `and a compromise penalty (${formatPHPShort(penaltyExample.compromise)}) — money that buys nothing. ` +
        'Every deadline relevant to your profile is in the Filing Schedule card, and the app counts down to the ' +
        'next one.',
      href: '/calculators/penalties',
    })
  }

  // Rank: biggest peso impact first; informational items (no impact) last.
  actions.sort((a, b) => {
    if (a.impact !== null && b.impact !== null) return b.impact - a.impact
    if (a.impact !== null) return -1
    if (b.impact !== null) return 1
    return 0
  })

  return { actions: actions.slice(0, 7), walkthroughs }
}

function buildBusinessWalkthrough(best, grossReceipts) {
  const lines = [{ label: 'Gross receipts / sales this year', amount: grossReceipts }]
  let taxableIncome
  let otherTaxes = []

  if (best.method === '8-percent') {
    lines.push({
      label: `− 8% option exemption (first ${formatPHPShort(RATES.EIGHT_PERCENT_EXEMPTION)})`,
      amount: -best.exemptionApplied,
    })
    taxableIncome = best.taxableBase
    lines.push({ label: '= Flat-tax base', amount: taxableIncome, strong: true })
  } else {
    const label =
      best.method === 'graduated-osd'
        ? `− Optional Standard Deduction (${RATES.OSD_RATE * 100}% of gross)`
        : '− Itemized expenses (your ledger)'
    lines.push({ label, amount: -best.deduction })
    taxableIncome = best.taxableIncome
    lines.push({ label: '= Taxable income', amount: taxableIncome, strong: true })
    otherTaxes = [
      {
        label: `+ Percentage tax (${RATES.PERCENTAGE_TAX_RATE * 100}% of gross, NIRC Sec. 116)`,
        amount: best.percentageTax,
      },
    ]
  }

  return {
    id: 'business',
    title: 'How your business income tax was computed',
    intro:
      best.method === '8-percent'
        ? 'You’re on the 8% flat option: no bracket table, no percentage tax — one flat rate on receipts above the exemption.'
        : 'Your receipts shrink by your chosen deduction, then the remaining taxable income runs through the national bracket table, plus percentage tax on the gross.',
    lines,
    slices: buildSlices(taxableIncome),
    otherLines: otherTaxes,
    total: best.total,
  }
}

function buildEmployeeWalkthrough(grossCompensation, mandatoryContributions, employeeResult) {
  const lines = [
    { label: 'Gross compensation this year', amount: grossCompensation },
    {
      label: '− SSS / PhilHealth / Pag-IBIG (your share)',
      amount: -mandatoryContributions,
      note: 'Statutory contributions are deducted before tax — they lower your taxable peso-for-peso.',
    },
    { label: '= Taxable compensation', amount: employeeResult.taxableCompensation, strong: true },
  ]

  return {
    id: 'employee',
    title: 'How your compensation income tax was computed',
    intro:
      'Your employer withholds this across the year; the annual true-up uses the same bracket table shown here.',
    lines,
    slices: buildSlices(employeeResult.taxableCompensation),
    otherLines: [],
    total: employeeResult.total,
  }
}

function formatPHPShort(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return '₱' + Math.round(n).toLocaleString()
}
