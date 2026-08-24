'use client'

import { useState } from 'react'
import { computeNetPay } from '@/lib/netPay'
import { formatPHP, formatPercent } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function NetPayCalculator() {
  const [monthlyInput, setMonthlyInput] = useState('')
  const monthly = Math.max(0, Number(monthlyInput) || 0)
  const hasIncome = monthly > 0
  const result = hasIncome ? computeNetPay({ monthlyGrossCompensation: monthly }) : null
  const takeHomeRate = result && monthly > 0 ? result.netPay / monthly : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="monthly-gross">Monthly gross compensation (₱)</label>
          <input
            id="monthly-gross"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 30000"
            value={monthlyInput}
            onChange={(e) => setMonthlyInput(e.target.value)}
          />
        </div>

        <SaveToHistoryButton
          calculatorName="Net Pay"
          summary={hasIncome ? `₱${Math.round(result.netPay).toLocaleString()} net of ₱${Math.round(monthly).toLocaleString()} gross` : ''}
          details={{
            monthlyGross: monthly,
            contributions: result?.contributions?.totalEmployee,
            monthlyWithholdingTax: result?.monthlyWithholdingTax,
            netPay: result?.netPay,
            takeHomeRate,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="stat-grid">
        <StatTile label="Contributions" value={hasIncome ? formatPHP(result.contributions.totalEmployee) : '—'} />
        <StatTile label="Withholding Tax" value={hasIncome ? formatPHP(result.monthlyWithholdingTax) : '—'} />
        <StatTile label="Net Pay" value={hasIncome ? formatPHP(result.netPay) : '—'} />
        <StatTile label="Take-Home Rate" value={hasIncome ? formatPercent(takeHomeRate) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Net pay = gross compensation − SSS/PhilHealth/Pag-IBIG contributions − withholding tax.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          The withholding tax shown is a year-end-equivalent estimate (this month&apos;s taxable pay annualized
          through the graduated bracket table, then divided back to a month) — it approximates what consistent
          monthly withholding should average out to over the year, not necessarily your employer&apos;s exact BIR
          withholding-table figure for this specific month. The two normally converge closely by year-end.
        </p>
      </section>
    </>
  )
}
