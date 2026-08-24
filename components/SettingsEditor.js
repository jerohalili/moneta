'use client'

import { useRef, useState } from 'react'
import {
  RATE_GROUPS,
  RATE_REGISTRY,
  RATES,
  getStoredOverrides,
  setRateOverride,
  resetRate,
  resetAllRates,
  exportOverrides,
  importOverrides,
} from '@/lib/taxConfig'

/**
 * The rate editor. Every constant in data/taxRates2026.js is surfaced here
 * with an explanation of what it legally does, grouped by domain.
 *
 * COMMIT MODEL: scalar fields commit on blur (typing partial numbers like
 * "0." must not fight the parser mid-keystroke). Tables keep a local
 * working copy and commit on cell blur / add / remove / fix-bases. All
 * writes go through lib/taxConfig.setRateOverride(), which validates,
 * persists, mutates the live RATES object, and notifies subscribers — so
 * every calculator on the site reflects the edit immediately.
 */
export default function SettingsEditor() {
  const [overridesMap, setOverridesMap] = useState(() => getStoredOverrides())
  const [importMessage, setImportMessage] = useState(null)
  const fileInputRef = useRef(null)

  function refreshOverrides() {
    setOverridesMap({ ...getStoredOverrides() })
    // CloudSyncManager pushes the new override set for signed-in users.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('moneta:rates-changed'))
  }

  function handleCommit(key, value) {
    setRateOverride(key, value)
    refreshOverrides()
  }

  function handleReset(key) {
    resetRate(key)
    refreshOverrides()
  }

  function handleResetAll() {
    resetAllRates()
    refreshOverrides()
  }

  function handleExport() {
    const blob = new Blob([exportOverrides()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moneta-rates-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportFile(file) {
    if (!file) return
    const text = await file.text()
    const result = importOverrides(text)
    setImportMessage(result.ok
      ? { ok: true, text: `Applied ${result.applied} customized value${result.applied === 1 ? '' : 's'}.` }
      : { ok: false, text: result.error })
    refreshOverrides()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const modifiedCount = Object.keys(overridesMap).length

  return (
    <>
      <section className="card">
        <h2>Why this exists</h2>
        <p className="empty-copy" style={{ marginBottom: 12 }}>
          The compiled defaults were verified against BIR sources in August 2026. But rates move: SSS steps
          its contribution schedule up most years, thresholds get re-legislated, LGUs re-zone. Instead of
          waiting for an app update, edit the figures here — every calculator, the Dashboard advisor, and the
          bracket walkthroughs all recompute from your edited values instantly. Each field&apos;s description
          doubles as documentation of what the figure controls.
        </p>
        <p className="disclaimer" style={{ marginTop: 0 }}>
          Custom values live only in this browser (localStorage) and are your responsibility to verify — the
          app won&apos;t second-guess them. Export your setup before clearing site data, or to carry it to
          another device until account sync exists.
        </p>
      </section>

      <section className="card">
        <h2>Your customization</h2>
        {modifiedCount > 0 ? (
          <div className="error-flags">
            <div className="error-flag" style={{ color: 'var(--accent)', background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
              <span className="error-flag-icon" aria-hidden="true">✓</span>
              <span>
                {modifiedCount} value{modifiedCount === 1 ? '' : 's'} customized against the compiled defaults.
                Everything on the site is computing with YOUR figures right now.
              </span>
            </div>
          </div>
        ) : (
          <p className="empty-copy" style={{ marginBottom: 12 }}>
            Using the compiled 2026 defaults — nothing customized yet.
          </p>
        )}
        <div className="settings-actions">
          <button type="button" className="btn-primary btn-small" onClick={handleExport}>
            Export my rates (JSON)
          </button>
          <button type="button" className="settings-secondary-btn" onClick={() => fileInputRef.current?.click()}>
            Import rates file…
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => handleImportFile(e.target.files?.[0])}
          />
          {modifiedCount > 0 && (
            <button type="button" className="settings-danger-btn" onClick={handleResetAll}>
              Reset everything to defaults
            </button>
          )}
        </div>
        {importMessage && (
          <p className={importMessage.ok ? 'settings-msg-ok' : 'settings-msg-err'}>{importMessage.text}</p>
        )}
      </section>

      {RATE_GROUPS.map((group) => {
        const entries = RATE_REGISTRY.filter((e) => e.group === group.id)
        return (
          <section className="card" key={group.id}>
            <h2>{group.label}</h2>
            <p className="empty-copy" style={{ marginBottom: 18 }}>{group.description}</p>

            {entries.map((entry) =>
              entry.kind === 'table' ? (
                <TableEditor
                  key={entry.key}
                  entry={entry}
                  modified={Boolean(overridesMap[entry.key])}
                  onCommit={handleCommit}
                  onReset={handleReset}
                />
              ) : (
                <ScalarField
                  key={entry.key}
                  entry={entry}
                  modified={Boolean(overridesMap[entry.key])}
                  onCommit={handleCommit}
                  onReset={handleReset}
                />
              )
            )}
          </section>
        )
      })}
    </>
  )
}

function unitSuffix(unit) {
  if (unit === 'percent') return '%'
  if (unit === 'currency') return '₱'
  if (unit === 'multiplier') return '×'
  return ''
}

function displayValue(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  if (unit === 'percent') return String(Number((value * 100).toFixed(4)))
  if (unit === 'currency') return String(Math.round(value))
  return String(Number(value.toFixed(4)))
}

function parseValue(text, unit) {
  const n = Number(text)
  if (text.trim() === '' || !Number.isFinite(n) || n < 0) return NaN
  return unit === 'percent' ? n / 100 : n
}

function ScalarField({ entry, modified, onCommit, onReset }) {
  const [text, setText] = useState(() => displayValue(RATES[entry.key], entry.unit))
  const [invalid, setInvalid] = useState(false)

  function commit() {
    if (text.trim() === '') {
      setText(displayValue(RATES[entry.key], entry.unit))
      setInvalid(false)
      return
    }
    const parsed = parseValue(text, entry.unit)
    if (Number.isNaN(parsed)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    onCommit(entry.key, parsed)
    setText(displayValue(RATES[entry.key], entry.unit))
  }

  function reset() {
    onReset(entry.key)
    setText(displayValue(RATES[entry.key], entry.unit))
    setInvalid(false)
  }

  return (
    <div className={invalid ? 'settings-field settings-field-invalid' : 'settings-field'}>
      <div className="settings-field-head">
        <label htmlFor={`rate-${entry.key}`}>{entry.label}</label>
        {modified && (
          <button type="button" className="settings-revert" onClick={reset} title="Restore the compiled default">
            customized — revert
          </button>
        )}
      </div>
      <div className="settings-input-row">
        {unitSuffix(entry.unit) !== '₱' && <span className="settings-unit">{unitSuffix(entry.unit)}</span>}
        <input
          id={`rate-${entry.key}`}
          type="number"
          inputMode="decimal"
          step="any"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
        />
        {unitSuffix(entry.unit) === '₱' && <span className="settings-unit">₱</span>}
      </div>
      <p className="settings-desc">{entry.description}</p>
      {invalid && <p className="settings-invalid-note">That isn&apos;t a usable number — reverted on blur.</p>}
    </div>
  )
}

function TableEditor({ entry, modified, onCommit, onReset }) {
  const [rows, setRows] = useState(() => normalizeRows(RATES[entry.key], entry.columns))

  function denormalize(localRows) {
    return localRows.map((row) => {
      const clean = {}
      for (const col of entry.columns) {
        if (col.unit === 'currency-or-inf') {
          clean[col.id] = String(row[col.id]).trim() === '' ? Infinity : Math.max(0, Number(row[col.id]) || 0)
        } else if (col.unit === 'percent') {
          clean[col.id] = Math.max(0, (Number(row[col.id]) || 0) / 100)
        } else {
          clean[col.id] = Math.max(0, Number(row[col.id]) || 0)
        }
      }
      return clean
    })
  }

  function commit(nextRows) {
    setRows(nextRows)
    onCommit(entry.key, denormalize(nextRows))
  }

  function updateCell(rowIndex, colId, value) {
    setRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, [colId]: value } : row)))
  }

  function commitCell(rowIndex, colId) {
    const next = rows.map((row, i) => {
      if (i !== rowIndex) return row
      const raw = String(row[colId]).trim()
      if (raw === '') {
        const committed = RATES[entry.key][rowIndex]
        return { ...row, [colId]: committed && Number.isFinite(committed[colId]) ? String(committed[colId]) : '' }
      }
      const n = Number(raw)
      if (!Number.isFinite(n) || n < 0) {
        const committed = RATES[entry.key][rowIndex]
        return { ...row, [colId]: String(committed?.[colId] ?? '') }
      }
      return row
    })
    commit(next)
  }

  function addRow() {
    const template = {}
    for (const col of entry.columns) template[col.id] = ''
    if (entry.fixBases && rows.length > 0) {
      const prev = rows[rows.length - 1]
      template.over = prev.upTo === '' ? '' : prev.upTo
    }
    commit([...rows, template])
  }

  function removeRow(index) {
    if (rows.length <= 1) return
    commit(rows.filter((_, i) => i !== index))
  }

  /** Recomputes the cumulative base column from the rates themselves —
   * base[i] = base[i-1] + width(i-1) × rate(i-1). Only meaningful for the
   * graduated bracket table (fixBases). */
  function fixBases() {
    let cumulative = 0
    const next = rows.map((row, i) => {
      if (i > 0) {
        const prev = rows[i - 1]
        const prevTop = String(prev.upTo).trim() === '' ? Infinity : Number(prev.upTo)
        const width = Number.isFinite(prevTop) ? prevTop - Number(prev.over || 0) : 0
        cumulative += Math.max(0, width) * (Number(prev.rate || 0) / 100)
      } else {
        cumulative = 0
      }
      return { ...row, base: String(Math.round(cumulative)) }
    })
    commit(next)
  }

  function reset() {
    onReset(entry.key)
    setRows(normalizeRows(RATES[entry.key], entry.columns))
  }

  return (
    <div className="settings-table-block">
      <div className="settings-field-head">
        <label>{entry.label}</label>
        {modified && (
          <button type="button" className="settings-revert" onClick={reset} title="Restore the compiled default">
            customized — revert
          </button>
        )}
      </div>
      <p className="settings-desc">{entry.description}</p>

      <table className="settings-table">
        <thead>
          <tr>
            {entry.columns.map((col) => (
              <th key={col.id}>{col.label}</th>
            ))}
            <th aria-label="actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {entry.columns.map((col) => (
                <td key={col.id}>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder={col.unit === 'currency-or-inf' ? '∞' : ''}
                    value={row[col.id]}
                    onChange={(e) => updateCell(rowIndex, col.id, e.target.value)}
                    onBlur={() => commitCell(rowIndex, col.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                    }}
                    aria-label={`${entry.label}, row ${rowIndex + 1}, ${col.label}`}
                  />
                </td>
              ))}
              <td>
                <button
                  type="button"
                  className="settings-table-remove"
                  onClick={() => removeRow(rowIndex)}
                  disabled={rows.length <= 1}
                  aria-label={`Remove row ${rowIndex + 1}`}
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="settings-actions">
        <button type="button" className="settings-secondary-btn" onClick={addRow}>
          + Add bracket
        </button>
        {entry.fixBases && (
          <button type="button" className="settings-secondary-btn" onClick={fixBases}>
            Fix cumulative bases
          </button>
        )}
      </div>
    </div>
  )
}

function normalizeRows(committedRows, columns) {
  return committedRows.map((row) => {
    const local = {}
    for (const col of columns) {
      const v = row[col.id]
      if (v === Infinity) local[col.id] = ''
      else if (v === null || v === undefined) local[col.id] = ''
      else if (col.unit === 'percent') local[col.id] = String(Number((v * 100).toFixed(4)))
      else if (Number.isFinite(v)) local[col.id] = String(Math.round(v * 10000) / 10000)
      else local[col.id] = ''
    }
    return local
  })
}
