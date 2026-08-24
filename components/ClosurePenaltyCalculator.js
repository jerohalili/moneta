'use client'

import { useState } from 'react'
import { computeClosurePenalty } from '@/lib/closurePenalty'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function ClosurePenaltyCalculator() {
  const [countInput, setCountInput] = useState('')
  const count = Math.max(0, Number(countInput) || 0)
  const hasIncome = countInput !== '' && count > 0
  const result = hasIncome ? computeClosurePenalty({ unfiledReturnsCount: count }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="unfiled-count">Number of unfiled returns since you stopped operating</label>
          <input id="unfiled-count" type="number" inputMode="decimal" placeholder="e.g. 18" value={countInput} onChange={(e) => setCountInput(e.target.value)} />
          <p className="disclaimer" style={{ marginTop: 8, borderTop: 'none', paddingTop: 0 }}>
            Count every monthly/quarterly percentage tax, VAT, and withholding return, plus annual ITRs, that came
            due after you stopped but before you filed a formal closure with BIR. If you&apos;re not sure, check
            your Certificate of Registration for which forms you were required to file.
          </p>
        </div>

        <SaveToHistoryButton
          calculatorName="Closure Penalty"
          summary={hasIncome ? `${count} unfiled returns — est. ${formatPHP(result.estimatedTotal)}` : ''}
          details={{
            unfiledReturnsCount: count,
            minimumCompromisePerReturn: result?.perReturnMinimum,
            estimatedTotal: result?.estimatedTotal,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="stat-grid">
        <StatTile label="Minimum Compromise per Return" value={hasIncome ? formatPHP(result.perReturnMinimum) : '—'} />
        <StatTile label="Estimated Total" value={hasIncome ? formatPHP(result.estimatedTotal) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          A business doesn&apos;t stop owing BIR filings just because it stopped operating — filing obligations
          continue until you formally close (BIR Form 1905/1906, surrendering your Certificate of Registration and
          unused receipts/invoices). Every missed return typically draws at least the minimum compromise penalty
          (₱1,000, per RMO 7-2015) even with zero tax due, and these accumulate the longer closure is delayed.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          This is a floor estimate using only the minimum compromise penalty — it doesn&apos;t include surcharge or
          interest, which apply on top if any of those unfiled returns actually had tax due. Use the BIR Penalties
          calculator for that portion if applicable. The compromise figure itself is a representative estimate, not
          an exact BIR quote (see the note there). The single biggest lever here is simply filing the closure now —
          every month of delay is more accumulated minimums.
        </p>
      </section>
    </>
  )
}
