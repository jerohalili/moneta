'use client'

import { useState } from 'react'
import { computeEmployeeTax } from '@/lib/employeeTax'
import { formatPHP, formatPercent } from '@/lib/format'
import StatTile from './StatTile'
import ErrorFlags from './ErrorFlags'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function EmployeeTaxCalculator() {
  const [grossInput, setGrossInput] = useState('')
  const [contributionsInput, setContributionsInput] = useState('')

  const gross = Math.max(0, Number(grossInput) || 0)
  const contributions = Math.max(0, Number(contributionsInput) || 0)
  const hasIncome = gross > 0

  const result = hasIncome ? computeEmployeeTax({ grossCompensation: gross, mandatoryContributions: contributions }) : null
  const effectiveRate = result && gross > 0 ? result.incomeTax / gross : null

  const errors = []
  if (contributionsInput !== '' && contributions > gross) {
    errors.push('Your contributions exceed your gross compensation — double-check the numbers.')
  }

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="gross-comp">Annual gross compensation (₱)</label>
          <input
            id="gross-comp"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 600000"
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="contributions">Total SSS + PhilHealth + Pag-IBIG contributions this year (₱)</label>
          <input
            id="contributions"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 21000"
            value={contributionsInput}
            onChange={(e) => setContributionsInput(e.target.value)}
          />
          <p className="disclaimer" style={{ marginTop: 8, borderTop: 'none', paddingTop: 0 }}>
            Not sure? Use the Contributions calculator to compute this automatically from your monthly pay.
          </p>
        </div>

        <SaveToHistoryButton
          calculatorName="Employee Income Tax"
          summary={hasIncome ? `Tax ${formatPHP(result.incomeTax)} on ${formatPHP(gross)} gross` : ''}
          details={{
            grossCompensation: gross,
            contributions,
            taxableCompensation: result?.taxableCompensation,
            incomeTax: result?.incomeTax,
          }}
          disabled={!hasIncome}
        />
      </section>

      <ErrorFlags errors={errors} />

      <div className="stat-grid">
        <StatTile label="Taxable Compensation" value={hasIncome ? formatPHP(result.taxableCompensation) : '—'} />
        <StatTile label="Estimated Income Tax" value={hasIncome ? formatPHP(result.incomeTax) : '—'} />
        <StatTile label="Effective Rate" value={hasIncome ? formatPercent(effectiveRate) : '—'} />
        <StatTile label="Est. Take-Home" value={hasIncome ? formatPHP(gross - contributions - result.incomeTax) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Taxable compensation = gross compensation minus mandatory contributions, run through the same annual
          graduated bracket table BIR uses to true up withholding at year-end (NIRC Sec. 24(A)).
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          Enter regular taxable compensation only — exclude 13th-month pay and other de minimis benefits up to
          ₱90,000, since those are tax-exempt (use the 13th Month Pay calculator for that figure separately). This
          also assumes a single employer for the full year; multiple employers in the same year have stricter
          filing requirements (no substituted filing) not modeled here.
        </p>
      </section>
    </>
  )
}
