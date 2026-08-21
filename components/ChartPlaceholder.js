export default function ChartPlaceholder({ message }) {
  return (
    <div className="chart-placeholder">
      <svg width="180" height="90" viewBox="0 0 180 90" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="10" y="40" width="28" height="40" rx="2" fill="var(--rule)" />
        <rect x="52" y="20" width="28" height="60" rx="2" fill="var(--rule)" />
        <rect x="94" y="52" width="28" height="28" rx="2" fill="var(--rule)" />
        <rect x="136" y="8" width="28" height="72" rx="2" fill="var(--rule)" />
        <line x1="4" y1="80" x2="176" y2="80" stroke="var(--ink-soft)" strokeWidth="1" />
      </svg>
      <p>{message}</p>
    </div>
  )
}
