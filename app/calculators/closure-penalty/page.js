import ClosurePenaltyCalculator from '@/components/ClosurePenaltyCalculator'

export const metadata = {
  title: 'BIR Closure Penalty Estimator — Moneta',
}

export default function ClosurePenaltyPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">BIR Closure Penalty Estimator</h2>
        <p className="page-subtitle">Accumulated penalties from unfiled returns after stopping operations.</p>
      </div>
      <ClosurePenaltyCalculator />
    </>
  )
}
