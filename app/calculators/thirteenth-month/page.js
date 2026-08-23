import ThirteenthMonthCalculator from '@/components/ThirteenthMonthCalculator'

export const metadata = {
  title: '13th Month Pay Calculator — Moneta',
}

export default function ThirteenthMonthPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">13th Month Pay</h2>
        <p className="page-subtitle">Statutory computation and tax-exempt threshold.</p>
      </div>
      <ThirteenthMonthCalculator />
    </>
  )
}
