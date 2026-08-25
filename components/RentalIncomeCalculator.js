'use client'

import { useState } from 'react'
import { computeRentalRoutes, residentialPercentageTaxExempt } from '@/lib/rentalIncome'
import { formatPHP, formatPercent } from '@/lib/format'
import { RATES } from '@/lib/taxConfig'
import StatTile from './StatTile'
import RouteComparison from './RouteComparison'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function RentalIncomeCalculator() {
  const [grossInput, setGrossInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')
  const [monthlyRentInput, setMonthlyRentInput] = useState('')

  const gross = Math.max(0, Number(grossInput) || 0)
  const expenses = Math.max(0, Number(expensesInput) || 0)
  const monthlyRent = monthlyRentInput.trim() === '' ? null : Math.max(0, Number(monthlyRentInput) || 0)
  const hasIncome = gross > 0

  const comparison = hasIncome ? computeRentalRoutes({ grossRentals: gross, itemizedExpenses: expenses }) : null
  const pctExempt = residentialPercentageTaxExempt(monthlyRent)

  const errors = []
  if (expensesInput !== '' && expenses > gross) {
    errors.push('Rental expenses exceed gross rentals — double-check the numbers.')
  }

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="rental-gross">Gross rental receipts this year (₱)</label>
          <input
            id="rental-gross"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 360000"
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="rental-expenses">Rental expenses this year (₱) — repairs, association dues, utilities you pay, depreciation</label>
          <input
            id="rental-expenses"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 60000 — optional"
            value={expensesInput}
            onChange={(e) => setExpensesInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="rental-monthly">Monthly rent per residential unit (₱) — optional</label>
          <input
            id="rental-monthly"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 12000"
            value={monthlyRentInput}
            onChange={(e) => setMonthlyRentInput(e.target.value)}
          />
          {pctExempt && (
            <p className="empty-copy" style={{ marginTop: 6 }}>
              At {formatPHP(monthlyRent)}/month, this residential unit is exempt from PERCENTAGE tax — income tax
              still applies on the rent.
            </p>
          )}
        </div>

        <SaveToHistoryButton
          calculatorName="Rental Income Tax"
          summary={hasIncome ? `${comparison.best.method === '8-percent' ? '8% route' : 'Graduated route'}: ${formatPHP(comparison.best.total)} on ${formatPHP(gross)} rentals` : ''}
          details={{
            grossRentals: gross,
            rentalExpenses: expenses,
            monthlyRentPerUnit: monthlyRent,
            routeChosen: comparison?.best?.method,
            incomeTax: comparison?.best?.incomeTax,
            percentageTax: comparison?.best?.percentageTax,
            totalTax: comparison?.best?.total,
          }}
          disabled={!hasIncome}
        />
      </section>

      {errors.length > 0 && (
        <div className="error-flags">
          {errors.map((e) => (
            <div className="error-flag" key={e}>{e}</div>
          ))}
        </div>
      )}

      {comparison && (
        <>
          <RouteComparison comparison={comparison} />

          <div className="stat-grid">
            <StatTile label="Cheapest Legal Route" value={comparison.best.method === '8-percent' ? '8% flat on gross' : 'Graduated + deductions'} />
            <StatTile label="Total Tax (income + percentage)" value={formatPHP(comparison.best.total)} />
            <StatTile
              label="Effective Rate on Rentals"
              value={gross > 0 ? formatPercent(comparison.best.total / gross) : '—'}
            />
            <StatTile
              label="VAT Registration"
              value={comparison.vatRequired ? 'Required — over threshold' : `Not yet (${formatPHP(RATES.VAT_THRESHOLD)} ceiling)`}
            />
          </div>
        </>
      )}

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Rental income is business income to the BIR, so an individual lessor chooses between the same routes as a
          freelancer (RR 13-2018 extends the election to rental explicitly): the <strong>8% flat rate</strong> on
          gross receipts above the first {formatPHP(RATES.EIGHT_PERCENT_EXEMPTION)} — which replaces both graduated
          income tax and percentage tax — or the <strong>graduated bracket table</strong> with either the{' '}
          {formatPercent(RATES.OSD_RATE)} Optional Standard Deduction or your actual itemized rental expenses, plus
          percentage tax on the gross. The election is made at BIR registration or at the start of the taxable year
          and can&apos;t be switched mid-year.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          Residential units rented at {formatPHP(RATES.RESIDENTIAL_RENT_PCT_TAX_EXEMPT)}/month or less per unit are
          exempt from percentage tax (income tax still applies) — enter the monthly rent above to flag this. Rentals
          above {formatPHP(RATES.VAT_THRESHOLD)}/year require VAT registration, which disqualifies the 8% option and
          adds VAT output-tax obligations this calculator doesn&apos;t model (see the Business Taxes calculator).
          Lease of property also carries documentary stamp tax — see the Property &amp; Transfer calculator.
        </p>
      </section>
    </>
  )
}
