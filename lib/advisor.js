import { RATES } from './taxConfig'
import { explainGraduatedTable, computeGraduatedRoute, applyGraduatedTable } from './freelancerTax'
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
 * @param {boolean} input.isMultiEmployer    two or more employers in the year
 * @param {boolean} input.isSmwe             statutory minimum wage earner
 * @param {boolean} input.isOfw              OFW / non-resident citizen
 * @param {boolean} input.isEstateTrust      estate or trust taxpayer
 * @param {number} input.smwAnnual           annual statutory minimum wage (SMWE only)
 * @param {number} input.foreignIncome       foreign-source income (OFW only, exempt)
 * @param {object|null} input.employeeResult computeEmployeeTax output
 * @param {object|null} input.estateTrustResult computeEmployeeTax output (no contributions)
 * @param {object|null} input.comparison     compareRoutes output
 * @param {object|null} input.thirteenthMonthResult
 * @param {object|null} input.corporate      { grossIncome, netTaxableIncome, yearsInOperation, result }
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
  isMultiEmployer = false,
  isSmwe = false,
  isOfw = false,
  isEstateTrust = false,
  smwAnnual = 0,
  foreignIncome = 0,
  employeeResult,
  estateTrustResult = null,
  comparison,
  thirteenthMonthResult,
  corporate = null,
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
  // Corporate taxpayer (domestic corporation / OPC)
  // ------------------------------------------------------------------
  if (corporate) {
    const { netTaxableIncome, result } = corporate

    if (result.qualifiesSmall && netTaxableIncome > 0) {
      const rateDelta = RATES.CORPORATE_TAX_RATE_STANDARD - RATES.CORPORATE_TAX_RATE_SMALL
      actions.push({
        id: 'create-small-rate',
        tag: 'route',
        title: 'You qualify for CREATE\'s reduced 20% corporate rate',
        impact: netTaxableIncome * rateDelta,
        detail:
          `With net taxable income at or under ${formatPHPShort(RATES.CORPORATE_SMALL_INCOME_CEILING)} AND total ` +
          `assets (excluding land) at or under ${formatPHPShort(RATES.CORPORATE_SMALL_ASSET_CEILING)}, your ` +
          `corporation pays the ${RATES.CORPORATE_TAX_RATE_SMALL * 100}% RCIT rate instead of ` +
          `${RATES.CORPORATE_TAX_RATE_STANDARD * 100}% (CREATE Act, RA 11534). Growing past EITHER test reverts ` +
          'the whole income to the 25% rate — worth modeling before a big asset purchase or a windfall year.',
        href: '/calculators/corporate',
      })
    }

    if (result.usedMcit) {
      actions.push({
        id: 'mcit-applies',
        tag: 'route',
        title: 'MCIT — not RCIT — is your tax this year',
        impact: null,
        detail:
          `From the 4th year of operations, the Minimum Corporate Income Tax (${RATES.MCIT_RATE * 100}% of gross ` +
          'income) applies whenever it exceeds the regular income tax — as it does for you now. The BIR collects ' +
          'whichever is higher. Excess MCIT can be carried forward and credited against regular tax in later ' +
          'years when RCIT overtakes it again (NIRC Sec. 27(E)).',
        href: '/calculators/corporate',
      })
    }

    walkthroughs.push(buildCorporateWalkthrough(corporate, result))
  }

  // ------------------------------------------------------------------
  // Estate / trust taxpayer
  // ------------------------------------------------------------------
  if (isEstateTrust && estateTrustResult) {
    actions.push({
      id: 'estate-trust-distribution',
      tag: 'timing',
      title: 'Distributing income to beneficiaries beats accumulating it',
      impact: null,
      detail:
        'Estates and trusts compute on the individual graduated table (NIRC Sec. 60), BUT income that is ' +
        'accumulated instead of distributed is taxed to the estate/trust itself at the flat 35% highest rate. ' +
        'Distributing currently to beneficiaries lets each of them use their own (lower) brackets instead. ' +
        'File 1701 annually and 1701Q each quarter while the estate/trust still earns.',
      href: null,
    })

    walkthroughs.push(buildEmployeeWalkthrough(grossCompensation, 0, estateTrustResult, {
      intro:
        'An estate or trust is taxed exactly like an individual on the graduated table (NIRC Sec. 60) — but with ' +
        'no SSS/PhilHealth/Pag-IBIG deductions, so gross taxable income runs straight through the brackets.',
    }))
  }

  // ------------------------------------------------------------------
  // Compensation income side
  // ------------------------------------------------------------------
  if (hasEmployeeIncome && employeeResult) {
    // Multiple employers: the one thing that blindsides these taxpayers —
    // no substituted filing, and usually a balance due at 1700 filing.
    if (isMultiEmployer) {
      const hasWithheldFigure = employeeResult.withheldTax !== null
      const owes = hasWithheldFigure && employeeResult.balanceDue > 0
      const refunds = hasWithheldFigure && employeeResult.overpayment > 0
      actions.push({
        id: 'file-1700-balance',
        tag: 'compliance',
        title: owes
          ? `File Form 1700 yourself — expect ≈${formatPHPShort(employeeResult.balanceDue)} payable`
          : 'File Form 1700 yourself — substituted filing doesn\'t apply to you',
        impact: null,
        detail:
          'With two or more employers, EACH withholds against their own salary alone — neither sees your combined ' +
          'income, so the combined withholding almost never matches the tax on the combined total. You must file ' +
          'BIR Form 1700 by April 15, attaching ALL employers\' 2316 certificates' +
          (owes
            ? `, and pay the ≈${formatPHPShort(employeeResult.balanceDue)} balance (tax ${formatPHPShort(employeeResult.total)} minus ${formatPHPShort(employeeResult.withheldTax)} already withheld)`
            : refunds
              ? ` — on your figures you've actually OVERPAID by ≈${formatPHPShort(employeeResult.overpayment)}, refundable at filing`
              : hasWithheldFigure
                ? ' — your withholding happens to match the tax due'
                : ' — enter the total tax withheld above to estimate your balance') +
          '. Filing late triggers the surcharge, interest, and compromise penalty below.',
        href: null,
      })
    }

    // Statutory minimum wage earner: the exemption itself is the headline.
    if (isSmwe) {
      const counterfactualTax = applyGraduatedTable(Math.max(0, grossCompensation - mandatoryContributions))
      const exemptionSaving = Math.max(0, counterfactualTax - employeeResult.total)
      actions.push({
        id: 'smwe-exemption',
        tag: 'exemption',
        title:
          employeeResult.total === 0
            ? 'Your minimum wage is fully income-tax exempt'
            : `The minimum-wage portion is exempt — only the excess is taxed (saving ≈${formatPHPShort(exemptionSaving)})`,
        impact: exemptionSaving > 0 ? exemptionSaving : null,
        detail:
          'Under NIRC Sec. 24(B)(1) (as amended by RA 9504) and RR 10-2008, compensation within the statutory ' +
          'minimum wage is exempt from income tax. Two caveats: holiday pay, overtime, and night differential are ' +
          'TAXABLE even for a minimum wage earner, and the exemption covers only the SMW of your REGION — if you ' +
          'earn above minimum wage, the excess runs through the brackets normally.',
        href: null,
      })
    }

    // OFW / non-resident citizen: the foreign-income exemption.
    if (isOfw) {
      actions.push({
        id: 'ofw-foreign-exempt',
        tag: 'exemption',
        title: 'Your foreign-source income is not taxed by the Philippines',
        impact: null,
        detail:
          'As a non-resident citizen, only Philippine-source income is taxable (NIRC Sec. 23)' +
          (foreignIncome > 0
            ? ` — your ${formatPHPShort(foreignIncome)} earned abroad is outside the BIR\'s reach and is NOT included in the computation`
            : '') +
          '. Sea-based OFWs serving on foreign vessels are exempt even on the technicality of vessel registry ' +
          '(NIRC Sec. 23(C)). Land-based OFWs: keep your employer\'s BIR 2316 for any PH-source pay; income ' +
          'exclusively from abroad needs no annual return at all.',
        href: null,
      })
    }

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

    walkthroughs.push(
      buildEmployeeWalkthrough(grossCompensation, mandatoryContributions, employeeResult, {
        exemptionLine: isSmwe
          ? {
              label: `− Statutory minimum wage exemption (RA 9504)`,
              amount: -Math.min(smwAnnual, grossCompensation),
            }
          : null,
        intro: isOfw
          ? 'Only your Philippine-source pay is taxable as a non-resident citizen (NIRC Sec. 23) — foreign earnings stay out of this table entirely.'
          : undefined,
      })
    )
  }

  // ------------------------------------------------------------------
  // Compliance: quantify what lateness actually costs
  // ------------------------------------------------------------------
  const estimatedAnnualTax =
    (employeeResult?.total ?? 0) +
    (comparison?.best?.total ?? 0) +
    (estateTrustResult?.total ?? 0) +
    (corporate?.result?.tax ?? 0)
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

function buildEmployeeWalkthrough(grossCompensation, mandatoryContributions, employeeResult, opts = {}) {
  const lines = [
    { label: 'Gross compensation this year', amount: grossCompensation },
  ]

  if (mandatoryContributions > 0) {
    lines.push({
      label: '− SSS / PhilHealth / Pag-IBIG (your share)',
      amount: -mandatoryContributions,
      note: 'Statutory contributions are deducted before tax — they lower your taxable peso-for-peso.',
    })
  }

  if (opts.exemptionLine) {
    lines.push({
      ...opts.exemptionLine,
      note: opts.exemptionLine.note ??
        'This exemption is subtracted before the bracket table — it lowers your taxable peso-for-peso.',
    })
  }

  lines.push({ label: '= Taxable compensation', amount: employeeResult.taxableCompensation, strong: true })

  return {
    id: 'employee',
    title: 'How your compensation income tax was computed',
    intro:
      opts.intro ??
      'Your employer withholds this across the year; the annual true-up uses the same bracket table shown here.',
    lines,
    slices: buildSlices(employeeResult.taxableCompensation),
    otherLines: [],
    total: employeeResult.total,
  }
}

function buildCorporateWalkthrough({ grossIncome, netTaxableIncome, yearsInOperation }, result) {
  const lines = [
    { label: 'Gross sales / income this year', amount: grossIncome },
    { label: '− Allowable deductions (expenses)', amount: -(grossIncome - netTaxableIncome) },
    { label: '= Net taxable income', amount: netTaxableIncome, strong: true },
  ]

  const otherLines = [
    {
      label: `RCIT at ${result.rcitRate * 100}%` + (result.qualifiesSmall ? ' (CREATE small-corpus rate)' : ''),
      amount: result.rcit,
    },
  ]
  if (result.mcitApplies) {
    otherLines.push({
      label: `MCIT (${RATES.MCIT_RATE * 100}% of gross, from year 4)`,
      amount: result.mcit,
    })
  }

  return {
    id: 'corporate',
    title: 'How your corporate income tax was computed',
    intro:
      result.usedMcit
        ? 'From the 4th year of operations the BIR collects whichever is higher: the regular corporate rate on net taxable income, or the 2% MCIT on gross — the MCIT wins on your figures this year.'
        : 'A domestic corporation pays the regular corporate income tax on net taxable income (gross minus deductions).',
    lines,
    slices: [],
    slicesEmptyNote: 'Corporations pay a flat corporate rate — the individual bracket table does not apply.',
    otherLines,
    total: result.tax,
  }
}

function formatPHPShort(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—'
  return '₱' + Math.round(n).toLocaleString()
}
