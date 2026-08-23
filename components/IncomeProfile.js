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
            <label htmlFor="gross-compensation">Annual gross compensation (₱)</label>
            <input
              id="gross-compensation"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 600000"
              value={p.grossCompensationInput}
              onChange={(e) => p.setGrossCompensationInput(e.target.value)}
            />
          </div>

          {p.grossCompensationInput !== '' && (
            <div className="stat-tile" style={{ border: 'none', padding: 0, background: 'transparent', marginBottom: 14 }}>
              <div className="stat-label">Contributions (computed automatically)</div>
              <div className="stat-value">{formatPHP(p.autoAnnualContributions)}</div>
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: p.useContributionsOverride ? 10 : 0 }}>
            <input
              type="checkbox"
              checked={p.useContributionsOverride}
              onChange={(e) => p.setUseContributionsOverride(e.target.checked)}
            />
            My actual contributions are different (irregular pay, multiple employers, etc.)
          </label>

          {p.useContributionsOverride && (
            <div className="field">
              <label htmlFor="contributions-override">Your actual total contributions this year (₱)</label>
              <input
                id="contributions-override"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 21000"
                value={p.contributionsOverride}
                onChange={(e) => p.setContributionsOverride(e.target.value)}
              />
            </div>
          )}

          <p className="disclaimer">
            Contributions are computed automatically from your annual compensation (assuming even monthly pay) using
            current 2026 SSS/PhilHealth/Pag-IBIG rates — see the Contributions calculator for the full breakdown.
            Enter regular taxable compensation only — exclude 13th-month pay and other de minimis benefits up to
            ₱90,000, since those are tax-exempt.
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
            {p.isMixed && (
              <Link href="/calculators/mixed-income">See the full Mixed Income calculator →</Link>
            )}
          </p>
        </section>
      )}

      {p.hasBusinessIncome && (
        <section className="card">
          <h2>Recommendations</h2>
          <TipsList tips={p.tips} />
        </section>
      )}

      {p.profileType !== null && (
        <section className="card">
          <h2>Related calculators</h2>
          <div className="calc-grid">
            {relatedCalculators(p.profileType).map((calc) => (
              <Link href={calc.href} className="calc-tile-link" key={calc.href}>
                <div className="calc-tile">
                  <div className="calc-tile-top">
                    <h3>{calc.name}</h3>
                  </div>
                  <p>{calc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function relatedCalculators(profileType) {
  const EMPLOYEE = [
    { name: 'Employee Income Tax', description: 'A dedicated deep-dive on your withholding tax.', href: '/calculators/employee' },
    { name: 'Net Pay', description: 'See your full monthly take-home breakdown.', href: '/calculators/net-pay' },
    { name: '13th Month Pay', description: 'Compute your 13th-month pay and its tax-exempt portion.', href: '/calculators/thirteenth-month' },
    { name: 'Contributions', description: 'The full SSS/PhilHealth/Pag-IBIG breakdown.', href: '/calculators/contributions' },
  ]
  const BUSINESS = [
    { name: 'Freelancer / Self-Employed Tax', description: 'Compare every route (8% vs. graduated) side by side.', href: '/calculators/freelancer' },
    { name: 'Business Taxes', description: 'Percentage tax for non-VAT-registered businesses.', href: '/calculators/business' },
    { name: 'Property & Transfer Taxes', description: 'Selling property or receiving a gift? Compute that here.', href: '/calculators/property' },
  ]
  if (profileType === 'employee') return EMPLOYEE
  if (profileType === 'mixed') return [
    { name: 'Mixed Income Tax', description: 'The full combined calculator, with the RR 8-2018 rule already applied.', href: '/calculators/mixed-income' },
    ...EMPLOYEE.slice(1, 2),
    ...BUSINESS.slice(1),
  ]
  return BUSINESS
}
