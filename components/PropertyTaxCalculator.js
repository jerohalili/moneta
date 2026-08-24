'use client'

import { useState } from 'react'
import { computeCapitalGainsTax, computeDocumentaryStampTax, computeEstateTax, computeDonorsTax } from '@/lib/propertyTax'
import { computeRealPropertyTax } from '@/lib/realPropertyTax'
import { formatPHP } from '@/lib/format'
import { RATES } from '@/lib/taxConfig'
import StatTile from './StatTile'

const MODES = [
  { id: 'sale', label: 'Sale of Real Property', description: 'Capital gains tax + documentary stamp tax.' },
  { id: 'estate', label: 'Estate Tax', description: 'Tax on a decedent\u2019s net estate.' },
  { id: 'donor', label: "Donor's Tax", description: 'Tax on gifts made during the year.' },
  { id: 'rpt', label: 'Real Property Tax', description: 'Annual tax based on assessed value.' },
  { id: 'other-dst', label: 'DST — Loans & Leases', description: 'Documentary stamp tax on other instruments.' },
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
      {mode === 'rpt' && <RptMode />}
      {mode === 'other-dst' && <OtherDstMode />}
    </>
  )
}

function SaleMode() {
  const [priceInput, setPriceInput] = useState('')
  const [zonalInput, setZonalInput] = useState('')
  const [fmvInput, setFmvInput] = useState('')
  const [notarizedInput, setNotarizedInput] = useState('')

  const sellingPrice = Math.max(0, Number(priceInput) || 0)
  const zonalValue = Math.max(0, Number(zonalInput) || 0)
  const fairMarketValue = Math.max(0, Number(fmvInput) || 0)
  const hasIncome = sellingPrice > 0 || zonalValue > 0 || fairMarketValue > 0

  const cgt = hasIncome ? computeCapitalGainsTax({ sellingPrice, zonalValue, fairMarketValue }) : null
  const dst = hasIncome ? computeDocumentaryStampTax({ sellingPrice, zonalValue, fairMarketValue }) : null

  let cgtDeadline = null
  let dstDeadline = null
  if (notarizedInput) {
    const notarized = new Date(notarizedInput + 'T00:00:00')
    cgtDeadline = new Date(notarized)
    cgtDeadline.setDate(cgtDeadline.getDate() + 30)
    // DST (BIR Form 2000-OT): on or before the 5th day of the month following notarization
    dstDeadline = new Date(notarized.getFullYear(), notarized.getMonth() + 1, 5)
  }

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
        <div className="field">
          <label htmlFor="notarized-date">Date of notarization (optional, for filing deadlines)</label>
          <input id="notarized-date" type="date" value={notarizedInput} onChange={(e) => setNotarizedInput(e.target.value)} />
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Tax Base (highest of the three)" value={hasIncome ? formatPHP(cgt.base) : '—'} />
        <StatTile label="Capital Gains Tax (6%)" value={hasIncome ? formatPHP(cgt.tax) : '—'} />
        <StatTile label="Documentary Stamp Tax (1.5%)" value={hasIncome ? formatPHP(dst.tax) : '—'} />
        <StatTile label="Total" value={hasIncome ? formatPHP(cgt.tax + dst.tax) : '—'} />
      </div>

      {notarizedInput && (
        <section className="card">
          <h2>Filing deadlines (ONETT)</h2>
          <dl className="route-card-detail">
            <div><dt>CGT (BIR Form 1706)</dt><dd>{cgtDeadline.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>
            <div><dt>DST (BIR Form 2000-OT)</dt><dd>{dstDeadline.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</dd></div>
          </dl>
          <p className="disclaimer" style={{ marginTop: 12 }}>
            CGT is due 30 days after notarization; DST is due on the 5th day of the month following notarization.
            These are the base statutory dates and do NOT auto-adjust for weekends or holidays — if either lands on
            one, BIR typically moves it to the next business day. Verify against the current year&apos;s official
            holiday list close to your actual deadline.
          </p>
        </section>
      )}

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Applies only to real property classified as a capital asset (not used in trade or business). CGT is 6%
          (NIRC Sec. 24(D)); DST is 1.5% (NIRC Sec. 196). Both use the higher of selling price, BIR zonal value, or
          the assessor&apos;s fair market value.
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

function RptMode() {
  const [assessedInput, setAssessedInput] = useState('')
  const [locationType, setLocationType] = useState('province')

  const assessedValue = Math.max(0, Number(assessedInput) || 0)
  const hasIncome = assessedValue > 0
  const result = hasIncome ? computeRealPropertyTax({ assessedValue, locationType }) : null

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="assessed-value">Assessed value (₱)</label>
          <input id="assessed-value" type="number" inputMode="decimal" placeholder="e.g. 2000000" value={assessedInput} onChange={(e) => setAssessedInput(e.target.value)} />
          <p className="disclaimer" style={{ marginTop: 8 }}>
            Assessed value = fair market value × the assessment level for your property type — check your latest
            Tax Declaration for this figure, since assessment levels vary by property classification and LGU.
          </p>
        </div>
        <div className="field">
          <label htmlFor="location-type">Location</label>
          <select
            id="location-type"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="ledger-input ledger-select"
            style={{ width: '100%' }}
          >
            <option value="province">Province (1% ceiling)</option>
            <option value="city">City / Metro Manila municipality (2% ceiling)</option>
          </select>
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Basic RPT" value={hasIncome ? formatPHP(result.basicTax) : '—'} />
        <StatTile label="SEF (1%)" value={hasIncome ? formatPHP(result.sefTax) : '—'} />
        <StatTile label="Annual Total" value={hasIncome ? formatPHP(result.total) : '—'} />
        <StatTile label="Per Quarter" value={hasIncome ? formatPHP(result.quarterly) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          RPT = assessed value × the LGU&apos;s basic rate, plus a mandatory 1% Special Education Fund levy (Local
          Government Code, RA 7160, Secs. 232–235). The basic rate ceiling is 1% for provinces and 2% for cities or
          Metro Manila municipalities.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          These are statutory <strong>ceilings</strong> — your actual LGU ordinance may set a lower rate. This
          gives you the maximum you could owe, not necessarily your exact bill; check your city/municipal
          treasurer&apos;s office or your latest RPT billing for the actual rate in effect.
        </p>
      </section>
    </>
  )
}

function OtherDstMode() {
  const [instrumentType, setInstrumentType] = useState('loan')
  const [amountInput, setAmountInput] = useState('')

  const amount = Math.max(0, Number(amountInput) || 0)
  const hasIncome = amount > 0

  let tax = null
  if (hasIncome) {
    if (instrumentType === 'loan') {
      tax = Math.ceil(amount / 200) * RATES.DST_LOAN_RATE_PER_200
    } else {
      const excess = Math.max(0, amount - 2000)
      tax = RATES.DST_LEASE_RATE_FIRST_2000 + Math.ceil(excess / 1000) * RATES.DST_LEASE_RATE_PER_1000_EXCESS
    }
  }

  return (
    <>
      <section className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="instrument-type">Instrument type</label>
          <select
            id="instrument-type"
            value={instrumentType}
            onChange={(e) => setInstrumentType(e.target.value)}
            className="ledger-input ledger-select"
            style={{ width: '100%' }}
          >
            <option value="loan">Loan / debt instrument</option>
            <option value="lease">Lease agreement</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="instrument-amount">
            {instrumentType === 'loan' ? 'Face value of the loan (₱)' : 'Total contract price for the lease term (₱)'}
          </label>
          <input id="instrument-amount" type="number" inputMode="decimal" placeholder="e.g. 500000" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
        </div>
      </section>

      <div className="stat-grid">
        <StatTile label="Documentary Stamp Tax" value={hasIncome ? formatPHP(tax) : '—'} />
      </div>

      <section className="card">
        <h2>How this is computed</h2>
        <p className="empty-copy">
          Loan/debt instruments: ₱1.50 per ₱200 (or fraction) of face value (NIRC Sec. 179). Lease agreements: ₱6
          flat on the first ₱2,000 of the total contract price for the lease term, plus ₱2 per additional ₱1,000
          (or fraction) (NIRC Sec. 194).
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          This covers two common instrument types out of roughly twenty covered under NIRC Title VII — DST also
          applies to shares of stock, bonds, insurance policies, bills of exchange, and more, each with its own
          rate. Not covered here.
        </p>
      </section>
    </>
  )
}
