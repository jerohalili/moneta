'use client'

import Link from 'next/link'
import { useIncomeProfile } from '@/hooks/useIncomeProfile'
import { formatPHP, formatPercent } from '@/lib/format'
import { RATES } from '@/lib/taxConfig'
import ProfileTypeSelector from './ProfileTypeSelector'
import StatTile from './StatTile'
import FilingCountdown from './FilingCountdown'
import ExpenseLedger from './ExpenseLedger'
import CategoryBars from './CategoryBars'
import AdvisorPlan from './AdvisorPlan'
import TaxWalkthrough from './TaxWalkthrough'
import ErrorFlags from './ErrorFlags'
import SaveToHistoryButton from './SaveToHistoryButton'

function businessLabel(profileType) {
  if (profileType === 'business') return 'Gross sales this year (₱)'
  if (profileType === 'mixed') return 'Business gross receipts / sales this year (₱)'
  return 'Gross receipts this year (₱)'
}

/** The Dashboard's snapshot is the richest one in the app: headline figures,
 * plus the advisor's top actions and the ledger itself, so History can show
 * WHY a number was what it was on that date. */
function dashboardSnapshot(p) {
  return {
    profileType: p.profileType,
    grossIncome: p.grossIncome,
    netIncomePreTax: p.netIncomePreTax,
    estimatedTax: p.estimatedTax,
    effectiveRate: p.effectiveRate,
    takeHome: p.takeHome,
    businessRoute: p.businessComparison?.best?.method ?? null,
    actionPlan: Array.isArray(p.advicePlan?.actions)
      ? p.advicePlan.actions.slice(0, 5).map((a) => ({ title: a.title, impact: a.impact }))
      : [],
    ledger: p.ledger.slice(0, 50).map((e) => ({ label: e.label, amount: e.amount })),
  }
}

const PROFILE_LABELS = {
  employee: 'Employee',
  freelancer: 'Freelancer',
  business: 'Business Owner',
  mixed: 'Mixed (Employed + Freelancing)',
}

export default function IncomeProfile() {
  const p = useIncomeProfile()
  const quarterlyReserve = p.businessComparison ? p.businessComparison.best.total / 4 : null

  return (
    <>
      <section className="card glow-card">
        <h2>Income Profile</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Tell the advisor how you earn. Everything below is computed automatically from your answers —
          what you owe, when it&apos;s due, and a ranked plan of legal moves that lower it. Your profile
          stays saved in this browser.
        </p>
        <ProfileTypeSelector value={p.profileType} onChange={p.setProfileType} />
      </section>

      {p.profileType === null && (
        <p className="empty-copy">Pick a profile above and the advisor takes over from there.</p>
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
            <div className="stat-grid" style={{ marginBottom: 14 }}>
              <StatTile label="Contributions (computed automatically)" value={formatPHP(p.autoAnnualContributions)} />
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
            current SSS/PhilHealth/Pag-IBIG rates — see the Contributions calculator for the full breakdown.
            Enter regular taxable compensation only — exclude 13th-month pay and other de minimis benefits up to
            ₱90,000, since those are tax-exempt.
          </p>

          {!p.needsBusinessFields && (
            <SaveToHistoryButton
              calculatorName="Income Profile"
              summary={p.hasAnyIncome ? `${PROFILE_LABELS[p.profileType]} — net ${formatPHP(p.netIncomePreTax)}, tax ${formatPHP(p.estimatedTax)}` : ''}
              details={dashboardSnapshot(p)}
              disabled={!p.hasAnyIncome}
            />
          )}
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
          <div className="field">
            <label htmlFor="total-assets">Total business assets, excluding land (₱) — optional</label>
            <input
              id="total-assets"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 1200000"
              value={p.totalAssetsInput}
              onChange={(e) => p.setTotalAssetsInput(e.target.value)}
            />
            <p className="empty-copy" style={{ marginTop: 6 }}>
              Used to check BMBE eligibility: registered micro businesses under{' '}
              {formatPHP(RATES.BMBE_ASSET_CEILING)} in assets pay zero income tax. Leave blank if unsure — the
              advisor just skips that move.
            </p>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={p.vatRegistered}
              onChange={(e) => p.setVatRegistered(e.target.checked)}
            />
            I&apos;m already VAT-registered
          </label>

          <SaveToHistoryButton
            calculatorName="Income Profile"
            summary={p.hasAnyIncome ? `${PROFILE_LABELS[p.profileType] ?? p.profileType} — net ${formatPHP(p.netIncomePreTax)}, tax ${formatPHP(p.estimatedTax)}` : ''}
            details={dashboardSnapshot(p)}
            disabled={!p.hasAnyIncome}
          />
        </section>
      )}

      <ErrorFlags errors={p.errors} />

      {p.exceedsVatThreshold && !p.vatRegistered && (
        <div className="error-flags">
          <div className="error-flag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
            <span className="error-flag-icon" aria-hidden="true">ℹ</span>
            Your gross receipts/sales are above {formatPHP(RATES.VAT_THRESHOLD)} — VAT registration is mandatory, and the
            8% flat-tax option is no longer available to you. <Link href="/calculators/business">Use the VAT calculator →</Link>
          </div>
        </div>
      )}

      {p.hasAnyIncome && (
        <p style={{ fontSize: 15, lineHeight: 1.5, marginBottom: 16 }}>
          <strong>{PROFILE_LABELS[p.profileType]}</strong> — {formatPHP(p.grossIncome)} gross this year, an
          effective tax rate of {formatPercent(p.effectiveRate)}, leaving roughly {formatPHP(p.takeHome)} take-home.
        </p>
      )}

      {p.profileType !== null && (
        <div className="stat-grid">
          <StatTile label="Net Income (Pre-Tax)" value={p.hasAnyIncome ? formatPHP(p.netIncomePreTax) : '—'} />
          <StatTile label="Estimated Tax Owed" value={p.hasAnyIncome ? formatPHP(p.estimatedTax) : '—'} />
          <StatTile label="Effective Rate" value={p.hasAnyIncome ? formatPercent(p.effectiveRate) : '—'} />
          <StatTile label="Est. Take-Home" value={p.hasAnyIncome ? formatPHP(p.takeHome) : '—'} />
        </div>
      )}

      <AdvisorPlan plan={p.advicePlan} />

      <TaxWalkthrough walkthroughs={p.advicePlan?.walkthroughs} />

      {p.hasEmployeeIncome && (
        <section className="card">
          <h2>Net Pay & 13th Month Pay</h2>
          <p className="empty-copy" style={{ marginBottom: 14 }}>
            Computed automatically from the same compensation figure above &mdash; no separate visit needed to
            those calculators.
          </p>
          <div className="stat-grid">
            <StatTile label="Monthly Take-Home" value={formatPHP(p.netPayResult.netPay)} />
            <StatTile label="Monthly Withholding Tax" value={formatPHP(p.netPayResult.monthlyWithholdingTax)} />
            <StatTile label="13th Month Pay" value={formatPHP(p.thirteenthMonthResult.thirteenthMonthPay)} />
            <StatTile
              label="13th Month Taxable Excess"
              value={p.thirteenthMonthResult.taxableAmount > 0 ? formatPHP(p.thirteenthMonthResult.taxableAmount) : 'None (fully exempt)'}
            />
          </div>
        </section>
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
            <div className="stat-grid">
              <StatTile label="Set aside per quarter" value={quarterlyReserve != null ? formatPHP(quarterlyReserve) : '—'} />
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
    </>
  )
}
