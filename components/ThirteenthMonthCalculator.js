'use client'

import { useState } from 'react'
import { computeThirteenthMonthPay } from '@/lib/thirteenthMonthPay'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function ThirteenthMonthCalculator() {
  const [basicInput, setBasicInput] = useState('')
  const basic = Math.max(0, Number(basicInput) || 0)
  const hasIncome = basic > 0
  const result = hasIncome ? computeThirteenthMonthPay({ totalBasicSalary: basic }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="basic-salary">Total basic salary earned this calendar year (₱)</label>
          <input
            id="basic-salary"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 360000"
            value={basicInput}
            onChange={(e) => setBasicInput(e.target.value)}
          />
          <p className="disclaimer" style={{ marginTop: 8, borderTop: 'none', paddingTop: 0 }}>
            Basic salary only — exclude overtime, holiday pay, allowances, and other benefits; those aren&apos;t
            part of the statutory 13th-month computation.
          </p>
        </div>

        <SaveToHistoryButton
          calculatorName="13th Month Pay"
          summary={hasIncome ? `${formatPHP(result.thirteenthMonthPay)} on ${formatPHP(basic)} basic` : ''}
          details={{
            totalBasicSalary: basic,
            thirteenthMonthPay: result?.thirteenthMonthPay,
            exemptAmount: result?.exemptAmount,
            taxableAmount: result?.taxableAmount,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="stat-grid">
        <StatTile label="13th Month Pay" value={hasIncome ? formatPHP(result.thirteenthMonthPay) : '—'} />
        <StatTile label="Tax-Exempt Portion" value={hasIncome ? formatPHP(result.exemptAmount) : '—'} />
        <StatTile label="Taxable Excess" value={hasIncome ? formatPHP(result.taxableAmount) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          13th-month pay = total basic salary actually earned during the calendar year ÷ 12 (Presidential Decree
          No. 851). The first ₱90,000 (combined with other similar benefits) is tax-exempt under NIRC Sec.
          32(B)(7)(e), as amended by TRAIN; anything above that is added to your taxable compensation for the year.
        </p>
      </section>
    </>
  )
}
