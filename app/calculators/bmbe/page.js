import BmbeCalculator from '@/components/BmbeCalculator'

export const metadata = {
  title: 'BMBE Tax Savings Calculator — Moneta',
}

export default function BmbePage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">BMBE Tax Savings</h2>
        <p className="page-subtitle">Check eligibility and compute your income tax savings.</p>
      </div>
      <BmbeCalculator />
    </>
  )
}
