'use client'

import { useState } from 'react'
import { computeEwt, EWT_CATEGORIES } from '@/lib/ewt'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

const NEEDS_PAYEE_INCOME = ['professional-individual', 'professional-corporate']

export default function EwtCalculator() {
  const [category, setCategory] = useState(EWT_CATEGORIES[0].id)
  const [amountInput, setAmountInput] = useState('')
  const [payeeIncomeInput, setPayeeIncomeInput] = useState('')

  const grossAmount = Math.max(0, Number(amountInput) || 0)
  const payeeAnnualIncome = Math.max(0, Number(payeeIncomeInput) || 0)
  const hasIncome = grossAmount > 0
  const needsPayeeIncome = NEEDS_PAYEE_INCOME.includes(category)

  const result = hasIncome ? computeEwt({ category, grossAmount, payeeAnnualIncome }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="ewt-category">Payment category</label>
          <select
            id="ewt-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="ledger-input ledger-select"
            style={{ width: '100%' }}
          >
            {EWT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ewt-amount">Gross payment amount (₱)</label>
          <input id="ewt-amount" type="number" inputMode="decimal" placeholder="e.g. 50000" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
        </div>
        {needsPayeeIncome && (
          <div className="field">
            <label htmlFor="ewt-payee-income">Payee&apos;s annual gross income (₱)</label>
            <input id="ewt-payee-income" type="number" inputMode="decimal" placeholder="e.g. 2000000" value={payeeIncomeInput} onChange={(e) => setPayeeIncomeInput(e.target.value)} />
            <p className="disclaimer" style={{ marginTop: 8, borderTop: 'none', paddingTop: 0 }}>
              The lower rate requires a sworn declaration on file from the payee confirming this figure.
            </p>
          </div>
        )}

        <SaveToHistoryButton
          calculatorName="Expanded Withholding Tax"
          summary={
            hasIncome
              ? `${formatPHP(result.withheld)} withheld (${(result.rate * 100).toFixed(0)}%) of ${formatPHP(grossAmount)}`
              : ''
          }
          details={{
            category: EWT_CATEGORIES.find((c) => c.id === category)?.label ?? category,
            grossAmount,
            payeeAnnualIncome: needsPayeeIncome ? payeeAnnualIncome : null,
            rateApplied: result?.rate,
            taxWithheld: result?.withheld,
            netPayment: result?.netPayment,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="stat-grid">
        <StatTile label="Rate" value={hasIncome ? `${(result.rate * 100).toFixed(0)}%` : '—'} />
        <StatTile label="Tax Withheld" value={hasIncome ? formatPHP(result.withheld) : '—'} />
        <StatTile label="Net Payment" value={hasIncome ? formatPHP(result.netPayment) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          EWT is a creditable withholding tax (RR 2-98 §2.58, as amended by RR 11-2018): the payor withholds a
          percentage of the payment and remits it to the BIR on the payee&apos;s behalf, using BIR Form 2307 as
          proof. The payee then credits the withheld amount against their own income tax due — it&apos;s an advance
          payment, not an extra tax. Government money payments use ATC codes WI640/WC640 (goods) and
          WI157/WC157 (services); the same 1%/2% rates apply to purchases by BIR-designated Top Withholding Agents.
        </p>
        <p className="empty-copy" style={{ marginTop: 10 }}>
          What this means for your cash flow: on a {formatPHP(grossAmount || 0)} invoice you only actually receive{' '}
          <strong>{formatPHP((result?.netPayment ?? 0))}</strong> — the rest is your advance tax. Collect your 2307
          certificates each quarter and credit them on the{' '}
          <a href="/calculators/quarterly-income-tax" style={{ color: 'var(--accent)' }}>Quarterly Income Tax (1701Q)</a>{' '}
          worksheet, or they&apos;re money left on the table.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          This covers the most common EWT categories for everyday transactions — not the full ~40-item ATC table,
          which includes narrower categories like income distributions to estate beneficiaries, general
          professional partnership shares, and cinematographic film rentals. Consult RR 2-98 §2.57.2 for the
          complete list if your transaction isn&apos;t one of these.
        </p>
      </section>
    </>
  )
}
