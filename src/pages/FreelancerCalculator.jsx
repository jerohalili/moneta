import { useMemo, useState } from 'react'
import { compareRoutes } from '../lib/freelancerTax.js'
import { getFreelancerTips } from '../lib/advisor.js'

const peso = (n) =>
  n == null ? '—' : `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`

const ROUTE_LABELS = {
  '8-percent': '8% Flat Tax',
  'graduated-osd': 'Graduated Rate (40% OSD)',
  'graduated-itemized': 'Graduated Rate (Itemized)',
}

export default function FreelancerCalculator() {
  const [grossReceipts, setGrossReceipts] = useState('')
  const [itemizedExpenses, setItemizedExpenses] = useState('')

  const gross = Number(grossReceipts) || 0
  const expenses = Number(itemizedExpenses) || 0

  const comparison = useMemo(
    () => (gross > 0 ? compareRoutes({ grossReceipts: gross, itemizedExpenses: expenses }) : null),
    [gross, expenses],
  )

  const tips = useMemo(
    () => (comparison ? getFreelancerTips({ grossReceipts: gross, itemizedExpenses: expenses, comparison }) : []),
    [comparison, gross, expenses],
  )

  return (
    <>
      <div className="card">
        <h2>Your numbers</h2>
        <div className="field">
          <label htmlFor="gross">Annual gross receipts (PHP)</label>
          <input
            id="gross"
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="e.g. 850000"
            value={grossReceipts}
            onChange={(e) => setGrossReceipts(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="expenses">Actual business expenses this year (optional, PHP)</label>
          <input
            id="expenses"
            type="number"
            min="0"
            inputMode="decimal"
            placeholder="e.g. 120000"
            value={itemizedExpenses}
            onChange={(e) => setItemizedExpenses(e.target.value)}
          />
        </div>
      </div>

      {comparison && (
        <div className="card">
          <h2>Compare your options</h2>
          {comparison.routes.map((route) => (
            <div className={`route ${route === comparison.best ? 'best' : ''}`} key={route.method}>
              <span className="route-name">
                {ROUTE_LABELS[route.method]}
                {route === comparison.best && <span className="badge">Lowest</span>}
              </span>
              <span className="route-amount">{peso(route.total)}</span>
            </div>
          ))}
        </div>
      )}

      {comparison && tips.length > 0 && (
        <div className="card">
          <h2>What could lower this, legally</h2>
          {tips.map((tip) => (
            <div className="tip" key={tip.title}>
              <h3>{tip.title}</h3>
              <p>{tip.detail}</p>
            </div>
          ))}
          <p className="disclaimer">
            General information based on current BIR rules, not individual tax advice. Verify with the BIR or a
            licensed CPA before filing, especially for mixed income, VAT registration, or amounts near a threshold.
          </p>
        </div>
      )}
    </>
  )
}
