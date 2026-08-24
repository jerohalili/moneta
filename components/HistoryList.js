'use client'

import { useEffect, useMemo, useState } from 'react'
import { getHistory, deleteHistoryEntry, clearHistory } from '@/lib/history'
import { formatPHP, formatPercent } from '@/lib/format'

/**
 * The saved-calculation archive. Every snapshot carries its full figure
 * set in `details` — this page is where that earns its keep: filter by
 * calculator, expand an entry to see exactly what was true on the day it
 * was saved, and export the whole log.
 */
export default function HistoryList() {
  const [entries, setEntries] = useState(null)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage, not a render-derivable value
    setEntries(getHistory())
    // Cloud sync can add/remove entries after sign-in or a pull.
    function refresh() {
      setEntries(getHistory())
    }
    window.addEventListener('moneta:history-changed', refresh)
    return () => window.removeEventListener('moneta:history-changed', refresh)
  }, [])

  const calculatorNames = useMemo(() => {
    if (!entries) return []
    return [...new Set(entries.map((e) => e.calculatorName))].sort()
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    return filter === 'all' ? entries : entries.filter((e) => e.calculatorName === filter)
  }, [entries, filter])

  function handleDelete(id) {
    setEntries(deleteHistoryEntry(id))
  }

  function handleClear() {
    clearHistory()
    setEntries([])
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(entries ?? [], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moneta-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (entries === null) {
    return <div className="card" aria-hidden="true" />
  }

  if (entries.length === 0) {
    return (
      <div className="card">
        <h2>Nothing saved yet</h2>
        <p className="empty-copy">
          Every calculator and the Dashboard advisor has a &ldquo;Save to History&rdquo; button. Use it to
          keep a dated snapshot of your numbers — then this page shows you how they moved over time.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="history-toolbar">
          <p className="empty-copy" style={{ margin: 0 }}>
            {filtered.length} of {entries.length} saved calculation{entries.length === 1 ? '' : 's'}
            {filter !== 'all' ? ` — ${filter}` : ''}
          </p>
          <div className="history-toolbar-actions">
            <button type="button" className="settings-secondary-btn" onClick={handleExport}>
              Export JSON
            </button>
            <button type="button" className="ledger-row-remove" style={{ fontSize: 13 }} onClick={handleClear}>
              Clear all
            </button>
          </div>
        </div>

        {calculatorNames.length > 1 && (
          <div className="history-filters">
            <button
              type="button"
              className={filter === 'all' ? 'history-chip is-active' : 'history-chip'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {calculatorNames.map((name) => (
              <button
                key={name}
                type="button"
                className={filter === name ? 'history-chip is-active' : 'history-chip'}
                onClick={() => setFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <ul className="ledger-list">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id
            return (
              <li className="ledger-row history-row" key={entry.id} style={{ alignItems: 'flex-start' }}>
                <span className="ledger-row-main" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <button
                    type="button"
                    className="history-row-head"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    aria-expanded={expanded}
                  >
                    <span className="history-chevron" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                    <span className="history-row-titles">
                      <span className="ledger-row-label">{entry.calculatorName}</span>
                      <span className="ledger-row-category" style={{ textTransform: 'none' }}>{entry.summary}</span>
                    </span>
                    <span className="history-row-date">
                      {new Date(entry.savedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </button>

                  {expanded && (
                    <div className="history-detail">
                      {detailRows(entry.details).length > 0 ? (
                        <dl className="history-detail-grid">
                          {detailRows(entry.details).map(([key, value]) => (
                            <div key={key} className="history-detail-item">
                              <dt>{friendlyLabel(key)}</dt>
                              <dd>{formatValue(key, value)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="empty-copy">No figures were stored with this snapshot.</p>
                      )}
                      <ActionPlanList actions={entry.details?.actionPlan} />
                      <LedgerList ledger={entry.details?.ledger} />
                      <p className="history-detail-note">
                        Figures are as computed at save time — they don&apos;t update when rates change later.
                      </p>
                    </div>
                  )}
                </span>
                <button type="button" className="ledger-row-remove" onClick={() => handleDelete(entry.id)} aria-label={`Delete ${entry.calculatorName} entry`}>
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="disclaimer">
        Synced to your account automatically — signed in or guest, your history follows you to any device.
        Deleting here removes it everywhere.
      </p>
    </>
  )
}

/** Flattens the snapshot into display rows. Empty/null values are dropped
 * entirely (silence beats a wall of em-dashes), nested arrays are handled
 * by their own renderers below, and money-ish fields sort to the front. */
function detailRows(details) {
  if (!details || typeof details !== 'object') return []
  const pairs = Object.entries(details).filter(([key, v]) => {
    if (v === null || v === undefined || v === '') return false
    if (key === 'actionPlan' || key === 'ledger') return false
    if (Array.isArray(v)) return false
    if (typeof v === 'object') return false
    return true
  })
  const moneyFirst = (k) => (/tax|income|home|pay|receipt|sales|expense|contribution/i.test(k) ? 0 : 1)
  return pairs.sort((a, b) => moneyFirst(a[0]) - moneyFirst(b[0]))
}

const FRIENDLY_LABELS = {
  profileType: 'Profile',
  grossIncome: 'Gross income (year)',
  netIncomePreTax: 'Net income, pre-tax',
  estimatedTax: 'Est. tax owed',
  effectiveRate: 'Effective rate',
  takeHome: 'Take-home after tax',
  businessRoute: 'Route chosen',
  grossReceipts: 'Gross receipts',
  itemizedExpenses: 'Itemized expenses',
  grossCompensation: 'Gross compensation',
  contributions: 'Contributions (year)',
  monthlyGross: 'Monthly gross',
  totalEmployeeMonthly: 'Your share, monthly',
  totalEmployerMonthly: "Employer's share, monthly",
  totalEmployeeAnnual: 'Your share, yearly',
  estimatedMsc: 'Est. salary credit (SSS)',
  sssEmployee: 'SSS — your share',
  philhealthEmployee: 'PhilHealth — your share',
  pagibigEmployee: 'Pag-IBIG — your share',
  monthlyWithholdingTax: 'Withholding tax (mo.)',
  netPay: 'Net pay (monthly)',
  takeHomeRate: 'Take-home rate',
  totalBasicSalary: 'Total basic salary',
  thirteenthMonthPay: '13th month pay',
  exemptAmount: 'Tax-exempt portion',
  taxableAmount: 'Taxable excess',
  taxableCompensation: 'Taxable compensation',
  incomeTax: 'Income tax',
  workType: 'Type of work',
  hoursWorked: 'Hours worked',
  nightDiffHours: 'Night-diff hours (10PM–6AM)',
  multiplierApplied: 'Multiplier applied',
  basePay: 'Base premium pay',
  nightDiffPay: 'Night differential pay',
  totalPay: 'Total overtime pay',
  periodsCount: 'Periods in the year',
  monthsCovered: 'Months covered',
  category: 'Payment category',
  rateApplied: 'Rate applied',
  taxWithheld: 'Tax withheld',
  netPayment: 'Net payment received',
  eligible: 'BMBE eligible',
  annualSavings: 'Annual savings',
  incomeTaxWithoutBmbe: 'Income tax without BMBE',
  incomeTaxAsBmbe: 'Income tax as BMBE',
  qualifiesSmall: 'Small-corp rate qualified',
  rcitRate: 'RCIT rate',
  rcit: 'RCIT amount',
  mcit: 'MCIT amount',
  usedMcit: 'MCIT was higher',
  taxDue: 'Total tax due',
  percentageTaxDue: 'Percentage tax due',
  vatRegistrationRequired: 'VAT registration required',
  outputVat: 'Output VAT',
  inputVat: 'Input VAT',
  vatPayable: 'VAT payable',
  excessInputVatCarryover: 'Excess input VAT (carryover)',
  surcharge: 'Surcharge',
  interest: 'Interest',
  compromiseEstimate: 'Compromise penalty (est.)',
  totalAmountDue: 'Total amount due',
  unfiledReturnsCount: 'Unfiled returns',
  minimumCompromisePerReturn: 'Minimum compromise each',
  estimatedTotal: 'Estimated total',
  taxBaseUsed: 'Tax base used (highest)',
  capitalGainsTax: 'Capital gains tax (6%)',
  documentaryStampTax: 'Documentary stamp tax',
  notarizationDate: 'Date of notarization',
  cgtDeadline: 'CGT deadline (30 days)',
  dstDeadline: 'DST deadline (5th of next mo.)',
  netTaxableEstate: 'Net taxable estate',
  estateTax: 'Estate tax (6%)',
  netGiftsThisYear: 'Net gifts this year',
  yearlyExemption: 'Yearly exemption',
  taxableGifts: 'Taxable gifts',
  donorsTax: "Donor's tax (6%)",
  baseRateCeiling: 'Base rate ceiling',
  basicRpt: 'Basic RPT',
  specialEducationFund: 'Special Education Fund (1%)',
  annualTotal: 'Annual total',
  perQuarter: 'Per quarter',
  instrumentType: 'Instrument type',
  contractAmount: 'Contract amount',
  cheaperOption: 'Cheaper option',
  solePropBestRoute: 'Sole-prop route used',
  corporationTax: 'Corporation tax',
  willfulNeglectOrFraud: 'Willful neglect / fraud case',
  microSmallClassification: 'Micro/small classification',
}

function friendlyLabel(key) {
  if (FRIENDLY_LABELS[key]) return FRIENDLY_LABELS[key]
  const spaced = String(key).replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

const COUNT_KEYS = /hours|count|months|periods/i
const RATE_KEYS = /rate|percent|ratio/i

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    // Order matters: 'hourlyRate' contains "rate" but is pesos; a rate
    // fraction is always ≤ ~1.5, so anything larger is a money/count value
    // that merely has rate-ish wording in its key.
    if (key === 'multiplierApplied') return `${value.toFixed(2)}×`
    if (RATE_KEYS.test(key) && Math.abs(value) <= 1.5) return formatPercent(value)
    if (COUNT_KEYS.test(key)) return String(Math.round(value))
    return formatPHP(value)
  }
  if (/^date$/i.test(key) || /deadline|notarization/i.test(key)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    }
  }
  return String(value)
}

/** The Dashboard snapshot carries its advisor output — show the moves that
 * were on the table that day, biggest peso impact first (already sorted). */
function ActionPlanList({ actions }) {
  if (!Array.isArray(actions) || actions.length === 0) return null
  return (
    <div className="history-extra">
      <div className="history-extra-heading">Advisor actions at save time</div>
      <ol className="history-action-list">
        {actions.map((a, i) => (
          <li key={i}>
            {a?.title}
            {typeof a?.impact === 'number' && a.impact > 0 ? (
              <span className="history-action-impact"> saves ≈{formatPHP(a.impact)}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

function LedgerList({ ledger }) {
  if (!Array.isArray(ledger) || ledger.length === 0) return null
  const PREVIEW_LIMIT = 8
  const total = ledger.reduce((sum, e) => sum + (Number(e?.amount) || 0), 0)
  const shown = ledger.slice(0, PREVIEW_LIMIT)
  return (
    <div className="history-extra">
      <div className="history-extra-heading">
        Write-off ledger ({ledger.length} item{ledger.length === 1 ? '' : 's'} — {formatPHP(total)})
      </div>
      <ul className="history-ledger-list">
        {shown.map((e, i) => (
          <li key={i}>
            <span>{e?.label}</span>
            <span>{formatPHP(e?.amount)}</span>
          </li>
        ))}
      </ul>
      {ledger.length > PREVIEW_LIMIT && (
        <p className="history-ledger-more">+{ledger.length - PREVIEW_LIMIT} more in this snapshot</p>
      )}
    </div>
  )
}
