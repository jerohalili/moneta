import PenaltiesCalculator from '@/components/PenaltiesCalculator'

export const metadata = {
  title: 'BIR Penalties Calculator — Moneta',
}

export default function PenaltiesPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">BIR Penalties</h2>
        <p className="page-subtitle">Surcharge, interest, and compromise penalty estimates for late filing.</p>
      </div>
      <PenaltiesCalculator />
    </>
  )
}
