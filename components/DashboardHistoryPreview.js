'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getHistory } from '@/lib/history'

const PREVIEW_COUNT = 4

export default function DashboardHistoryPreview() {
  // Starts null so server/client agree on first render; loaded from
  // localStorage right after mount, same pattern as HistoryList.js.
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage, not a render-derivable value
    setEntries(getHistory())
  }, [])

  // Nothing saved yet, or still loading — don't show an empty card on
  // every single Dashboard visit before someone's saved anything.
  if (!entries || entries.length === 0) return null

  return (
    <section className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Recent History</h2>
        <Link href="/history" style={{ fontSize: 13 }}>View all →</Link>
      </div>
      <ul className="ledger-list">
        {entries.slice(0, PREVIEW_COUNT).map((entry) => (
          <li className="ledger-row" key={entry.id}>
            <span className="ledger-row-main">
              <span className="ledger-row-label">{entry.calculatorName}</span>
              <span className="ledger-row-category" style={{ textTransform: 'none' }}>{entry.summary}</span>
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
              {new Date(entry.savedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
            </span>
          </li>
        ))}
      </ul>
      <p className="disclaimer" style={{ marginTop: 16 }}>
        A local, browser-only history — not a full cross-device Historical Archive, which still needs an account
        system (see the roadmap below). This already lets you glance back at how your numbers have moved over
        time without waiting on that.
      </p>
    </section>
  )
}
