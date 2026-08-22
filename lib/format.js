/** Formats a number as Philippine peso, e.g. 125000.4 -> "₱125,000". Returns
 * an em dash for null/NaN so empty states never show "₱NaN". */
export function formatPHP(amount) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—'
  return '₱' + Math.round(amount).toLocaleString('en-PH')
}

/** Formats a fraction (0.183) as a percent string ("18.3%"). */
export function formatPercent(fraction) {
  if (fraction === null || fraction === undefined || Number.isNaN(fraction)) return '—'
  return (fraction * 100).toFixed(1) + '%'
}
