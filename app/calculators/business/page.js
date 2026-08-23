import BusinessTaxCalculator from '@/components/BusinessTaxCalculator'

export const metadata = {
  title: 'Business Taxes Calculator — Moneta',
}

export default function BusinessTaxPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Business Taxes</h2>
        <p className="page-subtitle">Percentage tax for non-VAT-registered businesses.</p>
      </div>
      <BusinessTaxCalculator />
    </>
  )
}
