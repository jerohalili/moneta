import SoleVsCorpCalculator from '@/components/SoleVsCorpCalculator'

export const metadata = {
  title: 'Sole Proprietorship vs Corporation — Moneta',
}

export default function SoleVsCorpPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">Sole Proprietorship vs Corporation</h2>
        <p className="page-subtitle">Compare income tax burden to help decide on a business structure.</p>
      </div>
      <SoleVsCorpCalculator />
    </>
  )
}
