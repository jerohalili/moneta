'use client'

import { useState } from 'react'
import { computeMixedIncomeTax } from '@/lib/mixedIncomeTax'
import { computeMonthlyContributions } from '@/lib/contributions'
import { formatPHP, formatPercent } from '@/lib/format'
import StatTile from './StatTile'
import ErrorFlags from './ErrorFlags'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function MixedIncomeCalculator() {
  const [compInput, setCompInput] = useState('')
  const [receiptsInput, setReceiptsInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')

  const grossCompensation = Math.max(0, Number(compInput) || 0)
  const grossReceipts = Math.max(0, Number(receiptsInput) || 0)
  const itemizedExpenses = Math.max(0, Number(expensesInput) || 0)
  const hasIncome = grossCompensation > 0 && grossReceipts > 0

  const autoContributions = grossCompensation > 0
    ? computeMonthlyContributions({ monthlyCompensation: grossCompensation / 12 }).totalEmployee * 12
    : 0

  const result = hasIncome
    ? computeMixedIncomeTax({ grossCompensation, mandatoryContributions: autoContributions, grossReceipts, itemizedExpenses })
    : null

  const totalGross = grossCompensation + grossReceipts
  const effectiveRate = result && totalGross > 0 ? result.totalTax / totalGross : null

  const errors = []
  if (receiptsInput !== '' && itemizedExpenses > grossReceipts) {
    errors.push('Your logged business expenses exceed your gross receipts — double-check the numbers.')
  }

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
          Fill in both sections: this calculator is for someone with compensation income AND business/professional
          income in the same year.
        </p>
        <div className="field">
          <label htmlFor="mixed-comp">Annual gross compensation (₱)</label>
          <input id="mixed-comp" type="number" inputMode="decimal" placeholder="e.g. 400000" value={compInput} onChange={(e) => setCompInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mixed-receipts">Annual business/professional gross receipts (₱)</label>
          <input id="mixed-receipts" type="number" inputMode="decimal" placeholder="e.g. 500000" value={receiptsInput} onChange={(e) => setReceiptsInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="mixed-expenses">Itemized business expenses, if any (₱)</label>
          <input id="mixed-expenses" type="number" inputMode="decimal" placeholder="e.g. 80000" value={expensesInput} onChange={(e) => setExpensesInput(e.target.value)} />
        </div>
      </section>

      <ErrorFlags errors={errors} />

      <div className="stat-grid">
        <StatTile label="Tax on Compensation" value={hasIncome ? formatPHP(result.employee.total) : '—'} />
        <StatTile label="Tax on Business Income" value={hasIncome ? formatPHP(result.business.best.total) : '—'} />
        <StatTile label="Total Tax" value={hasIncome ? formatPHP(result.totalTax) : '—'} />
        <StatTile label="Effective Rate" value={hasIncome ? formatPercent(effectiveRate) : '—'} />
      </div>

      {hasIncome && (
        <div style={{ marginBottom: 20 }}>
          <SaveToHistoryButton
            calculatorName="Mixed Income Tax"
            summary={`Total tax ${formatPHP(result.totalTax)} (comp ${formatPHP(grossCompensation)} + business ${formatPHP(grossReceipts)})`}
            details={{
              grossCompensation,
              grossReceipts,
              itemizedExpenses,
              taxOnCompensation: result.employee.total,
              taxOnBusiness: result.business.best.total,
              totalTax: result.totalTax,
            }}
          />
        </div>
      )}

      {hasIncome && (
        <section className="card">
          <h2>Cheapest route for your business income</h2>
          <p className="empty-copy">
            The <strong>{result.business.best.method.replace('-', ' ')}</strong> route is cheapest for your business
            income, at {formatPHP(result.business.best.total)}.
          </p>
        </section>
      )}

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Compensation is taxed under the regular graduated table, same as a pure employee. Business/professional
          income is compared across every eligible route (8% flat vs. graduated), same as the Freelancer calculator
          — <strong>except</strong> the 8% option here does NOT get the usual ₱250,000 exemption. Under RR 8-2018,
          that exemption is only available to purely self-employed taxpayers; a mixed-income earner&apos;s
          ₱250,000 is already accounted for on the compensation side.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          Contributions for the compensation portion are computed automatically the same way as the Employee
          calculator (assuming even monthly pay). This is the calculator the Dashboard&apos;s Mixed income profile
          links to — numbers here should match what you see there.
        </p>
      </section>
    </>
  )
}
