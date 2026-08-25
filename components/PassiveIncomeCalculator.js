'use client'

import { useState } from 'react'
import { computePassiveIncomeTax, PASSIVE_INCOME_TYPES } from '@/lib/passiveIncome'
import { formatPHP, formatPercent } from '@/lib/format'
import { RATES } from '@/lib/taxConfig'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

const NEEDS_COST = ['cgt-shares']

export default function PassiveIncomeCalculator() {
  const [typeId, setTypeId] = useState(PASSIVE_INCOME_TYPES[0].id)
  const [amountInput, setAmountInput] = useState('')
  const [costInput, setCostInput] = useState('')

  const gross = Math.max(0, Number(amountInput) || 0)
  const cost = Math.max(0, Number(costInput) || 0)
  const type = PASSIVE_INCOME_TYPES.find((t) => t.id === typeId)
  const hasIncome = gross > 0
  const needsCost = NEEDS_COST.includes(typeId)

  const result = hasIncome ? computePassiveIncomeTax({ typeId, gross, cost }) : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="passive-type">Income type</label>
          <select
            id="passive-type"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="ledger-input ledger-select"
            style={{ width: '100%' }}
          >
            {PASSIVE_INCOME_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="passive-amount">
            {needsCost ? 'Gross selling price of the shares (₱)' : 'Gross amount received this year (₱)'}
          </label>
          <input
            id="passive-amount"
            type="number"
            inputMode="decimal"
            placeholder={needsCost ? 'e.g. 150000' : 'e.g. 25000'}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
          />
        </div>
        {needsCost && (
          <div className="field">
            <label htmlFor="passive-cost">Total acquisition cost of the shares (₱)</label>
            <input
              id="passive-cost"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 100000"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
            />
            <p className="empty-copy" style={{ marginTop: 6 }}>
              The tax hits the GAIN (selling price minus cost), not the full proceeds — keep your broker confirmations.
            </p>
          </div>
        )}

        <SaveToHistoryButton
          calculatorName="Passive Income Final Tax"
          summary={
            hasIncome
              ? `${formatPHP(result.tax)} final tax (${formatPercent(result.rate)}) on ${formatPHP(result.base)} taxable`
              : ''
          }
          details={{
            passiveType: type?.label,
            grossAmount: gross,
            acquisitionCost: needsCost ? cost : null,
            rateApplied: result?.rate,
            taxableBase: result?.base,
            finalTax: result?.tax,
            netReceipt: result?.netReceipt,
          }}
          disabled={!hasIncome}
        />
      </section>

      {result && (
        <div className="stat-grid">
          <StatTile label="Final Tax Rate" value={formatPercent(result.rate)} />
          <StatTile label="Taxable Base" value={formatPHP(result.base)} />
          <StatTile label="Final Tax" value={formatPHP(result.tax)} />
          <StatTile label="Net Amount You Keep" value={formatPHP(result.netReceipt)} />
        </div>
      )}

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Passive income pays FINAL taxes: the bank, corporation, or payor withholds the tax at source and remits it
          to the BIR for you ({type?.citation}). You never add these amounts to your annual graduated return, never
          deduct expenses against them, and never file for them — the withheld amount is the whole liability. That
         &apos;s why a 20% final tax on interest is genuinely 20%, while your business income might effectively tax
          at far less after deductions and the ₱250,000 exemption.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          Fully EXEMPT passive receipts this calculator doesn&apos;t need to compute: life insurance proceeds,
          SSS/GSIS/PhilHealth benefits, prizes at or below {formatPHP(RATES.FINAL_TAX_PRIZES_EXEMPTION)} per
          occasion, and return of principal (capital) on investments. Royalties and director&apos;s fees may ALSO
          carry creditable EWT — that withholding is credited against this final tax where both apply. Dividends
          from FOREIGN corporations don&apos;t qualify for the 10% rate and are generally part of regular income.
        </p>
      </section>
    </>
  )
}
