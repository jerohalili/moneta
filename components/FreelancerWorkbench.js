'use client'

import { useFreelancerTax } from '@/hooks/useFreelancerTax'
import { formatPHP, formatPercent } from '@/lib/format'
import StatTile from './StatTile'
import FilingCountdown from './FilingCountdown'
import ExpenseLedger from './ExpenseLedger'
import CategoryBars from './CategoryBars'
import RouteComparison from './RouteComparison'
import TipsList from './TipsList'
import ErrorFlags from './ErrorFlags'
import SaveToHistoryButton from './SaveToHistoryButton'

export default function FreelancerWorkbench() {
  const wb = useFreelancerTax()

  return (
    <>
      <section className="card glow-card">
        <h2>Your numbers</h2>
        <p className="empty-copy" style={{ marginBottom: 18 }}>
          Everything below recalculates as you type &mdash; there&apos;s no &ldquo;Calculate&rdquo; button to press.
        </p>
        <div className="field">
          <label htmlFor="gross-receipts">Gross receipts this year (₱)</label>
          <input
            id="gross-receipts"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 850000"
            value={wb.grossReceiptsInput}
            onChange={(e) => wb.setGrossReceiptsInput(e.target.value)}
          />
        </div>

      <SaveToHistoryButton
        calculatorName="Freelancer / Self-Employed Tax"
        summary={wb.hasIncome ? `${wb.comparison.best.method.replace('-', ' ')} route — tax ${formatPHP(wb.comparison.best.total)}` : ''}
        details={{
          grossReceipts: wb.grossReceipts,
          itemizedExpenses: wb.itemizedExpenses,
          bestRoute: wb.comparison?.best?.method,
          estimatedTax: wb.estimatedTax,
          takeHome: wb.takeHome,
        }}
        disabled={!wb.hasIncome}
      />
      </section>

      {/* The ledger is an INPUT (it drives the itemized route), so it sits
          with the inputs — above the results — not buried at the bottom. */}
      <section className="card">
        <h2>Write-off Ledger</h2>
        <ExpenseLedger
          draft={wb.draft}
          setDraft={wb.setDraft}
          addEntry={wb.addEntry}
          ledger={wb.ledger}
          removeEntry={wb.removeEntry}
          compact={false}
        />
      </section>

      <section className="card">
        <h2>Expense Categories</h2>
        <CategoryBars categoryTotals={wb.categoryTotals} />
      </section>

      <ErrorFlags errors={wb.errors} />

      <div className="stat-grid">
        <StatTile label="Net Income (Pre-Tax)" value={wb.hasIncome ? formatPHP(wb.netIncomePreTax) : '—'} />
        <StatTile label="Estimated Tax Owed" value={wb.hasIncome ? formatPHP(wb.estimatedTax) : '—'} />
        <StatTile label="Effective Rate" value={wb.hasIncome ? formatPercent(wb.effectiveRate) : '—'} />
        <StatTile label="Est. Take-Home" value={wb.hasIncome ? formatPHP(wb.takeHome) : '—'} />
      </div>

      <div className="dashboard-row">
        <section className="card">
          <h2>Filing Schedule</h2>
          <FilingCountdown profileType="freelancer" />
          <p className="disclaimer" style={{ marginTop: 16 }}>
            Standard statutory due dates for a calendar-year filer. If one lands on a weekend or holiday, BIR usually
            moves it to the next business day — double-check close to filing season.
          </p>
        </section>
        <section className="card">
          <h2>Quarterly Tax Reserve</h2>
          <p className="empty-copy" style={{ marginBottom: 12 }}>
            A simple even split of your estimated annual tax across four quarters, so you&apos;re not caught short at
            filing time. (The actual BIR quarterly form uses a running cumulative formula, not an even split &mdash;
            this is a planning estimate, not what you&apos;d file. The Quarterly Income Tax calculator computes the
            real worksheet.)
          </p>
          <div className="stat-grid">
            <StatTile label="Set aside per quarter" value={wb.hasIncome ? formatPHP(wb.quarterlyReserve) : '—'} />
          </div>
        </section>
      </div>

      {wb.hasIncome && (
        <section className="card">
          <h2>Every route, compared</h2>
          <RouteComparison comparison={wb.comparison} />
        </section>
      )}

      {wb.hasIncome && (
        <section className="card">
          <h2>Recommendations</h2>
          <TipsList tips={wb.tips} />
        </section>
      )}

      <p className="disclaimer">
        This is general information based on codified BIR rules (see the cited provisions above), not personalized
        tax advice. Your figures are saved in this browser and sync to your account when you&apos;re signed in.
      </p>
    </>
  )
}
