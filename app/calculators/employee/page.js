import EmployeeTaxCalculator from '@/components/EmployeeTaxCalculator'

export const metadata = {
  title: 'Employee Income Tax Calculator — Moneta',
}

export default function EmployeeCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Employee Income Tax</h2>
        <p className="page-subtitle">Withholding tax on compensation income, recalculated live as you type.</p>
      </div>
      <EmployeeTaxCalculator />
    </>
  )
}
