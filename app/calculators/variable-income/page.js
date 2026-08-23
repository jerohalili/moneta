import VariableIncomeCalculator from '@/components/VariableIncomeCalculator'

export const metadata = {
  title: 'Variable Income Calculator — Moneta',
}

export default function VariableIncomePage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Variable Income</h2>
        <p className="page-subtitle">Income tax and 13th month pay when your salary changes mid-year.</p>
      </div>
      <VariableIncomeCalculator />
    </>
  )
}
