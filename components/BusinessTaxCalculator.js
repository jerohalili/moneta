'use client'

import { useState } from 'react'
import { computePercentageTax } from '@/lib/percentageTax'
import { formatPHP } from '@/lib/format'
import { VAT_THRESHOLD, VAT_RATE } from '@/data/taxRates2026'
import StatTile from './StatTile'

export default function BusinessTaxCalculator() {
  const [grossInput, setGrossInput] = useState('')
  const gross = Math.max(0, Number(grossInput) || 0)
  const hasIncome = gross > 0
  const result = hasIncome ? computePercentageTax({ grossSales: gross }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="gross-sales">Gross sales/receipts this quarter (₱)</label>
          <input
            id="gross-sales"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 400000"
            value={grossInput}
            onChange={(e) => setGrossInput(e.target.value)}
          />
        </div>
      </section>

      {hasIncome && result.requiresVat && (
        <div className="error-flags">
          <div className="error-flag">
            <span className="error-flag-icon" aria-hidden="true">⚠</span>
            Gross sales/receipts above {formatPHP(VAT_THRESHOLD)} require VAT registration — percentage tax no
            longer applies. This tool doesn&apos;t model VAT input/output credits yet (see the roadmap).
          </div>
        </div>
      )}

      <div className="stat-grid">
        <StatTile label="Percentage Tax (3%)" value={hasIncome && !result.requiresVat ? formatPHP(result.tax) : '—'} />
        <StatTile label="VAT Threshold" value={formatPHP(VAT_THRESHOLD)} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          A non-VAT-registered business that did not elect the 8% flat-tax option pays 3% percentage tax on gross
          sales/receipts (NIRC Sec. 116), filed quarterly via BIR Form 2551Q.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          If you&apos;re a self-employed individual or sole proprietor comparing the 8% option against the
          graduated rate, use the Freelancer calculator instead — it already runs this comparison for you.
          VAT ({VAT_RATE * 100}%) input/output-credit modeling for VAT-registered businesses isn&apos;t built yet.
        </p>
      </section>
    </>
  )
}
