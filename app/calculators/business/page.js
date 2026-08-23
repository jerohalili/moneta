import BusinessTaxCalculator from '@/components/BusinessTaxCalculator'

export const metadata = {
  title: 'VAT & Percentage Tax Calculator — Moneta',
}

export default function BusinessTaxPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">VAT & Percentage Tax</h2>
        <p className="page-subtitle">12% VAT or 3% percentage tax for businesses and freelancers.</p>
      </div>
      <BusinessTaxCalculator />
    </>
  )
}
