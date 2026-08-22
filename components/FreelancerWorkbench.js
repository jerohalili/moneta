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
            this is a planning estimate, not what you&apos;d file.)
          </p>
          <div className="stat-tile" style={{ border: 'none', padding: 0, background: 'transparent' }}>
            <div className="stat-label">Set aside per quarter</div>
            <div className="stat-value">{wb.hasIncome ? formatPHP(wb.quarterlyReserve) : '—'}</div>
          </div>
        </section>
      </div>

      <section className="card">
        <h2>Expense Categories</h2>
        <CategoryBars categoryTotals={wb.categoryTotals} />
      </section>

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
        tax advice. Numbers are session-only &mdash; nothing is saved once you close this tab, since accounts and
        storage aren&apos;t wired up yet.
      </p>
    </>
  )
}
