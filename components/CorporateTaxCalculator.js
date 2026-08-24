'use client'

import { useState } from 'react'
import { computeCorporateTax } from '@/lib/corporateTax'
import { formatPHP } from '@/lib/format'
import { RATES } from '@/lib/taxConfig'
import StatTile from './StatTile'

export default function CorporateTaxCalculator() {
  const [grossIncomeInput, setGrossIncomeInput] = useState('')
  const [netIncomeInput, setNetIncomeInput] = useState('')
  const [assetsInput, setAssetsInput] = useState('')
  const [yearsInput, setYearsInput] = useState('')

  const grossIncome = Math.max(0, Number(grossIncomeInput) || 0)
  const netTaxableIncome = Math.max(0, Number(netIncomeInput) || 0)
  const totalAssets = Math.max(0, Number(assetsInput) || 0)
  const yearsInOperation = Math.max(0, Number(yearsInput) || 0)
  const hasIncome = grossIncomeInput !== '' && netIncomeInput !== '' && assetsInput !== ''

  const result = hasIncome ? computeCorporateTax({ grossIncome, netTaxableIncome, totalAssets, yearsInOperation }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="corp-gross">Gross income (₱)</label>
          <input id="corp-gross" type="number" inputMode="decimal" placeholder="e.g. 8000000" value={grossIncomeInput} onChange={(e) => setGrossIncomeInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="corp-net">Net taxable income (₱)</label>
          <input id="corp-net" type="number" inputMode="decimal" placeholder="e.g. 3000000" value={netIncomeInput} onChange={(e) => setNetIncomeInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="corp-assets">Total assets, excluding land (₱)</label>
          <input id="corp-assets" type="number" inputMode="decimal" placeholder="e.g. 40000000" value={assetsInput} onChange={(e) => setAssetsInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="corp-years">Years in operation</label>
          <input id="corp-years" type="number" inputMode="decimal" placeholder="e.g. 5" value={yearsInput} onChange={(e) => setYearsInput(e.target.value)} />
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Applicable RCIT Rate" value={hasIncome ? `${(result.rcitRate * 100).toFixed(0)}%` : '—'} />
        <StatTile label="RCIT" value={hasIncome ? formatPHP(result.rcit) : '—'} />
        <StatTile label="MCIT (2% of gross)" value={hasIncome && result.mcitApplies ? formatPHP(result.mcit) : 'N/A'} />
        <StatTile label="Tax Due (higher of the two)" value={hasIncome ? formatPHP(result.tax) : '—'} />
      </div>

      {hasIncome && result.usedMcit && (
        <div className="error-flags">
          <div className="error-flag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
            <span className="error-flag-icon" aria-hidden="true">ℹ</span>
            MCIT is higher than RCIT this year, so that&apos;s what&apos;s due. Track this — excess MCIT over RCIT
            can be carried forward and credited against RCIT for the next 3 taxable years.
          </div>
        </div>
      )}

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Under the CREATE Act (RA 11534), the corporation pays whichever is higher of Regular Corporate Income Tax
          (RCIT) or Minimum Corporate Income Tax (MCIT). RCIT is 20% if net taxable income doesn&apos;t exceed{' '}
          {formatPHP(RATES.CORPORATE_SMALL_INCOME_CEILING)} AND total assets (excluding land) don&apos;t exceed{' '}
          {formatPHP(RATES.CORPORATE_SMALL_ASSET_CEILING)} — otherwise 25%. MCIT is 2% of gross income, and only applies
          starting the 4th taxable year of operations.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          This covers only the standard RCIT/MCIT track for an ordinary domestic corporation. It doesn&apos;t model
          PEZA/BOI incentive regimes (Income Tax Holiday, 5% Special Corporate Income Tax, Enhanced Deductions) —
          those follow entirely different rules under your specific Investment Promotion Agency registration.
        </p>
      </section>
    </>
  )
}
