import FreelancerWorkbench from '@/components/FreelancerWorkbench'

const ROADMAP_TILES = [
  {
    name: 'Sales Tax Bucket',
    description: 'A running total of VAT/percentage tax collected, separate from income tax owed.',
    why: "Needs VAT input/output-credit logic that isn't modeled yet — today's numbers are income-tax-only.",
  },
  {
    name: 'Payroll Contributions',
    description: 'SSS, PhilHealth, and Pag-IBIG withholding summaries, for freelancers who employ staff.',
    why: "Needs the 2026 SSS/PhilHealth/Pag-IBIG contribution tables added to data/, which aren't in the codebase yet.",
  },
  {
    name: 'Historical Archive',
    description: 'Multi-year lookups to compare how your tax position changed year over year.',
    why: 'Needs an account + database to persist anything between visits — planned, not built.',
  },
]

export default function Dashboard() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Your Tax Snapshot</h2>
        <p className="page-subtitle">
          Enter your numbers once below — every figure on this page recalculates live from the same inputs.
        </p>
      </div>

      <FreelancerWorkbench variant="dashboard" />

      <div className="section-heading">
        <h2>On the roadmap</h2>
      </div>
      <div className="calc-grid">
        {ROADMAP_TILES.map((tile) => (
          <div className="calc-tile is-soon" key={tile.name}>
            <div className="calc-tile-top">
              <h3>{tile.name}</h3>
              <span className="status-pill soon">Coming soon</span>
            </div>
            <p>{tile.description}</p>
            <p className="roadmap-why">{tile.why}</p>
          </div>
        ))}
      </div>
    </>
  )
}
