import { VAT_THRESHOLD, EIGHT_PERCENT_ELIGIBILITY_CEILING, OSD_RATE } from '../data/taxRates2026.js'

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
      detail: `Your actual expenses (₱${itemizedExpenses.toLocaleString()}) exceed the 40% Optional Standard Deduction (₱${graduatedOsd.deduction.toLocaleString()}). If you're on the graduated route, itemizing lowers your taxable income further — but you must keep receipts and books of accounts to support it.`,
    })
  } else if (graduatedOsd && itemizedExpenses > 0 && itemizedExpenses < graduatedOsd.deduction) {
    tips.push({
      title: 'OSD beats itemizing your actual expenses',
      detail: `The 40% Optional Standard Deduction (₱${graduatedOsd.deduction.toLocaleString()}) is larger than your itemized expenses (₱${itemizedExpenses.toLocaleString()}). Taking OSD also means you don't need to substantiate every expense with receipts.`,
    })
  }

  if (grossReceipts > EIGHT_PERCENT_ELIGIBILITY_CEILING * 0.85 && grossReceipts <= VAT_THRESHOLD) {
    tips.push({
      title: `You're close to the ₱${VAT_THRESHOLD.toLocaleString()} VAT threshold`,
      detail: 'Crossing it mid-year forces VAT registration and disqualifies you from the 8% option for the year. If a large payment can legally be timed into the next tax year, it keeps you eligible for simpler compliance this year.',
    })
  }

  if (vatRequired) {
    tips.push({
      title: 'You are required to register as a VAT taxpayer',
      detail: `Gross receipts above ₱${VAT_THRESHOLD.toLocaleString()}/year require VAT registration (12%) and disqualify the 8% option — only the graduated rate applies. This calculator doesn't yet compute VAT input/output credits; treat these figures as income-tax-only.`,
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
