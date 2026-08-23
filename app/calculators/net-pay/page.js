import NetPayCalculator from '@/components/NetPayCalculator'

export const metadata = {
  title: 'Net Pay Calculator — Moneta',
}

export default function NetPayCalculatorPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Net Pay</h2>
        <p className="page-subtitle">Take-home pay after contributions and withholding tax.</p>
      </div>
      <NetPayCalculator />
    </>
  )
}
