import PropertyTaxCalculator from '@/components/PropertyTaxCalculator'

export const metadata = {
  title: 'Property & Transfer Taxes Calculator — Moneta',
}

export default function PropertyTaxPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Property & Transfer Taxes</h2>
        <p className="page-subtitle">Capital gains, documentary stamp, estate, and donor&apos;s tax.</p>
      </div>
      <PropertyTaxCalculator />
    </>
  )
}
