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

function compensationLabel(profileType) {
  if (profileType === 'employee-multi') return 'Combined annual gross compensation from ALL employers (₱)'
  if (profileType === 'smwe') return 'Annual gross compensation (₱)'
  if (profileType === 'ofw') return 'Annual gross compensation from PHILIPPINE sources (₱)'
  return 'Annual gross compensation (₱)'
}

function compensationPlaceholder(profileType) {
  if (profileType === 'employee-multi') return 'e.g. 420000 + 300000 = 720000'
  if (profileType === 'ofw') return 'e.g. 300000 — exclude income earned abroad'
  return 'e.g. 600000'
}

/** The Dashboard's snapshot is the richest one in the app: headline figures,
 * plus the advisor's top actions and the ledger itself, so History can show
 * WHY a number was what it was on that date. */
function dashboardSnapshot(p) {
  const snap = {
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
  if (p.isMultiEmployer && p.employeeResult) {
    snap.withheldTax = p.employeeResult.withheldTax
    snap.balanceDue = p.employeeResult.balanceDue
    snap.overpayment = p.employeeResult.overpayment
  }
  if (p.isSmwe) snap.smwAnnual = p.smwAnnual
  if (p.isOfw) snap.foreignIncomeExempt = p.foreignIncome
  if (p.hasEstateTrustIncome && p.estateTrustResult) snap.estateTrustTax = p.estateTrustResult.total
  if (p.hasCorporateIncome && p.corporateResult) {
    snap.corpGrossSales = p.corpGrossSales
    snap.corpDeductions = p.corpDeductions
    snap.corpYears = p.corpYears
    snap.corporateTax = p.corporateResult.tax
    snap.corporateRate = p.corporateResult.rcitRate
    snap.usedMcit = p.corporateResult.usedMcit
  }
  return snap
}

const PROFILE_LABELS = {
  employee: 'Employee',
  'employee-multi': 'Employee (Multiple Employers)',
  smwe: 'Minimum Wage Earner',
  ofw: 'OFW / Non-Resident Citizen',
  freelancer: 'Freelancer / Professional',
  business: 'Business Owner',
  mixed: 'Mixed (Employed + Freelancing)',
  corporation: 'Corporation / OPC',
  'estate-trust': 'Estate or Trust',
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
            <label htmlFor="gross-compensation">{compensationLabel(p.profileType)}</label>
            <input
              id="gross-compensation"
              type="number"
              inputMode="decimal"
              placeholder={compensationPlaceholder(p.profileType)}
              value={p.grossCompensationInput}
              onChange={(e) => p.setGrossCompensationInput(e.target.value)}
            />
          </div>

          {p.isMultiEmployer && (
            <div className="field">
              <label htmlFor="withheld-tax">Total tax already withheld by ALL employers this year (₱) — optional</label>
              <input
                id="withheld-tax"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 55000 — from ALL employers' 2316 certificates"
                value={p.withheldTaxInput}
                onChange={(e) => p.setWithheldTaxInput(e.target.value)}
              />
              <p className="empty-copy" style={{ marginTop: 6 }}>
                Each employer withholds against their own salary alone, so the combined withholding rarely covers the
                tax on your combined income. Enter the total to estimate what you&apos;ll still owe (or get back) when
                you file Form 1700.
              </p>
            </div>
          )}

          {p.isSmwe && (
            <div className="field">
              <label htmlFor="smw-annual">Statutory minimum wage in YOUR region, annualized (₱)</label>
              <input
                id="smw-annual"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 167700 — NCR non-agri ₱645/day × ~260 days"
                value={p.smwAnnualInput}
                onChange={(e) => p.setSmwAnnualInput(e.target.value)}
              />
              <p className="empty-copy" style={{ marginTop: 6 }}>
                The minimum-wage portion of your pay is income-tax exempt (RA 9504). Daily rates vary by region and
                sector — multiply your region&apos;s daily SMW by your working days. Holiday pay, overtime, and night
                differential remain taxable.
              </p>
            </div>
          )}

          {p.isOfw && (
            <div className="field">
              <label htmlFor="foreign-income">Income earned ABROAD this year (₱) — exempt, recorded for context</label>
              <input
                id="foreign-income"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 1200000"
                value={p.foreignIncomeInput}
                onChange={(e) => p.setForeignIncomeInput(e.target.value)}
              />
              <p className="empty-copy" style={{ marginTop: 6 }}>
                As a non-resident citizen, only Philippine-source income is taxable (NIRC Sec. 23) — your foreign
                earnings are never included in the computation. Sea-based OFWs on foreign vessels are fully exempt.
              </p>
            </div>
          )}

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
            {p.isMultiEmployer
              ? 'My actual contributions are different — they stack per employer, so the auto figure (computed on combined pay) is wrong'
              : 'My actual contributions are different (irregular pay, voluntary SSS member, etc.)'}
          </label>

          {p.useContributionsOverride && (
            <div className="field">
              <label htmlFor="contributions-override">Your actual total contributions this year (₱)</label>
              <input
                id="contributions-override"
                type="number"
                inputMode="decimal"
                placeholder={p.isMultiEmployer ? 'e.g. 32000 — all employers\' shares combined' : 'e.g. 21000'}
                value={p.contributionsOverride}
                onChange={(e) => p.setContributionsOverride(e.target.value)}
              />
              {p.isMultiEmployer && (
                <p className="empty-copy" style={{ marginTop: 6 }}>
                  Each employer withholds and pays contributions on your salary with THEM alone, with separate SSS
                  monthly-salary-credit caps — so two employers legitimately contribute more than one would on the
                  same combined pay. Check every payslip and enter the combined total.
                </p>
              )}
            </div>
          )}

          <p className="disclaimer">
            Contributions are computed automatically from your annual compensation (assuming even monthly pay) using
            current SSS/PhilHealth/Pag-IBIG rates — see the Contributions calculator for the full breakdown.
            Enter regular taxable compensation only — exclude 13th-month pay and other de minimis benefits up to
            ₱90,000, since those are tax-exempt.
          </p>

          {!p.needsBusinessFields && !p.needsCorporateFields && (
            <SaveToHistoryButton
              calculatorName="Income Profile"
              summary={p.hasAnyIncome ? `${PROFILE_LABELS[p.profileType]} — net ${formatPHP(p.netIncomePreTax)}, tax ${formatPHP(p.estimatedTax)}` : ''}
              details={dashboardSnapshot(p)}
              disabled={!p.hasAnyIncome}
            />
          )}
        </section>
      )}

      {p.needsEstateTrustFields && (
        <section className="card">
          <h2>Estate / Trust Income</h2>
          <div className="field">
            <label htmlFor="estate-trust-income">Net taxable income of the estate or trust this year (₱)</label>
            <input
              id="estate-trust-income"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 800000"
              value={p.grossCompensationInput}
              onChange={(e) => p.setGrossCompensationInput(e.target.value)}
            />
            <p className="empty-copy" style={{ marginTop: 6 }}>
              Estates and trusts are taxed on the individual graduated table (NIRC Sec. 60) — no SSS/PhilHealth
              contributions apply. Income distributed to beneficiaries is taxed in THEIR hands; income accumulated
              by the estate/trust is taxed at the flat 35% highest rate.
            </p>
          </div>

          <SaveToHistoryButton
            calculatorName="Income Profile"
            summary={p.hasAnyIncome ? `${PROFILE_LABELS[p.profileType]} — tax ${formatPHP(p.estimatedTax)}` : ''}
            details={dashboardSnapshot(p)}
            disabled={!p.hasAnyIncome}
          />
        </section>
      )}

      {p.needsCorporateFields && (
        <section className="card">
          <h2>Corporate Income</h2>
          <div className="field">
            <label htmlFor="corp-gross-sales">Gross sales / gross income this year (₱)</label>
            <input
              id="corp-gross-sales"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 5000000"
              value={p.corpGrossSalesInput}
              onChange={(e) => p.setCorpGrossSalesInput(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="corp-deductions">Allowable deductions — ordinary and necessary expenses (₱)</label>
            <input
              id="corp-deductions"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 3600000"
              value={p.corpDeductionsInput}
              onChange={(e) => p.setCorpDeductionsInput(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="corp-assets">Total assets, excluding land (₱)</label>
            <input
              id="corp-assets"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 80000000"
              value={p.corpAssetsInput}
              onChange={(e) => p.setCorpAssetsInput(e.target.value)}
            />
            <p className="empty-copy" style={{ marginTop: 6 }}>
              Together with net taxable income, this decides whether the corporation pays CREATE&apos;s reduced 20%
              rate (both ≤ ₱5M income and ≤ ₱100M assets) or the standard 25%.
            </p>
          </div>
          <div className="field">
            <label htmlFor="corp-years">Years in operation</label>
            <input
              id="corp-years"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 5"
              value={p.corpYearsInput}
              onChange={(e) => p.setCorpYearsInput(e.target.value)}
            />
            <p className="empty-copy" style={{ marginTop: 6 }}>
              From the 4th year onward, the 2% Minimum Corporate Income Tax (MCIT) on gross income applies whenever
              it exceeds the regular tax.
            </p>
          </div>

          <SaveToHistoryButton
            calculatorName="Income Profile"
            summary={p.hasAnyIncome ? `${PROFILE_LABELS[p.profileType]} — tax ${formatPHP(p.estimatedTax)}` : ''}
            details={dashboardSnapshot(p)}
            disabled={!p.hasAnyIncome}
          />
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

          {!p.isMixed && (
            <SaveToHistoryButton
              calculatorName="Income Profile"
              summary={p.hasAnyIncome ? `${PROFILE_LABELS[p.profileType] ?? p.profileType} — net ${formatPHP(p.netIncomePreTax)}, tax ${formatPHP(p.estimatedTax)}` : ''}
              details={dashboardSnapshot(p)}
              disabled={!p.hasAnyIncome}
            />
          )}
        </section>
      )}

      {/* Mixed earners have TWO income boxes; one save action belongs to
          the pair, spanning beneath both rather than living inside either. */}
      {p.isMixed && (
        <div className="save-standalone">
          <SaveToHistoryButton
            calculatorName="Income Profile"
            summary={p.hasAnyIncome ? `${PROFILE_LABELS.mixed} — net ${formatPHP(p.netIncomePreTax)}, tax ${formatPHP(p.estimatedTax)}` : ''}
            details={dashboardSnapshot(p)}
            disabled={!p.hasAnyIncome}
          />
        </div>
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

      {p.needsPayrollTiles && p.netPayResult && (
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

      {p.isMultiEmployer && (
        <section className="card">
          <h2>Filing Schedule</h2>
          <p className="empty-copy">
            With multiple employers, substituted filing does NOT cover you: each employer issues their own BIR Form
            2316, and YOU must file BIR Form 1700 by April 15, combining all incomes and settling any balance due.
            Each employer withholds against your salary with them alone &mdash; the combined tax is almost always
            higher than the combined withholding.
          </p>
        </section>
      )}

      {p.isSmwe && (
        <section className="card">
          <h2>Filing Schedule</h2>
          <p className="empty-copy">
            A minimum wage earner whose income is entirely within the statutory minimum wage is exempt from income
            tax, and with a single employer your annual return is substituted-filed (BIR Form 2316) &mdash; nothing
            to file yourself. Holiday pay, overtime, and night differential are still taxable and appear on your
            2316.
          </p>
        </section>
      )}

      {p.isOfw && (
        <section className="card">
          <h2>Filing Schedule</h2>
          <p className="empty-copy">
            Income exclusively from abroad is exempt for a non-resident citizen and needs no annual return. If you
            also earned Philippine-source pay, your PH employer&apos;s substituted filing (BIR Form 2316) covers it
            &mdash; file yourself only if you had multiple PH employers or other PH income.
          </p>
        </section>
      )}

      {p.needsEstateTrustFields && p.hasEstateTrustIncome && (
        <section className="card">
          <h2>Filing Schedule</h2>
          <FilingCountdown profileType={p.profileType} />
          <p className="disclaimer" style={{ marginTop: 16 }}>
            An estate or trust still earning income files like an individual: 1701 annually, 1701Q each quarter.
            The estate itself may also owe estate tax on the decedent&apos;s net estate &mdash; see the Property &amp;
            Transfer calculator.
          </p>
        </section>
      )}

      {p.needsCorporateFields && p.hasCorporateIncome && (
        <section className="card">
          <h2>Filing Schedule</h2>
          <FilingCountdown profileType={p.profileType} />
          <p className="disclaimer" style={{ marginTop: 16 }}>
            A domestic corporation files 1702Q on the 60th day after each of the first three quarters and 1702 by
            April 15. VAT or percentage tax obligations are computed in the Business Taxes calculator.
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
