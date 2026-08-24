'use client'

import { useState } from 'react'
import { computeOvertimePay, OT_CATEGORIES } from '@/lib/overtimePay'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function OvertimeCalculator() {
  const [rateInput, setRateInput] = useState('')
  const [hoursInput, setHoursInput] = useState('')
  const [categoryId, setCategoryId] = useState(OT_CATEGORIES[0].id)
  const [nightDiffInput, setNightDiffInput] = useState('')

  const hourlyRate = Math.max(0, Number(rateInput) || 0)
  const hours = Math.max(0, Number(hoursInput) || 0)
  const nightDiffHours = Math.max(0, Number(nightDiffInput) || 0)
  const hasIncome = hourlyRate > 0 && hours > 0

  const result = hasIncome ? computeOvertimePay({ hourlyRate, hours, categoryId, nightDiffHours }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="ot-rate">Hourly rate (₱)</label>
          <input id="ot-rate" type="number" inputMode="decimal" placeholder="e.g. 150" value={rateInput} onChange={(e) => setRateInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ot-category">Type of work</label>
          <select
            id="ot-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="ledger-input ledger-select"
            style={{ width: '100%' }}
          >
            {OT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ot-hours">Hours worked</label>
          <input id="ot-hours" type="number" inputMode="decimal" placeholder="e.g. 3" value={hoursInput} onChange={(e) => setHoursInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ot-night">Of those, hours between 10PM–6AM (night differential)</label>
          <input id="ot-night" type="number" inputMode="decimal" placeholder="e.g. 2" value={nightDiffInput} onChange={(e) => setNightDiffInput(e.target.value)} />
        </div>

        <SaveToHistoryButton
          calculatorName="Overtime Pay"
          summary={
            hasIncome
              ? `${formatPHP(result.total)} — ${OT_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId}`
              : ''
          }
          details={{
            workType: OT_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId,
            hourlyRate,
            hoursWorked: hours,
            nightDiffHours,
            multiplierApplied: result?.multiplier,
            basePay: result?.basePay,
            nightDiffPay: result?.nightDiffPay,
            totalPay: result?.total,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="stat-grid">
        <StatTile label="Multiplier" value={hasIncome ? `${result.multiplier.toFixed(2)}×` : '—'} />
        <StatTile label="Base Pay" value={hasIncome ? formatPHP(result.basePay) : '—'} />
        <StatTile label="Night Differential" value={hasIncome ? formatPHP(result.nightDiffPay) : '—'} />
        <StatTile label="Total" value={hasIncome ? formatPHP(result.total) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Premium multipliers are set by the Labor Code (as amended) and DOLE issuances: 125% for ordinary
          overtime, 130% for rest-day work, 200% for regular holidays, with overtime on top of a rest day or
          holiday compounding further. Night differential adds an extra 10% for hours actually worked between
          10PM and 6AM, on top of whatever premium already applies.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          These are the standard Labor Code rates. Some CBAs (collective bargaining agreements) or company
          policies provide better terms — check yours if one applies. Managerial employees and certain other
          categories are exempt from overtime pay entirely under Labor Code Art. 82.
        </p>
      </section>
    </>
  )
}
