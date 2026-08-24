'use client'

import { useState } from 'react'
import { compareRoutes } from '@/lib/freelancerTax'
import { computeCorporateTax } from '@/lib/corporateTax'
import { formatPHP } from '@/lib/format'
import StatTile from './StatTile'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function SoleVsCorpCalculator() {
  const [grossInput, setGrossInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')
  const [assetsInput, setAssetsInput] = useState('')
  const [yearsInput, setYearsInput] = useState('4')

  const gross = Math.max(0, Number(grossInput) || 0)
  const expenses = Math.max(0, Number(expensesInput) || 0)
  const assets = Math.max(0, Number(assetsInput) || 0)
  const years = Math.max(0, Number(yearsInput) || 0)
  const hasIncome = gross > 0

  const soleProp = hasIncome ? compareRoutes({ grossReceipts: gross, itemizedExpenses: expenses }) : null
  const netForCorp = Math.max(0, gross - expenses)
  const corp = hasIncome
    ? computeCorporateTax({ grossIncome: gross, netTaxableIncome: netForCorp, totalAssets: assets, yearsInOperation: years })
    : null

  const cheaper = soleProp && corp ? (soleProp.best.total <= corp.tax ? 'sole' : 'corp') : null

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="svc-gross">Annual gross receipts/income (₱)</label>
          <input id="svc-gross" type="number" inputMode="decimal" placeholder="e.g. 4000000" value={grossInput} onChange={(e) => setGrossInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="svc-expenses">Deductible business expenses (₱)</label>
          <input id="svc-expenses" type="number" inputMode="decimal" placeholder="e.g. 1500000" value={expensesInput} onChange={(e) => setExpensesInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="svc-assets">If incorporated: total assets, excluding land (₱)</label>
          <input id="svc-assets" type="number" inputMode="decimal" placeholder="e.g. 5000000" value={assetsInput} onChange={(e) => setAssetsInput(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="svc-years">If incorporated: years in operation</label>
          <input id="svc-years" type="number" inputMode="decimal" value={yearsInput} onChange={(e) => setYearsInput(e.target.value)} />
        </div>

        <SaveToHistoryButton
          calculatorName="Sole Prop vs Corporation"
          summary={
            hasIncome
              ? `${cheaper === 'corp' ? 'Corporation' : 'Sole prop'} cheaper — ${formatPHP(Math.min(soleProp.best.total, corp.tax))} vs ${formatPHP(Math.max(soleProp.best.total, corp.tax))}`
              : ''
          }
          details={{
            grossIncome: gross,
            deductibleExpenses: expenses,
            corporateTotalAssets: assets,
            yearsInOperation: years,
            solePropBestRoute: soleProp?.best?.method,
            solePropTax: soleProp?.best?.total,
            corporationTax: corp?.tax,
            cheaperOption: cheaper === 'corp' ? 'Corporation' : cheaper === 'sole' ? 'Sole proprietorship' : null,
          }}
          disabled={!hasIncome}
        />
      </section>

      <div className="route-comparison">
        <div className={cheaper === 'sole' ? 'route-card is-best' : 'route-card'}>
          {cheaper === 'sole' && <span className="badge">Cheaper</span>}
          <div className="route-card-name">Sole Proprietorship / Freelancer</div>
          <div className="route-card-total">{hasIncome ? formatPHP(soleProp.best.total) : '—'}</div>
          <dl className="route-card-detail">
            <div><dt>Route used</dt><dd style={{ textTransform: 'capitalize' }}>{hasIncome ? soleProp.best.method.replace('-', ' ') : '—'}</dd></div>
          </dl>
        </div>
        <div className={cheaper === 'corp' ? 'route-card is-best' : 'route-card'}>
          {cheaper === 'corp' && <span className="badge">Cheaper</span>}
          <div className="route-card-name">Corporation (CREATE Act)</div>
          <div className="route-card-total">{hasIncome ? formatPHP(corp.tax) : '—'}</div>
          <dl className="route-card-detail">
            <div><dt>RCIT rate</dt><dd>{hasIncome ? `${(corp.rcitRate * 100).toFixed(0)}%` : '—'}</dd></div>
            <div><dt>Used MCIT?</dt><dd>{hasIncome ? (corp.usedMcit ? 'Yes' : 'No') : '—'}</dd></div>
          </dl>
        </div>
      </div>

      <section className="card">
        <h2>What this doesn&apos;t include</h2>
        <p className="empty-copy">
          This compares income tax only. A corporation faces real additional costs a sole proprietorship doesn&apos;t:
          SEC registration and annual filings, a mandatory external audit above certain thresholds, a second layer
          of tax when profits are distributed as dividends (generally 10% final tax to individual shareholders), and
          more complex bookkeeping requirements. A lower income-tax number for &ldquo;Corporation&rdquo; here doesn&apos;t
          automatically mean incorporating is the better move once those costs are factored in — this is a starting
          point for that conversation with an accountant, not the whole analysis.
        </p>
      </section>
    </>
  )
}
