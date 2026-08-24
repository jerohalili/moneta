'use client'

import { useState } from 'react'
import { computePenalties } from '@/lib/penalties'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import ErrorFlags from './ErrorFlags'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function PenaltiesCalculator() {
  const [taxInput, setTaxInput] = useState('')
  const [daysInput, setDaysInput] = useState('')
  const [isFraud, setIsFraud] = useState(false)
  const [isMicroSmall, setIsMicroSmall] = useState(false)

  const basicTax = Math.max(0, Number(taxInput) || 0)
  const daysLate = Math.max(0, Number(daysInput) || 0)
  const hasIncome = basicTax > 0 && daysInput !== ''

  const result = hasIncome ? computePenalties({ basicTax, daysLate, isFraud, isMicroSmall }) : null

  const errors = []
  if (taxInput !== '' && basicTax === 0) errors.push('Enter the actual basic tax due — penalties are computed from that amount.')

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="basic-tax">Basic tax due (₱)</label>
          <input id="basic-tax" type="number" inputMode="decimal" placeholder="e.g. 50000" value={taxInput} onChange={(e) => setTaxInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="days-late">Days late</label>
          <input id="days-late" type="number" inputMode="decimal" placeholder="e.g. 45" value={daysInput} onChange={(e) => setDaysInput(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10 }}>
          <input type="checkbox" checked={isFraud} onChange={(e) => setIsFraud(e.target.checked)} />
          This involves willful neglect or a fraudulent/false return (50% surcharge instead of 25%)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={isMicroSmall} onChange={(e) => setIsMicroSmall(e.target.checked)} />
          I&apos;m classified as a Micro or Small taxpayer under the Ease of Paying Taxes Act (reduced rates)
        </label>

        <SaveToHistoryButton
          calculatorName="BIR Penalties"
          summary={
            hasIncome
              ? `${formatPHP(result.total)} total on ${formatPHP(basicTax)} basic, ${daysLate} days late${isFraud ? ' (fraud)' : ''}${isMicroSmall ? ' (micro/small)' : ''}`
              : ''
          }
          details={{
            basicTax,
            daysLate,
            willfulNeglectOrFraud: isFraud,
            microSmallClassification: isMicroSmall,
            surcharge: result?.surcharge,
            interest: result?.interest,
            compromiseEstimate: result?.compromise,
            totalAmountDue: result?.total,
          }}
          disabled={!hasIncome}
        />
      </section>

      <ErrorFlags errors={errors} />

      <div className="stat-grid">
        <StatTile label="Surcharge" value={hasIncome ? formatPHP(result.surcharge) : '—'} />
        <StatTile label="Interest" value={hasIncome ? formatPHP(result.interest) : '—'} />
        <StatTile label="Compromise (est.)" value={hasIncome ? formatPHP(result.compromise) : '—'} />
        <StatTile label="Total Amount Due" value={hasIncome ? formatPHP(result.total) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Surcharge is 25% of basic tax for ordinary late filing/payment, or 50% for willful neglect or fraud (NIRC
          Sec. 248). Interest is 12% per annum, prorated by days late (NIRC Sec. 249). The Ease of Paying Taxes Act
          (RA 11976) + RR 6-2024 reduce these to 10% surcharge and 6% interest for Micro/Small taxpayers — never the
          50% fraud rate, though.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          The compromise penalty figure is a representative estimate based on RMO 7-2015&apos;s bracket schedule,
          not an exact quote — source tables are inconsistent across violation types and BIR examiners have some
          discretion (compromise penalties are technically a consensual settlement in lieu of criminal
          prosecution, not a fixed statutory amount). Confirm your exact bracket at your RDO before paying.
        </p>
      </section>
    </>
  )
}
