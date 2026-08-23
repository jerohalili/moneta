import EwtCalculator from '@/components/EwtCalculator'

export const metadata = {
  title: 'Expanded Withholding Tax Calculator — Moneta',
}

export default function EwtPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Expanded Withholding Tax (EWT)</h2>
        <p className="page-subtitle">Professional fees, rentals, contractors, and government money payments.</p>
      </div>
      <EwtCalculator />
    </>
  )
}
