'use client'

import { useState } from 'react'
import { computeEmployeeTax } from '@/lib/employeeTax'
import { formatPHP, formatPercent } from '@/lib/format'
import StatTile from './StatTile'
import ErrorFlags from './ErrorFlags'
import SaveToHistoryButton from './SaveToHistoryButton'

const MODES = [
  { id: 'single', label: 'One employer' },
  { id: 'multi', label: 'Multiple employers' },
  { id: 'smwe', label: 'Minimum wage earner' },
]

export default function EmployeeTaxCalculator() {
  const [mode, setMode] = useState('single')
  const [grossInput, setGrossInput] = useState('')
  const [contributionsInput, setContributionsInput] = useState('')
  const [withheldInput, setWithheldInput] = useState('')
  const [smwInput, setSmwInput] = useState('')

  const gross = Math.max(0, Number(grossInput) || 0)
  const contributions = Math.max(0, Number(contributionsInput) || 0)
  const withheld = mode === 'multi' && withheldInput.trim() !== '' ? Math.max(0, Number(withheldInput) || 0) : null
  const smw = mode === 'smwe' ? Math.max(0, Number(smwInput) || 0) : 0
  const hasIncome = gross > 0

  const result = hasIncome
    ? mode === 'smwe'
      ? computeEmployeeTax({ grossCompensation: Math.max(0, gross - smw), mandatoryContributions: contributions })
      : computeEmployeeTax({ grossCompensation: gross, mandatoryContributions: contributions, withheldTax: withheld })
    : null

  const effectiveRate = result && gross > 0 ? result.incomeTax / gross : null

  const errors = []
  if (contributionsInput !== '' && contributions > gross) {
    errors.push('Your contributions exceed your gross compensation — double-check the numbers.')
  }
  if (mode === 'smwe' && smw > gross && gross > 0) {
    errors.push('The minimum wage you entered exceeds your gross compensation — the exemption can\'t reduce taxable income below zero.')
  }

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>

        <div className="field">
          <label>Your situation</label>
          <div className="auth-mode-toggle" style={{ justifyContent: 'flex-start' }}>
            {MODES.map((m) => (
              <label key={m.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                <input type="radio" checked={mode === m.id} onChange={() => setMode(m.id)} />
                {m.label}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label htmlFor="gross-comp">
            {mode === 'multi' ? 'Combined annual gross compensation from ALL employers (₱)' : 'Annual gross compensation (₱)'}
          </label>
          <input
            id="gross-comp"
            type="number"
            inputMode="decimal"
            placeholder={mode === 'multi' ? 'e.g. 420000 + 300000 = 720000' : 'e.g. 600000'}
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value)}
          />
        </div>

        {mode === 'multi' && (
          <div className="field">
            <label htmlFor="withheld">Total tax withheld by ALL employers this year (₱) — from your 2316s</label>
            <input
              id="withheld"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 55000"
              value={withheldInput}
              onChange={(e) => setWithheldInput(e.target.value)}
            />
          </div>
        )}

        {mode === 'smwe' && (
          <div className="field">
            <label htmlFor="smw">Statutory minimum wage in YOUR region, annualized (₱)</label>
            <input
              id="smw"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 167700 — NCR non-agri ₱645/day × ~260 days"
              value={smwInput}
              onChange={(e) => setSmwInput(e.target.value)}
            />
          </div>
        )}

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
          summary={
            hasIncome
              ? mode === 'multi' && result.balanceDue !== null && result.balanceDue > 0
                ? `Tax ${formatPHP(result.incomeTax)}, balance due at 1700 ≈ ${formatPHP(result.balanceDue)}`
                : `Tax ${formatPHP(result.incomeTax)} on ${formatPHP(gross)} gross`
              : ''
          }
          details={{
            mode,
            grossCompensation: gross,
            contributions,
            withheldTax: withheld,
            smwAnnual: mode === 'smwe' ? smw : null,
            taxableCompensation: result?.taxableCompensation,
            incomeTax: result?.incomeTax,
            balanceDue: result?.balanceDue,
            overpayment: result?.overpayment,
          }}
          disabled={!hasIncome}
        />
      </section>

      <ErrorFlags errors={errors} />

      <div className="stat-grid">
        <StatTile label="Taxable Compensation" value={hasIncome ? formatPHP(result.taxableCompensation) : '—'} />
        <StatTile label="Estimated Income Tax" value={hasIncome ? formatPHP(result.incomeTax) : '—'} />
        <StatTile label="Effective Rate" value={hasIncome ? formatPercent(effectiveRate) : '—'} />
        {mode === 'multi' ? (
          <StatTile
            label={result?.overpayment > 0 ? 'Overpaid (refundable at 1700)' : result?.balanceDue > 0 ? 'Balance Due at 1700 Filing' : 'Withholding vs. Tax Due'}
            value={
              !hasIncome || withheld === null
                ? 'Enter withheld total'
                : result.overpayment > 0
                  ? formatPHP(result.overpayment)
                  : result.balanceDue > 0
                    ? formatPHP(result.balanceDue)
                    : 'Fully covered'
            }
          />
        ) : mode === 'smwe' ? (
          <StatTile
            label="Exempt Minimum-Wage Portion"
            value={hasIncome ? `${formatPHP(Math.min(smw, gross))} exempt` : '—'}
          />
        ) : (
          <StatTile label="Est. Take-Home" value={hasIncome ? formatPHP(gross - contributions - result.incomeTax) : '—'} />
        )}
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Taxable compensation = gross compensation minus mandatory contributions, run through the same annual
          graduated bracket table BIR uses to true up withholding at year-end (NIRC Sec. 24(A)).
          {mode === 'multi' && (
            ' With multiple employers, each employer withholds against their own salary alone — neither sees your combined income, so the combined withholding rarely matches the tax on the combined total. You must file BIR Form 1700 yourself by April 15 and settle any balance.'
          )}
          {mode === 'smwe' && (
            ' As a statutory minimum wage earner, the minimum-wage portion of your pay is income-tax exempt (RA 9504, RR 10-2008) — only compensation above your region\'s SMW, minus contributions, is taxed. Holiday pay, overtime, and night differential are taxable even for minimum wage earners.'
          )}
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          Enter regular taxable compensation only — exclude 13th-month pay and other de minimis benefits up to
          ₱90,000, since those are tax-exempt (use the 13th Month Pay calculator for that figure separately).
        </p>
      </section>
    </>
  )
}
