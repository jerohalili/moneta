import QuarterlyTaxCalculator from '@/components/QuarterlyTaxCalculator'

export const metadata = {
  title: 'Quarterly Income Tax (1701Q) Calculator — Moneta',
}

export default function QuarterlyTaxCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Quarterly Income Tax (1701Q)</h2>
        <p className="page-subtitle">
          The cumulative quarter-by-quarter worksheet with withholding credits — not four equal slices.
        </p>
      </div>
      <QuarterlyTaxCalculator />
    </>
  )
}
