'use client'

import { EXPENSE_CATEGORIES, categoryLabel } from '@/lib/expenseCategories'
import { formatPHP } from '@/lib/format'

/**
 * A lightweight write-off tracker: log an expense with a label, category,
 * and amount, optionally attach a receipt file. There's no server yet, so
 * "attaching" a file just remembers its filename for this browser tab —
 * it is not uploaded or stored anywhere. That's an honest v1, not a shortcut
 * pretending to be real cloud storage.
 */
export default function ExpenseLedger({ draft, setDraft, addEntry, ledger, removeEntry, compact = false }) {
  const visibleEntries = compact ? ledger.slice(0, 3) : ledger
  const hiddenCount = ledger.length - visibleEntries.length

  function handleFile(e) {
    const file = e.target.files?.[0]
    setDraft((d) => ({ ...d, fileName: file ? file.name : '' }))
  }

  return (
    <div>
      <div className="ledger-form">
        <input
          type="text"
          placeholder="What was it? (e.g. Canva subscription)"
          value={draft.label}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          className="ledger-input ledger-input-label"
        />
        <select
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          className="ledger-input ledger-select"
        >
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
        <input
          type="number"
          inputMode="decimal"
          placeholder="₱ amount"
          value={draft.amount}
          onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
          className="ledger-input ledger-input-amount"
        />
        <label className="ledger-file-btn">
          {draft.fileName || 'Attach receipt'}
          <input type="file" accept="image/*,application/pdf" onChange={handleFile} hidden />
        </label>
        <button type="button" className="btn-primary btn-small" onClick={addEntry}>
          Log it
        </button>
      </div>

      {ledger.length === 0 ? (
        <p className="empty-copy">No expenses logged yet. Add one above &mdash; it&apos;ll feed your tax estimate and category breakdown automatically.</p>
      ) : (
        <ul className="ledger-list">
          {visibleEntries.map((entry) => (
            <li key={entry.id} className="ledger-row">
              <span className="ledger-row-main">
                <span className="ledger-row-label">{entry.label}</span>
                <span className="ledger-row-category">{categoryLabel(entry.category)}</span>
                {entry.fileName && <span className="ledger-row-file">📎 {entry.fileName}</span>}
              </span>
              <span className="ledger-row-amount">{formatPHP(entry.amount)}</span>
              <button
                type="button"
                className="ledger-row-remove"
                onClick={() => removeEntry(entry.id)}
                aria-label={`Remove ${entry.label}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {hiddenCount > 0 && (
        <p className="ledger-more">+{hiddenCount} more logged — open the full calculator to see all of them.</p>
      )}
    </div>
  )
}
