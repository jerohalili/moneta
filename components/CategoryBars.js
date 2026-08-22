'use client'

import { formatPHP } from '@/lib/format'

export default function CategoryBars({ categoryTotals }) {
  if (categoryTotals.length === 0) {
    return <p className="empty-copy">Log an expense below and its category will show up here.</p>
  }

  const max = Math.max(...categoryTotals.map((c) => c.total))

  return (
    <div className="category-bars">
      {categoryTotals.map((c) => (
        <div className="category-bar-row" key={c.id}>
          <div className="category-bar-label">{c.label}</div>
          <div className="category-bar-track">
            <div className="category-bar-fill" style={{ width: `${(c.total / max) * 100}%` }} />
          </div>
          <div className="category-bar-value">{formatPHP(c.total)}</div>
        </div>
      ))}
    </div>
  )
}
