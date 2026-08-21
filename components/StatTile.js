export default function StatTile({ label, value }) {
  const isEmpty = value == null || value === '—'
  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${isEmpty ? 'is-empty' : ''}`}>{value ?? '—'}</div>
    </div>
  )
}
