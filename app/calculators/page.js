const CALCULATORS = [
  {
    name: 'Freelancer / Self-Employed Tax',
    description: '8% flat rate vs. graduated rate (OSD or itemized), compared side by side.',
  },
  { name: 'Employee Income Tax', description: 'Withholding tax on compensation income.' },
  { name: 'Contributions', description: 'SSS, PhilHealth, and Pag-IBIG monthly contributions.' },
  { name: 'Net Pay', description: 'Take-home pay after contributions and withholding tax.' },
  { name: '13th Month Pay', description: 'Statutory computation and tax-exempt threshold.' },
  { name: 'Business Taxes', description: 'Percentage tax, VAT, and quarterly filings for registered businesses.' },
  { name: 'Property & Transfer Taxes', description: 'Capital gains, documentary stamp, and estate/donor\u2019s tax.' },
  { name: 'BIR Penalties', description: 'Surcharge, interest, and compromise penalty estimates for late filing.' },
]

export const metadata = {
  title: 'Calculators — Moneta',
}

export default function CalculatorsPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Calculators</h2>
        <p className="page-subtitle">
          Every calculator reads from your Income Profile &mdash; set your numbers once, and they stay in sync
          across all of them.
        </p>
      </div>
      <div className="calc-grid">
        {CALCULATORS.map((calc) => (
          <div className="calc-tile is-soon" key={calc.name}>
            <div className="calc-tile-top">
              <h3>{calc.name}</h3>
              <span className="status-pill soon">Coming soon</span>
            </div>
            <p>{calc.description}</p>
          </div>
        ))}
      </div>
    </>
  )
}
