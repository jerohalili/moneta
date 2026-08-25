import RentalIncomeCalculator from '@/components/RentalIncomeCalculator'

export const metadata = {
  title: 'Rental Income Tax Calculator — Moneta',
}

export default function RentalCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Rental Income Tax</h2>
        <p className="page-subtitle">
          8% flat election vs. graduated + deductions, compared side by side — recalculated live as you type.
        </p>
      </div>
      <RentalIncomeCalculator />
    </>
  )
}
