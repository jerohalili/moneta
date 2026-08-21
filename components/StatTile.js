const TONE_GLYPH = {
  accent: '₱',
  info: '%',
  good: '↓',
  danger: '△',
}

export default function StatTile({ label, value, tone = 'accent' }) {
  const isEmpty = value == null || value === '—'
  return (
    <div className="stat-tile">
      <div className={`stat-icon tone-${tone}`} aria-hidden="true">
        {TONE_GLYPH[tone] ?? '₱'}
      </div>
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${isEmpty ? 'is-empty' : ''}`}>{value ?? '—'}</div>
    </div>
  )
}
