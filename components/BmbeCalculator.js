'use client'

import { useState } from 'react'
import { computeBmbeSavings } from '@/lib/bmbe'
import { formatPHP } from '@/lib/format'
import { BMBE_ASSET_CEILING } from '@/data/taxRates2026'
import StatTile from './StatTile'

export default function BmbeCalculator() {
  const [assetsInput, setAssetsInput] = useState('')
  const [grossInput, setGrossInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')

  const totalAssets = Math.max(0, Number(assetsInput) || 0)
  const grossReceipts = Math.max(0, Number(grossInput) || 0)
  const itemizedExpenses = Math.max(0, Number(expensesInput) || 0)
  const hasIncome = assetsInput !== '' && grossReceipts > 0

  const result = hasIncome ? computeBmbeSavings({ totalAssets, grossReceipts, itemizedExpenses }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="bmbe-assets">Total business assets, excluding land (₱)</label>
          <input id="bmbe-assets" type="number" inputMode="decimal" placeholder="e.g. 1200000" value={assetsInput} onChange={(e) => setAssetsInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bmbe-gross">Annual gross receipts (₱)</label>
          <input id="bmbe-gross" type="number" inputMode="decimal" placeholder="e.g. 900000" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bmbe-expenses">Itemized business expenses, if any (₱)</label>
          <input id="bmbe-expenses" type="number" inputMode="decimal" placeholder="e.g. 200000" value={expensesInput} onChange={(e) => setExpensesInput(e.target.value)} />
        </div>
      </section>

      {hasIncome && (
        <div className="error-flags">
          <div
            className="error-flag"
            style={
              result.eligible
                ? { color: 'var(--accent)', background: 'var(--accent-soft)', borderColor: 'var(--accent)' }
                : {}
            }
          >
            <span className="error-flag-icon" aria-hidden="true">{result.eligible ? '✓' : '⚠'}</span>
            {result.eligible
              ? `Eligible — your assets are under the ${formatPHP(BMBE_ASSET_CEILING)} ceiling.`
              : `Not eligible — your assets exceed the ${formatPHP(BMBE_ASSET_CEILING)} ceiling.`}
          </div>
        </div>
      )}

      <div className="stat-grid">
        <StatTile label="Income Tax Without BMBE" value={hasIncome ? formatPHP(result.incomeTaxWithoutBmbe) : '—'} />
        <StatTile label="Income Tax As BMBE" value={hasIncome ? formatPHP(result.incomeTaxAsBmbe) : '—'} />
        <StatTile label="Annual Savings" value={hasIncome ? formatPHP(result.savings) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          A Barangay Micro Business Enterprise (RA 9178) with total assets — excluding land — not exceeding{' '}
          {formatPHP(BMBE_ASSET_CEILING)} is 100% exempt from income tax on income from its operations (NIRC Sec.
          27(D)). This isn&apos;t automatic: you need a BMBE Certificate of Authority from DTI (sole
          proprietorships) or your city/municipal office (partnerships, corporations, cooperatives), registered
          with your RDO.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          BMBE status only exempts income tax — you&apos;re still subject to percentage tax or VAT (whichever
          applies), and other national/local taxes, unless your LGU separately grants local tax relief. Certain
          licensed professionals (lawyers, doctors, accountants, etc. practicing their profession) can&apos;t
          register as a BMBE regardless of asset size.
        </p>
      </section>
    </>
  )
}
