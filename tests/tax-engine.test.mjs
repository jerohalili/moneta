// Human-owned oracle for the tax engine. Behavior-frozen: these assert what
// the app computes TODAY so later cleanups can't silently change math.
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { birApplyGraduatedTable, birExplainGraduatedTable, birCompareRoutes } from '../lib/freelancerTax.js'
import { birComputeEmployeeTax } from '../lib/employeeTax.js'
import { birComputeCorporateTax } from '../lib/corporateTax.js'
import { birComputeQuarterlyTax } from '../lib/quarterlyTax.js'
import { birComputePenalties } from '../lib/penalties.js'
import { buildAdvicePlan } from '../lib/advisor.js'

const approx = (a, b, eps = 1e-6) => Math.abs(a - b) <= eps

describe('graduated brackets (NIRC Sec 24A / TRAIN)', () => {
  const cases = [
    [0, 0],
    [250_000, 0],
    [300_000, 7_500],
    [400_000, 22_500],
    [500_000, 42_500],
    [800_000, 102_500],
    [1_000_000, 152_500],
    [2_000_000, 402_500],
    [3_000_000, 702_500],
    [9_000_000, 2_552_500],
  ]
  for (const [income, expected] of cases) {
    it(`tax(${income}) = ${expected}`, () => {
      assert.equal(birApplyGraduatedTable(income), expected)
    })
  }

  it('explain slices sum to total', () => {
    const { slices, total } = birExplainGraduatedTable(600_000)
    assert.equal(total, birApplyGraduatedTable(600_000))
    assert.equal(slices.reduce((s, x) => s + x.tax, 0), total)
  })

  it('negative income clamps to zero', () => {
    assert.equal(birApplyGraduatedTable(-50), 0)
  })
})

describe('8% vs graduated routing (RR 8-2018)', () => {
  it('1M receipts: 8% beats OSD route, no VAT', () => {
    const c = birCompareRoutes({ grossReceipts: 1_000_000, itemizedExpenses: 0 })
    assert.equal(c.best.method, '8-percent')
    assert.equal(c.best.total, 60_000) // (1M-250k)*8%
    assert.equal(c.vatRequired, false)
  })

  it('mixed earner loses the 250k exemption', () => {
    const c = birCompareRoutes({ grossReceipts: 1_000_000, itemizedExpenses: 0, isMixedIncomeEarner: true })
    const eight = c.routes.find((r) => r.method === '8-percent')
    assert.equal(eight.total, 80_000) // full 1M*8%
  })

  it('3.5M receipts: VAT required, 8% ineligible', () => {
    const c = birCompareRoutes({ grossReceipts: 3_500_000, itemizedExpenses: 0 })
    assert.equal(c.vatRequired, true)
    assert.ok(!c.routes.some((r) => r.method === '8-percent'))
  })
})

describe('employee tax (1700 true-up)', () => {
  it('deducts contributions before brackets', () => {
    const r = birComputeEmployeeTax({ grossCompensation: 600_000, mandatoryContributions: 50_000 })
    assert.equal(r.taxableCompensation, 550_000)
    assert.equal(r.total, birApplyGraduatedTable(550_000))
  })

  it('withheld true-up balances', () => {
    const r = birComputeEmployeeTax({ grossCompensation: 600_000, mandatoryContributions: 0, withheldTax: 10_000 })
    assert.ok(r.balanceDue !== null || r.overpayment !== null)
    assert.equal(r.balanceDue + r.overpayment, Math.abs(r.total - 10_000))
  })
})

describe('corporate tax (CREATE)', () => {
  it('small corp pays 20% RCIT pre-year-4', () => {
    const r = birComputeCorporateTax({ grossIncome: 8_000_000, netTaxableIncome: 4_000_000, totalAssets: 50_000_000, yearsInOperation: 2 })
    assert.equal(r.qualifiesSmall, true)
    assert.equal(r.tax, 800_000)
    assert.equal(r.mcitApplies, false)
  })

  it('MCIT wins from year 4 when higher', () => {
    const r = birComputeCorporateTax({ grossIncome: 20_000_000, netTaxableIncome: 1_000_000, totalAssets: 50_000_000, yearsInOperation: 5 })
    assert.equal(r.mcitApplies, true)
    assert.equal(r.usedMcit, true)
    assert.equal(r.tax, 400_000) // 20M*2%
  })
})

describe('quarterly 1701Q worksheet', () => {
  it('single graduated quarter', () => {
    const r = birComputeQuarterlyTax({ mode: 'graduated', quarters: [{ gross: 500_000, deductions: 100_000, withheld: 0 }] })
    assert.equal(r.rows.length, 1)
    assert.equal(r.rows[0].payable, 22_500) // 400k taxable -> boundary
  })

  it('empty quarters return null', () => {
    assert.equal(birComputeQuarterlyTax({ mode: 'graduated', quarters: [{}] }), null)
  })
})

describe('penalties (Secs 248-249)', () => {
  it('30-day late on 100k', () => {
    const r = birComputePenalties({ basicTax: 100_000, daysLate: 30 })
    assert.equal(r.surcharge, 25_000)
    assert.ok(approx(r.interest, 100_000 * 0.12 * (30 / 365), 0.01))
    assert.equal(r.compromise, 10_000)
    assert.equal(r.total, 100_000 + r.surcharge + r.interest + r.compromise)
  })
})

describe('advisor ranking', () => {
  it('elect-8-percent is top action at 1M receipts', () => {
    const comparison = birCompareRoutes({ grossReceipts: 1_000_000, itemizedExpenses: 0 })
    const plan = buildAdvicePlan({
      profileType: 'freelancer',
      grossCompensation: 0,
      grossReceipts: 1_000_000,
      itemizedExpenses: 0,
      mandatoryContributions: 0,
      totalAssets: null,
      vatRegistered: false,
      hasEmployeeIncome: false,
      hasBusinessIncome: true,
      employeeResult: null,
      comparison,
      thirteenthMonthResult: null,
      corporate: null,
    })
    const top = plan.actions[0]
    assert.equal(top.id, 'elect-8-percent')
    assert.ok(top.impact > 0)
    assert.ok(plan.actions.length <= 7)
    assert.ok(plan.walkthroughs.length >= 1)
  })
})
