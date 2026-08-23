'use client'

import { useState } from 'react'
import { computeMonthlyContributions } from '@/lib/contributions'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'

export default function ContributionsCalculator() {
  const [monthlyInput, setMonthlyInput] = useState('')
  const monthly = Math.max(0, Number(monthlyInput) || 0)
  const hasIncome = monthly > 0
  const result = hasIncome ? computeMonthlyContributions({ monthlyCompensation: monthly }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="monthly-comp">Monthly gross compensation (₱)</label>
          <input
            id="monthly-comp"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 30000"
            value={monthlyInput}
            onChange={(e) => setMonthlyInput(e.target.value)}
          />
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Your Monthly Share" value={hasIncome ? formatPHP(result.totalEmployee) : '—'} />
        <StatTile label="Employer's Monthly Share" value={hasIncome ? formatPHP(result.totalEmployer) : '—'} />
        <StatTile label="Your Annual Total" value={hasIncome ? formatPHP(result.totalEmployee * 12) : '—'} />
      </div>

      <section className="card">
        <h2>Breakdown</h2>
        <div className="route-comparison">
          <div className="route-card">
            <div className="route-card-name">SSS (15% of Monthly Salary Credit)</div>
            <div className="route-card-total">{hasIncome ? formatPHP(result.sss.employee) : '—'}</div>
            <dl className="route-card-detail">
              <div><dt>Your share (5%)</dt><dd>{hasIncome ? formatPHP(result.sss.employee) : '—'}</dd></div>
              <div><dt>Employer share (10% + EC)</dt><dd>{hasIncome ? formatPHP(result.sss.employer) : '—'}</dd></div>
              <div><dt>Estimated MSC</dt><dd>{hasIncome ? formatPHP(result.msc) : '—'}</dd></div>
            </dl>
          </div>
          <div className="route-card">
            <div className="route-card-name">PhilHealth (5% of monthly basic)</div>
            <div className="route-card-total">{hasIncome ? formatPHP(result.philhealth.employee) : '—'}</div>
            <dl className="route-card-detail">
              <div><dt>Your share (2.5%)</dt><dd>{hasIncome ? formatPHP(result.philhealth.employee) : '—'}</dd></div>
              <div><dt>Employer share (2.5%)</dt><dd>{hasIncome ? formatPHP(result.philhealth.employer) : '—'}</dd></div>
            </dl>
          </div>
          <div className="route-card">
            <div className="route-card-name">Pag-IBIG (2% each, ₱10,000 ceiling)</div>
            <div className="route-card-total">{hasIncome ? formatPHP(result.pagibig.employee) : '—'}</div>
            <dl className="route-card-detail">
              <div><dt>Your share</dt><dd>{hasIncome ? formatPHP(result.pagibig.employee) : '—'}</dd></div>
              <div><dt>Employer share</dt><dd>{hasIncome ? formatPHP(result.pagibig.employer) : '—'}</dd></div>
            </dl>
          </div>
        </div>
        <p className="disclaimer" style={{ marginTop: 16 }}>
          SSS uses a bracket system (Monthly Salary Credit) officially assigned from a published salary-range table.
          This estimates your MSC by rounding to the nearest ₱500 within the ₱5,000–₱35,000 band — accurate almost
          everywhere, but check the official SSS table if your salary sits right on a ₱500 line. Rates current as
          of Aug 2026; verify against sss.gov.ph, philhealth.gov.ph, and pagibigfund.gov.ph if you&apos;re reading
          this later, since these schedules are revised periodically by circular.
        </p>
      </section>
    </>
  )
}
