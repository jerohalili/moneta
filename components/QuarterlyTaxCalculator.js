'use client'

import { useState } from 'react'
import { computeQuarterlyTax } from '@/lib/quarterlyTax'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

const QUARTERS = [
  { id: 1, label: 'Q1 (Jan–Mar), due May 15' },
  { id: 2, label: 'Q2 (Apr–Jun), due Aug 15' },
  { id: 3, label: 'Q3 (Jul–Sep), due Nov 15' },
]

const MODES = [
  { id: 'graduated', label: 'Graduated rate + deductions' },
  { id: 'eight-percent', label: '8% flat option' },
]

export default function QuarterlyTaxCalculator() {
  const [mode, setMode] = useState('graduated')
  const [rows, setRows] = useState([
    { gross: '', deductions: '', withheld: '' },
    { gross: '', deductions: '', withheld: '' },
    { gross: '', deductions: '', withheld: '' },
  ])

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const quarters = rows.map((r) => ({
    gross: r.gross.trim() === '' ? null : Math.max(0, Number(r.gross) || 0),
    deductions: mode === 'eight-percent' ? 0 : Math.max(0, Number(r.deductions) || 0),
    withheld: Math.max(0, Number(r.withheld) || 0),
  }))
  const hasIncome = quarters.some((q) => q.gross !== null)
  const result = hasIncome ? computeQuarterlyTax({ mode, quarters }) : null

  const errors = []
  if (mode === 'eight-percent' && result && result.cumTaxable > 3_000_000) {
    errors.push('Gross receipts above ₱3,000,000 disqualify the 8% option — VAT registration becomes mandatory and only the graduated route applies.')
  }

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Enter each finished quarter — leave later quarters blank until they close. Everything recalculates as you
          type.
        </p>

        <div className="field">
          <label>Method</label>
          <div className="auth-mode-toggle" style={{ justifyContent: 'flex-start' }}>
            {MODES.map((m) => (
              <label key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                <input
                  type="radio"
                  checked={mode === m.id}
                  onChange={() => setMode(m.id)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        {rows.map((row, i) => {
          const laterBlank = quarters.slice(0, i).some((q) => q.gross === null)
          const disabled = laterBlank
          return (
            <div className="settings-field" key={QUARTERS[i].id}>
              <div className="settings-field-head">
                <label htmlFor={`q${QUARTERS[i].id}-gross`}>{QUARTERS[i].label}</label>
              </div>
              <div className="ledger-form" style={{ marginBottom: 0 }}>
                <input
                  id={`q${QUARTERS[i].id}-gross`}
                  className="ledger-input ledger-input-amount"
                  style={{ flex: '2 1 160px' }}
                  type="number"
                  inputMode="decimal"
                  placeholder="Gross receipts / fees (₱)"
                  value={row.gross}
                  disabled={disabled}
                  onChange={(e) => updateRow(i, 'gross', e.target.value)}
                />
                {mode === 'graduated' && (
                  <input
                    className="ledger-input ledger-input-amount"
                    style={{ flex: '2 1 160px' }}
                    type="number"
                    inputMode="decimal"
                    placeholder="Deductions (₱)"
                    value={row.deductions}
                    disabled={disabled}
                    onChange={(e) => updateRow(i, 'deductions', e.target.value)}
                  />
                )}
                <input
                  className="ledger-input ledger-input-amount"
                  type="number"
                  inputMode="decimal"
                  placeholder="EWT withheld (₱)"
                  value={row.withheld}
                  disabled={disabled}
                  onChange={(e) => updateRow(i, 'withheld', e.target.value)}
                />
              </div>
            </div>
          )
        })}

        <SaveToHistoryButton
          calculatorName="Quarterly Income Tax (1701Q)"
          summary={
            result
              ? `${mode === 'eight-percent' ? '8%' : 'Graduated'} — ${formatPHP(result.totalPaid)} payable across ${result.rows.length} quarter${result.rows.length > 1 ? 's' : ''}`
              : ''
          }
          details={{
            method: mode,
            quarters: result?.rows.map((r) => ({
              quarter: r.quarter,
              gross: r.gross,
              deductions: r.deductions,
              withheld: r.withheld,
              cumulativeTax: r.cumTax,
              payable: r.payable,
            })),
            totalPaid: result?.totalPaid,
            annualTaxEstimate: result?.annualTaxEstimate,
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

      {result && (
        <>
          <div className="stat-grid">
            {result.rows.map((r) => (
              <StatTile key={r.quarter} label={`Q${r.quarter} Payable`} value={formatPHP(r.payable)} />
            ))}
            <StatTile label="Total Paid Across Quarters" value={formatPHP(result.totalPaid)} />
          </div>

          <section className="card">
            <h2>Quarter-by-quarter worksheet</h2>
            <table className="walk-table">
              <thead>
                <tr>
                  <th>Quarter</th>
                  <th>YTD taxable</th>
                  <th>Cumulative tax</th>
                  <th>Withheld YTD</th>
                  <th>Payable this quarter</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.quarter}>
                    <td>Q{r.quarter}</td>
                    <td className="walk-amount">{formatPHP(r.cumTaxable)}</td>
                    <td className="walk-amount">{formatPHP(r.cumTax)}</td>
                    <td className="walk-amount">{formatPHP(r.withheldYTD)}</td>
                    <td className="walk-amount"><strong>{formatPHP(r.payable)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          The graduated method follows the official 1701Q worksheet (RR 8-2018): cumulative net taxable income
          year-to-date is divided by quarters elapsed, that AVERAGE runs through the annual bracket table, and the
          result is multiplied back by quarters elapsed — then taxes already paid in prior quarters and creditable
          withholding (your clients&apos; BIR 2307 certificates) are subtracted. This is why quarterly tax is NOT
          four equal slices of your annual bill: lumpy income compounds through the brackets differently each
          quarter. The 8% method applies the flat rate to cumulative gross receipts minus the ₱250,000 exemption
          prorated per quarter.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          Q4 has no 1701Q — the annual 1701 (due April 15) settles the year, and overwithheld amounts become
          refundable there. The worksheet credits your EWT year-to-date each quarter, which can shift which quarter
          a credit lands in versus the form&apos;s per-quarter field — totals match, timing is approximate. If
          you&apos;re also a compensation earner, this is the mixed-income computation and the ₱250,000 exemption
          does not apply to the business side.
        </p>
      </section>
    </>
  )
}
