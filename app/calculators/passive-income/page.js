import PassiveIncomeCalculator from '@/components/PassiveIncomeCalculator'

export const metadata = {
  title: 'Passive Income & Final Taxes Calculator — Moneta',
}

export default function PassiveIncomeCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Passive Income &amp; Final Taxes</h2>
        <p className="page-subtitle">
          Interest, dividends, royalties, share gains, and prizes — flat taxes withheld at source, computed live.
        </p>
      </div>
      <PassiveIncomeCalculator />
    </>
  )
}
