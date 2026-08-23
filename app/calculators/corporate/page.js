import CorporateTaxCalculator from '@/components/CorporateTaxCalculator'

export const metadata = {
  title: 'Corporate Income Tax Calculator — Moneta',
}

export default function CorporatePage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Corporate Income Tax</h2>
        <p className="page-subtitle">RCIT under the CREATE Act — 25% standard or 20% reduced rate, with MCIT.</p>
      </div>
      <CorporateTaxCalculator />
    </>
  )
}
