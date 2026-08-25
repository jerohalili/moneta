import Link from 'next/link'

const CATEGORIES = [
  {
    name: 'Personal Income',
    calculators: [
      {
        name: 'Freelancer / Self-Employed Tax',
        description: '8% flat rate vs. graduated rate (OSD or itemized), compared side by side.',
        href: '/calculators/freelancer',
      },
      {
        name: 'Employee Income Tax',
        description: 'Withholding tax on compensation income.',
        href: '/calculators/employee',
      },
      {
        name: 'Variable Income',
        description: 'Income tax and 13th month pay when your salary changes mid-year.',
        href: '/calculators/variable-income',
      },
      {
        name: 'Mixed Income Tax',
        description: 'Combined tax on employment salary and business/freelance income.',
        href: '/calculators/mixed-income',
      },
      {
        name: 'Rental Income (8% Election)',
        description: 'Landlords: 8% flat on gross vs. graduated with your actual expenses.',
        href: '/calculators/rental',
      },
      {
        name: 'Passive Income & Final Taxes',
        description: 'Interest, dividends, royalties, share gains, and prizes — flat final taxes.',
        href: '/calculators/passive-income',
      },
    ],
  },
  {
    name: 'Payroll & Benefits',
    calculators: [
      {
        name: '13th Month Pay',
        description: 'Statutory computation and tax-exempt threshold.',
        href: '/calculators/thirteenth-month',
      },
      {
        name: 'Overtime Pay',
        description: 'Regular days, rest days, holidays, and night differential.',
        href: '/calculators/overtime',
      },
      {
        name: 'Contributions',
        description: 'SSS, PhilHealth, and Pag-IBIG monthly contributions.',
        href: '/calculators/contributions',
      },
      {
        name: 'Net Pay / Payslip',
        description: 'Take-home pay after contributions and withholding tax.',
        href: '/calculators/net-pay',
      },
    ],
  },
  {
    name: 'Business',
    calculators: [
      {
        name: 'Corporate Income Tax',
        description: 'RCIT under the CREATE Act — 25% standard or 20% reduced rate, with MCIT.',
        href: '/calculators/corporate',
      },
      {
        name: 'VAT & Percentage Tax',
        description: '12% VAT or 3% percentage tax for businesses and freelancers.',
        href: '/calculators/business',
      },
      {
        name: 'BMBE Tax Savings',
        description: 'Check eligibility and compute your income tax savings.',
        href: '/calculators/bmbe',
      },
      {
        name: 'Sole Prop vs Corporation',
        description: 'Compare tax burden to find the best structure.',
        href: '/calculators/sole-prop-vs-corp',
      },
      {
        name: 'Expanded Withholding Tax (EWT)',
        description: 'Professional fees, rentals, contractors, and government money payments.',
        href: '/calculators/ewt',
      },
    ],
  },
  {
    name: 'Property & Transfer',
    calculators: [
      {
        name: 'Property & Transfer Taxes',
        description: 'Capital gains, documentary stamp, real property, and estate/donor\u2019s tax — one calculator, five modes.',
        href: '/calculators/property',
      },
    ],
  },
  {
    name: 'Penalties & Compliance',
    calculators: [
      {
        name: 'BIR Penalties & Surcharges',
        description: 'Surcharge, interest, and compromise penalty estimates for late filing.',
        href: '/calculators/penalties',
      },
      {
        name: 'BIR Closure Penalty Estimator',
        description: 'Accumulated penalties from unfiled returns after stopping operations.',
        href: '/calculators/closure-penalty',
      },
      {
        name: 'BIR Filing Calendar',
        description: 'Find forms and due dates for your tax type.',
        href: '/calculators/filing-calendar',
      },
    ],
  },
  {
    name: 'BIR Tools',
    calculators: [
      {
        name: 'BIR Form Finder',
        description: 'Answer a few questions to find out exactly which forms you need to file.',
        href: '/calculators/form-finder',
      },
      {
        name: 'Quarterly Income Tax (1701Q)',
        description: 'The cumulative quarter-by-quarter worksheet with withholding credits.',
        href: '/calculators/quarterly-income-tax',
      },
    ],
  },
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
          Every calculator recalculates live as you type, and compares every legal route side by side &mdash; no
          &ldquo;Calculate&rdquo; button, no single-answer guesswork.
        </p>
      </div>
      {CATEGORIES.map((category) => (
        <div key={category.name}>
          <div className="section-heading">
            <h2>{category.name}</h2>
          </div>
          <div className="calc-grid">
            {category.calculators.map((calc) => (
              <Link href={calc.href} className="calc-tile-link" key={calc.name}>
                <div className="calc-tile">
                  <div className="calc-tile-top">
                    <h3>{calc.name}</h3>
                    <span className="status-pill live">Live</span>
                  </div>
                  <p>{calc.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
