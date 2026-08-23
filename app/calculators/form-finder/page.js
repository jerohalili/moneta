import FormFinder from '@/components/FormFinder'

export const metadata = {
  title: 'BIR Form Finder — Moneta',
}

export default function FormFinderPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">BIR Form Finder</h2>
        <p className="page-subtitle">Answer a few questions to find out which forms you likely need to file.</p>
      </div>
      <FormFinder />
    </>
  )
}
