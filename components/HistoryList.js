'use client'

import { useEffect, useMemo, useState } from 'react'
import { getHistory, deleteHistoryEntry, clearHistory } from '@/lib/history'
import { formatPHP, formatPercent } from '@/lib/format'

/**
 * The saved-calculation archive. Every snapshot carries its full figure
 * set in `details` — this page is where that earns its keep: filter by
 * calculator, expand an entry to see exactly what was true on the day it
 * was saved, and export the whole log.
 */
export default function HistoryList() {
  const [entries, setEntries] = useState(null)
  const [filter, setFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

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

  const calculatorNames = useMemo(() => {
    if (!entries) return []
    return [...new Set(entries.map((e) => e.calculatorName))].sort()
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    return filter === 'all' ? entries : entries.filter((e) => e.calculatorName === filter)
  }, [entries, filter])

  function handleDelete(id) {
    setEntries(deleteHistoryEntry(id))
  }

  function handleClear() {
    clearHistory()
    setEntries([])
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(entries ?? [], null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moneta-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (entries === null) {
    return <div className="card" aria-hidden="true" />
  }

  if (entries.length === 0) {
    return (
      <div className="card">
        <h2>Nothing saved yet</h2>
        <p className="empty-copy">
          Every calculator and the Dashboard advisor has a &ldquo;Save to History&rdquo; button. Use it to
          keep a dated snapshot of your numbers — then this page shows you how they moved over time.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="history-toolbar">
          <p className="empty-copy" style={{ margin: 0 }}>
            {filtered.length} of {entries.length} saved calculation{entries.length === 1 ? '' : 's'}
            {filter !== 'all' ? ` — ${filter}` : ''}
          </p>
          <div className="history-toolbar-actions">
            <button type="button" className="settings-secondary-btn" onClick={handleExport}>
              Export JSON
            </button>
            <button type="button" className="ledger-row-remove" style={{ fontSize: 13 }} onClick={handleClear}>
              Clear all
            </button>
          </div>
        </div>

        {calculatorNames.length > 1 && (
          <div className="history-filters">
            <button
              type="button"
              className={filter === 'all' ? 'history-chip is-active' : 'history-chip'}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {calculatorNames.map((name) => (
              <button
                key={name}
                type="button"
                className={filter === name ? 'history-chip is-active' : 'history-chip'}
                onClick={() => setFilter(name)}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <ul className="ledger-list">
          {filtered.map((entry) => {
            const expanded = expandedId === entry.id
            return (
              <li className="ledger-row history-row" key={entry.id} style={{ alignItems: 'flex-start' }}>
                <span className="ledger-row-main" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                  <button
                    type="button"
                    className="history-row-head"
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    aria-expanded={expanded}
                  >
                    <span className="history-chevron" aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                    <span className="history-row-titles">
                      <span className="ledger-row-label">{entry.calculatorName}</span>
                      <span className="ledger-row-category" style={{ textTransform: 'none' }}>{entry.summary}</span>
                    </span>
                    <span className="history-row-date">
                      {new Date(entry.savedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </button>

                  {expanded && (
                    <div className="history-detail">
                      {detailRows(entry.details).length > 0 ? (
                        <dl className="history-detail-grid">
                          {detailRows(entry.details).map(([key, value]) => (
                            <div key={key} className="history-detail-item">
                              <dt>{prettyKey(key)}</dt>
                              <dd>{formatValue(key, value)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="empty-copy">No figures were stored with this snapshot.</p>
                      )}
                      <p className="history-detail-note">
                        Figures are as computed at save time — they don&apos;t update when rates change later.
                      </p>
                    </div>
                  )}
                </span>
                <button type="button" className="ledger-row-remove" onClick={() => handleDelete(entry.id)} aria-label={`Delete ${entry.calculatorName} entry`}>
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <p className="disclaimer">
        Synced to your account automatically — signed in or guest, your history follows you to any device.
        Deleting here removes it everywhere.
      </p>
    </>
  )
}

/** Flattens the snapshot into display rows: primitives only, ordered with
 * money-ish fields first so the important numbers lead. */
function detailRows(details) {
  if (!details || typeof details !== 'object') return []
  const pairs = Object.entries(details).filter(
    ([, v]) => v === null || typeof v !== 'object'
  )
  const moneyFirst = (k) => (/tax|income|home|pay|receipt|sales|expense|contribution/i.test(k) ? 0 : 1)
  return pairs.sort((a, b) => moneyFirst(a[0]) - moneyFirst(b[0]))
}

function prettyKey(key) {
  const spaced = String(key).replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatValue(key, value) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (/rate|percent|ratio/i.test(key)) return formatPercent(value)
    return formatPHP(value)
  }
  return String(value)
}
