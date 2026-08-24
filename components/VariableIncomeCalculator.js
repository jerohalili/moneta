'use client'

import { useMemo, useState } from 'react'
import { computeVariableIncomeTax } from '@/lib/variableIncome'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function VariableIncomeCalculator() {
  const [periods, setPeriods] = useState([])
  const [draft, setDraft] = useState({ label: '', months: '', monthlySalary: '' })

  const hasPeriods = periods.length > 0
  const result = useMemo(
    () => (hasPeriods ? computeVariableIncomeTax({ periods }) : null),
    [hasPeriods, periods]
  )

  const monthsCovered = periods.reduce((sum, p) => sum + p.months, 0)

  function addPeriod() {
    const months = Number(draft.months)
    const salary = Number(draft.monthlySalary)
    if (!draft.label.trim() || !months || months <= 0 || !salary || salary <= 0) return
    setPeriods((prev) => [...prev, { id: `${Date.now()}`, label: draft.label.trim(), months, monthlySalary: salary }])
    setDraft({ label: '', months: '', monthlySalary: '' })
  }

  function removePeriod(id) {
    setPeriods((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <>
      <section className="card glow-card">
        <h2>Build your year</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Add a row for each stretch of the year at one salary — a raise, a new job, or unpaid months all count as
          separate periods. Everything recalculates live as you add rows.
        </p>
        <div className="ledger-form">
          <input
            type="text"
            placeholder="Label (e.g. 'Before raise')"
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            className="ledger-input ledger-input-label"
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="Months"
            value={draft.months}
            onChange={(e) => setDraft((d) => ({ ...d, months: e.target.value }))}
            className="ledger-input"
            style={{ flex: '0 1 100px' }}
          />
          <input
            type="number"
            inputMode="decimal"
            placeholder="₱ monthly salary"
            value={draft.monthlySalary}
            onChange={(e) => setDraft((d) => ({ ...d, monthlySalary: e.target.value }))}
            className="ledger-input ledger-input-amount"
          />
          <button type="button" className="btn-primary btn-small" onClick={addPeriod}>Add period</button>
        </div>

        {periods.length === 0 ? (
          <p className="empty-copy">No periods added yet.</p>
        ) : (
          <ul className="ledger-list">
            {periods.map((p) => (
              <li className="ledger-row" key={p.id}>
                <span className="ledger-row-main">
                  <span className="ledger-row-label">{p.label}</span>
                  <span className="ledger-row-category">{p.months} mo × {formatPHP(p.monthlySalary)}</span>
                </span>
                <span className="ledger-row-amount">{formatPHP(p.months * p.monthlySalary)}</span>
                <button type="button" className="ledger-row-remove" onClick={() => removePeriod(p.id)} aria-label={`Remove ${p.label}`}>×</button>
              </li>
            ))}
          </ul>
        )}
        {monthsCovered !== 12 && periods.length > 0 && (
          <p className="disclaimer" style={{ marginTop: 12 }}>
            Your periods cover {monthsCovered} of 12 months. Add a period for any remaining unpaid or unemployed
            months (₱0 salary) if you want the year fully accounted for — it won&apos;t change the tax total, but
            makes the picture complete.
          </p>
        )}

        <SaveToHistoryButton
          calculatorName="Variable Income"
          summary={
            hasPeriods
              ? `${formatPHP(result.incomeTax)} tax across ${periods.length} period${periods.length === 1 ? '' : 's'} (${monthsCovered} mo)`
              : ''
          }
          details={{
            periodsCount: periods.length,
            monthsCovered,
            totalBasicSalary: result?.totalBasicSalary,
            totalContributions: result?.totalContributions,
            taxableCompensation: result?.taxableCompensation,
            thirteenthMonthPay: result?.thirteenthMonth?.thirteenthMonthPay,
            incomeTax: result?.incomeTax,
          }}
          disabled={!hasPeriods}
        />
      </section>

      <div className="stat-grid">
        <StatTile label="Total Basic Salary" value={hasPeriods ? formatPHP(result.totalBasicSalary) : '—'} />
        <StatTile label="13th Month Pay" value={hasPeriods ? formatPHP(result.thirteenthMonth.thirteenthMonthPay) : '—'} />
        <StatTile label="Taxable Compensation" value={hasPeriods ? formatPHP(result.taxableCompensation) : '—'} />
        <StatTile label="Estimated Annual Tax" value={hasPeriods ? formatPHP(result.incomeTax) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Each period&apos;s contributions are computed at that period&apos;s own salary — not blended across the
          year — since SSS/PhilHealth/Pag-IBIG brackets depend on the actual monthly amount at the time. The total
          taxable compensation across all periods then runs through the same annual graduated table as any other
          employee return.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          If you had more than one employer during the year, note that you generally can&apos;t rely on substituted
          filing — you&apos;ll likely need to file BIR Form 1700 yourself, combining both employers&apos; 2316s.
        </p>
      </section>
    </>
  )
}
