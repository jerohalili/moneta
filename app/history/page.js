export const metadata = {
  title: 'History — Moneta',
}

export default function HistoryPage() {
  return (
    <>
      <div className="page-heading">
        <h2 className="page-title">History</h2>
        <p className="page-subtitle">Every calculation you run gets logged here, tied to your account.</p>
      </div>
      <div className="card">
        <p className="empty-copy">
          No history yet. Once accounts are enabled, every calculator run is saved here with a timestamp and a
          snapshot of the inputs used &mdash; so you can track how your tax position changes as your income does.
        </p>
      </div>
    </>
  )
}
