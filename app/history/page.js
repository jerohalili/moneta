import HistoryList from '@/components/HistoryList'

export const metadata = {
  title: 'History — Moneta',
}

export default function HistoryPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">History</h2>
        <p className="page-subtitle">Calculations you&apos;ve explicitly saved, with a timestamp and a snapshot of the numbers.</p>
      </div>
      <HistoryList />
    </>
  )
}
