'use client'

import { useState } from 'react'
import { computeCapitalGainsTax, computeDocumentaryStampTax, computeEstateTax, computeDonorsTax } from '@/lib/propertyTax'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'

const MODES = [
  { id: 'sale', label: 'Sale of Real Property', description: 'Capital gains tax + documentary stamp tax.' },
  { id: 'estate', label: 'Estate Tax', description: 'Tax on a decedent\u2019s net estate.' },
  { id: 'donor', label: "Donor's Tax", description: 'Tax on gifts made during the year.' },
]

export default function PropertyTaxCalculator() {
  const [mode, setMode] = useState('sale')

  return (
    <>
      <section className="card glow-card">
        <h2>What are you computing?</h2>
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

      {mode === 'sale' && <SaleMode />}
      {mode === 'estate' && <EstateMode />}
      {mode === 'donor' && <DonorMode />}
    </>
  )
}

function SaleMode() {
  const [priceInput, setPriceInput] = useState('')
  const [zonalInput, setZonalInput] = useState('')
  const [fmvInput, setFmvInput] = useState('')

  const sellingPrice = Math.max(0, Number(priceInput) || 0)
  const zonalValue = Math.max(0, Number(zonalInput) || 0)
  const fairMarketValue = Math.max(0, Number(fmvInput) || 0)
  const hasIncome = sellingPrice > 0 || zonalValue > 0 || fairMarketValue > 0

  const cgt = hasIncome ? computeCapitalGainsTax({ sellingPrice, zonalValue, fairMarketValue }) : null
  const dst = hasIncome ? computeDocumentaryStampTax({ sellingPrice, zonalValue, fairMarketValue }) : null

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Tax is based on whichever of these three is highest &mdash; enter what you have.
        </p>
        <div className="field">
          <label htmlFor="selling-price">Gross selling price (₱)</label>
          <input id="selling-price" type="number" inputMode="decimal" placeholder="e.g. 3000000" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="zonal-value">BIR zonal value (₱)</label>
          <input id="zonal-value" type="number" inputMode="decimal" placeholder="e.g. 2800000" value={zonalInput} onChange={(e) => setZonalInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="fmv">Assessor&apos;s fair market value (₱)</label>
          <input id="fmv" type="number" inputMode="decimal" placeholder="e.g. 2500000" value={fmvInput} onChange={(e) => setFmvInput(e.target.value)} />
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Tax Base (highest of the three)" value={hasIncome ? formatPHP(cgt.base) : '—'} />
        <StatTile label="Capital Gains Tax (6%)" value={hasIncome ? formatPHP(cgt.tax) : '—'} />
        <StatTile label="Documentary Stamp Tax (1.5%)" value={hasIncome ? formatPHP(dst.tax) : '—'} />
        <StatTile label="Total" value={hasIncome ? formatPHP(cgt.tax + dst.tax) : '—'} />
      </div>
      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Applies only to real property classified as a capital asset (not used in trade or business). CGT is 6%
          (NIRC Sec. 24(D)); DST is 1.5% (NIRC Sec. 196). Both use the higher of selling price, BIR zonal value, or
          the assessor&apos;s fair market value. Filed within 30 days of the sale (BIR Form 1706 for CGT).
        </p>
      </section>
    </>
  )
}

function EstateMode() {
  const [grossInput, setGrossInput] = useState('')
  const [familyHomeInput, setFamilyHomeInput] = useState('')
  const [otherInput, setOtherInput] = useState('')

  const grossEstate = Math.max(0, Number(grossInput) || 0)
  const familyHomeValue = Math.max(0, Number(familyHomeInput) || 0)
  const otherDeductions = Math.max(0, Number(otherInput) || 0)
  const hasIncome = grossEstate > 0

  const result = hasIncome ? computeEstateTax({ grossEstate, familyHomeValue, otherDeductions }) : null

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="gross-estate">Gross estate (₱)</label>
          <input id="gross-estate" type="number" inputMode="decimal" placeholder="e.g. 20000000" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="family-home">Family home value (₱, capped at ₱10,000,000 deduction)</label>
          <input id="family-home" type="number" inputMode="decimal" placeholder="e.g. 8000000" value={familyHomeInput} onChange={(e) => setFamilyHomeInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="other-deductions">Other allowable deductions (funeral, medical, claims against the estate, etc.) (₱)</label>
          <input id="other-deductions" type="number" inputMode="decimal" placeholder="e.g. 300000" value={otherInput} onChange={(e) => setOtherInput(e.target.value)} />
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Standard Deduction" value={formatPHP(5_000_000)} />
        <StatTile label="Family Home Deduction" value={hasIncome ? formatPHP(result.familyHomeDeduction) : '—'} />
        <StatTile label="Net Taxable Estate" value={hasIncome ? formatPHP(result.netEstate) : '—'} />
        <StatTile label="Estate Tax (6%)" value={hasIncome ? formatPHP(result.tax) : '—'} />
      </div>
      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Flat 6% of the net estate (NIRC Sec. 84, as amended by TRAIN): gross estate minus a ₱5,000,000 standard
          deduction, minus the family home value up to ₱10,000,000, minus other allowable deductions. Filed within
          one year of death (BIR Form 1801); up to a 30-day extension may be granted for meritorious cases.
        </p>
      </section>
    </>
  )
}

function DonorMode() {
  const [giftsInput, setGiftsInput] = useState('')
  const netGiftsThisYear = Math.max(0, Number(giftsInput) || 0)
  const hasIncome = netGiftsThisYear > 0
  const result = hasIncome ? computeDonorsTax({ netGiftsThisYear }) : null

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="net-gifts">Total net gifts this calendar year (₱)</label>
          <input id="net-gifts" type="number" inputMode="decimal" placeholder="e.g. 1000000" value={giftsInput} onChange={(e) => setGiftsInput(e.target.value)} />
          <p className="disclaimer" style={{ marginTop: 8 }}>
            The ₱250,000 exemption is cumulative per calendar year across all your donations, not per gift.
          </p>
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Exemption" value={formatPHP(250_000)} />
        <StatTile label="Taxable Gifts" value={hasIncome ? formatPHP(result.taxableGifts) : '—'} />
        <StatTile label="Donor's Tax (6%)" value={hasIncome ? formatPHP(result.tax) : '—'} />
      </div>
      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Flat 6% of total net gifts exceeding ₱250,000 in a calendar year (NIRC Sec. 99, as amended by TRAIN).
          Certain donations — to the national government, accredited NGOs, and others — are exempt regardless of
          amount and aren&apos;t modeled here.
        </p>
      </section>
    </>
  )
}
