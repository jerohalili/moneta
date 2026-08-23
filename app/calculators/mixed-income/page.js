import MixedIncomeCalculator from '@/components/MixedIncomeCalculator'

export const metadata = {
  title: 'Mixed Income Tax Calculator — Moneta',
}

export default function MixedIncomePage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Mixed Income Tax</h2>
        <p className="page-subtitle">Combined tax on employment salary and business/freelance income.</p>
      </div>
      <MixedIncomeCalculator />
    </>
  )
}
