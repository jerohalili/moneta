import ContributionsCalculator from '@/components/ContributionsCalculator'

export const metadata = {
  title: 'Contributions Calculator — Moneta',
}

export default function ContributionsCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Contributions</h2>
        <p className="page-subtitle">SSS, PhilHealth, and Pag-IBIG monthly contributions, computed live.</p>
      </div>
      <ContributionsCalculator />
    </>
  )
}
