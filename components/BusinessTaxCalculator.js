'use client'

import { useState } from 'react'
import { computePercentageTax, computeVat } from '@/lib/percentageTax'
import { formatPHP } from '@/lib/format'
import { RATES } from '@/lib/taxConfig'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

const MODES = [
  { id: 'percentage', label: 'Percentage Tax', description: 'Non-VAT-registered, 3% of gross.' },
  { id: 'vat', label: 'VAT', description: 'VAT-registered, output minus input.' },
]

export default function BusinessTaxCalculator() {
  const [mode, setMode] = useState('percentage')

  return (
    <>
      <section className="card glow-card">
        <h2>Which are you filing?</h2>
        <div className="profile-type-grid">
          {MODES.map((m) => (
            <button
              type="button"
              key={m.id}
              className={mode === m.id ? 'profile-type-card is-selected' : 'profile-type-card'}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
            >
              <span className="profile-type-label">{m.label}</span>
              <span className="profile-type-description">{m.description}</span>
            </button>
          ))}
        </div>
      </section>

      {mode === 'percentage' ? <PercentageMode /> : <VatMode />}
    </>
  )
}

function PercentageMode() {
  const [grossInput, setGrossInput] = useState('')
  const gross = Math.max(0, Number(grossInput) || 0)
  const hasIncome = gross > 0
  const result = hasIncome ? computePercentageTax({ grossSales: gross }) : null

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="gross-sales">Gross sales/receipts this quarter (₱)</label>
          <input id="gross-sales" type="number" inputMode="decimal" placeholder="e.g. 400000" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} />
        </div>

        <SaveToHistoryButton
          calculatorName="Percentage Tax"
          summary={
            hasIncome
              ? result.requiresVat
                ? `VAT required at ${formatPHP(gross)} quarterly`
                : `${formatPHP(result.tax)} on ${formatPHP(gross)} quarterly`
              : ''
          }
          details={{
            grossSalesQuarterly: gross,
            percentageTaxRate: RATES.PERCENTAGE_TAX_RATE,
            percentageTaxDue: result?.requiresVat ? null : result?.tax,
            vatRegistrationRequired: result?.requiresVat ?? null,
          }}
          disabled={!hasIncome}
        />
      </section>

      {hasIncome && result.requiresVat && (
        <div className="error-flags">
          <div className="error-flag">
            <span className="error-flag-icon" aria-hidden="true">⚠</span>
            Gross sales/receipts above {formatPHP(RATES.VAT_THRESHOLD)} require VAT registration — percentage tax no
            longer applies. Switch to the VAT mode above.
          </div>
        </div>
      )}

      <div className="stat-grid">
        <StatTile label={`Percentage Tax (${RATES.PERCENTAGE_TAX_RATE * 100}%)`} value={hasIncome && !result.requiresVat ? formatPHP(result.tax) : '—'} />
        <StatTile label="VAT Threshold" value={formatPHP(RATES.VAT_THRESHOLD)} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          A non-VAT-registered business that did not elect the 8% flat-tax option pays {RATES.PERCENTAGE_TAX_RATE * 100}%
          percentage tax on gross sales/receipts (NIRC Sec. 116), filed quarterly via BIR Form 2551Q.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          If you&apos;re a self-employed individual or sole proprietor comparing the 8% option against the
          graduated rate, use the Freelancer calculator instead — it already runs this comparison for you.
        </p>
      </section>
    </>
  )
}

function VatMode() {
  const [salesInput, setSalesInput] = useState('')
  const [purchasesInput, setPurchasesInput] = useState('')
  const vatableSales = Math.max(0, Number(salesInput) || 0)
  const vatablePurchases = Math.max(0, Number(purchasesInput) || 0)
  const hasIncome = salesInput !== ''
  const result = hasIncome ? computeVat({ vatableSales, vatablePurchases }) : null

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="vatable-sales">Vatable sales this period (₱)</label>
          <input id="vatable-sales" type="number" inputMode="decimal" placeholder="e.g. 1000000" value={salesInput} onChange={(e) => setSalesInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="vatable-purchases">Vatable purchases/expenses this period (₱)</label>
          <input id="vatable-purchases" type="number" inputMode="decimal" placeholder="e.g. 400000" value={purchasesInput} onChange={(e) => setPurchasesInput(e.target.value)} />
        </div>

        <SaveToHistoryButton
          calculatorName="VAT"
          summary={
            hasIncome
              ? `${formatPHP(result.vatPayable)} payable (output ${formatPHP(result.outputVat)} − input ${formatPHP(result.inputVat)})`
              : ''
          }
          details={{
            vatableSales: vatableSales,
            vatablePurchases: vatablePurchases,
            vatRate: RATES.VAT_RATE,
            outputVat: result?.outputVat,
            inputVat: result?.inputVat,
            vatPayable: result?.vatPayable,
            excessInputVatCarryover: result?.excessInputVat,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="stat-grid">
        <StatTile label={`Output VAT (${RATES.VAT_RATE * 100}%)`} value={hasIncome ? formatPHP(result.outputVat) : '—'} />
        <StatTile label={`Input VAT (${RATES.VAT_RATE * 100}%)`} value={hasIncome ? formatPHP(result.inputVat) : '—'} />
        <StatTile label="VAT Payable" value={hasIncome ? formatPHP(result.vatPayable) : '—'} />
        <StatTile label="Excess Input VAT (carryover)" value={hasIncome ? formatPHP(result.excessInputVat) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          VAT payable = output VAT (12% of vatable sales) minus input VAT (12% of vatable purchases), NIRC Sec.
          106/110. If input VAT exceeds output VAT, the excess carries over as a credit against future periods
          rather than being refunded immediately.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          This is a simplified net computation for an all-vatable business. It doesn&apos;t model zero-rated or
          VAT-exempt sales mixed with vatable ones, input VAT apportionment when both apply, transitional/presumptive
          input VAT, or capital goods amortization rules — all real complications for a lot of actual VAT filers.
          Treat this as a starting estimate, not a substitute for proper books.
        </p>
      </section>
    </>
  )
}
