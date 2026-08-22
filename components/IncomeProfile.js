'use client'

import Link from 'next/link'
import { useIncomeProfile } from '@/hooks/useIncomeProfile'
import { formatPHP, formatPercent } from '@/lib/format'
import ProfileTypeSelector from './ProfileTypeSelector'
import StatTile from './StatTile'
import FilingCountdown from './FilingCountdown'
import ExpenseLedger from './ExpenseLedger'
import CategoryBars from './CategoryBars'
import TipsList from './TipsList'
import ErrorFlags from './ErrorFlags'

function businessLabel(profileType) {
  if (profileType === 'business') return 'Gross sales this year (₱)'
  if (profileType === 'mixed') return 'Business gross receipts / sales this year (₱)'
  return 'Gross receipts this year (₱)'
}

export default function IncomeProfile() {
  const p = useIncomeProfile()
  const quarterlyReserve = p.businessComparison ? p.businessComparison.best.total / 4 : null

  return (
    <>
      <section className="card glow-card">
        <h2>Income Profile</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Choose the profile that matches how you earn, and everything below fills in for that profile &mdash; no
          &ldquo;Calculate&rdquo; button, just live numbers as you type.
        </p>
        <ProfileTypeSelector value={p.profileType} onChange={p.setProfileType} />
      </section>

      {p.profileType === null && (
        <p className="empty-copy">Pick a profile above to see your tax snapshot.</p>
      )}

      {p.needsEmployeeFields && (
        <section className="card">
          <h2>Compensation Income</h2>
          <div className="field">
            <label htmlFor="gross-compensation">Gross compensation this year (₱)</label>
            <input
              id="gross-compensation"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 600000"
              value={p.grossCompensationInput}
              onChange={(e) => p.setGrossCompensationInput(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="contributions">Total SSS + PhilHealth + Pag-IBIG contributions this year (₱)</label>
            <input
              id="contributions"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 21000"
              value={p.contributionsInput}
              onChange={(e) => p.setContributionsInput(e.target.value)}
            />
          </div>
          <p className="disclaimer">
            Enter your regular taxable compensation only &mdash; exclude 13th-month pay and other de minimis benefits
            up to ₱90,000, since those are tax-exempt. The official 2026 contribution tables aren&apos;t built into
            this tool yet, so enter your actual total for now (see the Payroll Contributions roadmap item below).
          </p>
        </section>
      )}

      {p.needsBusinessFields && (
        <section className="card">
          <h2>Business / Professional Income</h2>
          <div className="field">
            <label htmlFor="gross-receipts">{businessLabel(p.profileType)}</label>
            <input
              id="gross-receipts"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 850000"
              value={p.grossReceiptsInput}
              onChange={(e) => p.setGrossReceiptsInput(e.target.value)}
            />
          </div>
        </section>
      )}

      <ErrorFlags errors={p.errors} />

      {p.profileType !== null && (
        <div className="stat-grid">
          <StatTile label="Net Income (Pre-Tax)" value={p.hasAnyIncome ? formatPHP(p.netIncomePreTax) : '—'} />
          <StatTile label="Estimated Tax Owed" value={p.hasAnyIncome ? formatPHP(p.estimatedTax) : '—'} />
          <StatTile label="Effective Rate" value={p.hasAnyIncome ? formatPercent(p.effectiveRate) : '—'} />
          <StatTile label="Est. Take-Home" value={p.hasAnyIncome ? formatPHP(p.takeHome) : '—'} />
        </div>
      )}

      {p.profileType === 'employee' && (
        <section className="card">
          <h2>Filing Schedule</h2>
          <p className="empty-copy">
            As an employee with a single employer, your employer typically files your annual return for you via
            substituted filing (BIR Form 2316) &mdash; you usually don&apos;t need to file it yourself unless you have
            more than one employer or other income during the year.
          </p>
        </section>
      )}

      {p.needsBusinessFields && (
        <div className="dashboard-row">
          <section className="card">
            <h2>Filing Schedule</h2>
            <FilingCountdown profileType={p.profileType} />
            <p className="disclaimer" style={{ marginTop: 16 }}>
              Standard statutory due dates for a calendar-year filer. If one lands on a weekend or holiday, BIR
              usually moves it to the next business day &mdash; double-check close to filing season.
            </p>
          </section>
          <section className="card">
            <h2>Quarterly Tax Reserve</h2>
            <p className="empty-copy" style={{ marginBottom: 12 }}>
              A simple even split of your estimated annual business tax across four quarters. (The actual BIR
              quarterly form uses a running cumulative formula, not an even split &mdash; this is a planning
              estimate, not what you&apos;d file.)
            </p>
            <div className="stat-tile" style={{ border: 'none', padding: 0, background: 'transparent' }}>
              <div className="stat-label">Set aside per quarter</div>
              <div className="stat-value">{quarterlyReserve != null ? formatPHP(quarterlyReserve) : '—'}</div>
            </div>
          </section>
        </div>
      )}

      {p.needsBusinessFields && (
        <>
          <section className="card">
            <h2>Expense Categories</h2>
            <CategoryBars categoryTotals={p.categoryTotals} />
          </section>

          <section className="card">
            <h2>Write-off Ledger</h2>
            <ExpenseLedger
              draft={p.draft}
              setDraft={p.setDraft}
              addEntry={p.addEntry}
              ledger={p.ledger}
              removeEntry={p.removeEntry}
              compact
            />
          </section>
        </>
      )}

      {p.hasBusinessIncome && (
        <section className="card">
          <h2>Cheapest legal route</h2>
          <p className="empty-copy">
            Based on what you&apos;ve entered, the cheapest legal option for your business/professional income is
            the <strong>{p.businessComparison.best.method.replace('-', ' ')}</strong> route, at{' '}
            {formatPHP(p.businessComparison.best.total)}.{' '}
            {(p.profileType === 'freelancer' || p.profileType === 'business') && (
              <Link href="/calculators/freelancer">Compare all routes side by side →</Link>
            )}
          </p>
          {p.isMixed && (
            <p className="disclaimer" style={{ marginTop: 8 }}>
              This applies the mixed-income-earner rule (RR 8-2018): the ₱250,000 exemption on the 8% option isn&apos;t
              available to you, since it&apos;s already used on your compensation side. The full calculator at
              /calculators/freelancer doesn&apos;t model this yet, so its numbers would look more favorable than yours
              actually are &mdash; use the figures on this page instead.
            </p>
          )}
        </section>
      )}

      {p.hasBusinessIncome && (
        <section className="card">
          <h2>Recommendations</h2>
          <TipsList tips={p.tips} />
        </section>
      )}
    </>
  )
}
