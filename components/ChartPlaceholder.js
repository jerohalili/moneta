export default function ChartPlaceholder({ message }) {
  return (
    <div className="chart-placeholder">
      <svg width="220" height="110" viewBox="0 0 220 110" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="14" y="50" width="34" height="48" rx="4" fill="var(--accent)" opacity="0.55" />
        <rect x="64" y="24" width="34" height="74" rx="4" fill="var(--accent-2)" opacity="0.55" />
        <rect x="114" y="62" width="34" height="36" rx="4" fill="var(--good)" opacity="0.55" />
        <rect x="164" y="10" width="34" height="88" rx="4" fill="var(--accent-4)" opacity="0.55" />
        <line x1="6" y1="98" x2="214" y2="98" stroke="var(--ink-soft)" strokeWidth="1" opacity="0.4" />
      </svg>
      <p>{message}</p>
    </div>
  )
}
