import StatTile from '@/components/StatTile'
import ChartPlaceholder from '@/components/ChartPlaceholder'

export default function Dashboard() {
  return (
    <>
      <section className="card profile-card">
        <div className="profile-card-text">
          <h2>Your Income Profile</h2>
          <p className="empty-copy">
            Set up your profile once and this dashboard fills in automatically &mdash; your tax position, a
            breakdown chart, and personalized savings flags, all computed from the same numbers every calculator
            uses.
          </p>
        </div>
        <span className="status-pill soon">Coming soon</span>
      </section>

      <section>
        <div className="section-heading">
          <h2>Your Tax Snapshot</h2>
        </div>
        <div className="stat-grid">
          <StatTile label="Gross Income" value="—" />
          <StatTile label="Estimated Tax Owed" value="—" />
          <StatTile label="Effective Rate" value="—" />
          <StatTile label="Est. Take-Home" value="—" />
        </div>
      </section>

      <section className="card">
        <h2>Income Breakdown</h2>
        <ChartPlaceholder message="Once your Income Profile is set up, your income and tax breakdown will be charted here." />
      </section>

      <section className="card">
        <h2>Recommendations</h2>
        <p className="empty-copy">
          No recommendations yet. Once your Income Profile is set up, the Advisor scans it against BIR rules and
          surfaces legal ways to lower what you owe here &mdash; each one cited to the specific provision behind
          it.
        </p>
      </section>
    </>
  )
}
