'use client'

import { useEffect, useState } from 'react'
import { getHistory, deleteHistoryEntry, clearHistory } from '@/lib/history'

export default function HistoryList() {
  // Starts null so server/client agree on first render; loaded from
  // localStorage right after mount (see lib/localStore.js — this data
  // only exists in the browser, there's no server to render it from).
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of localStorage, not a render-derivable value
    setEntries(getHistory())
    // Cloud sync can add/remove entries after sign-in or a pull.
    function refresh() {
      setEntries(getHistory())
    }
    window.addEventListener('moneta:history-changed', refresh)
    return () => window.removeEventListener('moneta:history-changed', refresh)
  }, [])

  function handleDelete(id) {
    setEntries(deleteHistoryEntry(id))
  }

  function handleClear() {
    clearHistory()
    setEntries([])
  }

  if (entries === null) {
    return <div className="card" aria-hidden="true" />
  }

  if (entries.length === 0) {
    return (
      <div className="card">
        <p className="empty-copy">
          No history yet. Every calculator has a &ldquo;Save to History&rdquo; button — use it to keep a dated
          record of a result you want to come back to.
        </p>
        <p className="disclaimer" style={{ marginTop: 12 }}>
          This is stored only in this browser (no account system exists yet — see CONTINUE.md), so it won&apos;t
          follow you to another device, and clearing your browser data clears this too.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p className="empty-copy" style={{ margin: 0 }}>{entries.length} saved calculation{entries.length === 1 ? '' : 's'}</p>
          <button type="button" className="ledger-row-remove" style={{ fontSize: 13 }} onClick={handleClear}>Clear all</button>
        </div>
        <ul className="ledger-list">
          {entries.map((entry) => (
            <li className="ledger-row" key={entry.id} style={{ alignItems: 'flex-start' }}>
              <span className="ledger-row-main" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                <span className="ledger-row-label">{entry.calculatorName}</span>
                <span className="ledger-row-category" style={{ textTransform: 'none' }}>{entry.summary}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                  {new Date(entry.savedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </span>
              <button type="button" className="ledger-row-remove" onClick={() => handleDelete(entry.id)} aria-label={`Delete ${entry.calculatorName} entry`}>×</button>
            </li>
          ))}
        </ul>
      </div>
      <p className="disclaimer">
        Stored only in this browser — no account system exists yet, so this won&apos;t sync across devices and
        clearing browser data clears this too. Figures shown were computed at save time and don&apos;t update if
        rates change later.
      </p>
    </>
  )
}
