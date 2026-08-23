import OvertimeCalculator from '@/components/OvertimeCalculator'

export const metadata = {
  title: 'Overtime Pay Calculator — Moneta',
}

export default function OvertimePage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Overtime Pay</h2>
        <p className="page-subtitle">Regular days, rest days, holidays, and night differential.</p>
      </div>
      <OvertimeCalculator />
    </>
  )
}
