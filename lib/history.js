import { loadJSON, saveJSON } from './localStore'

const KEY = 'history'
const MAX_ENTRIES = 200 // keep the log from growing unbounded in localStorage

/**
 * A saved calculation snapshot: which calculator produced it, when, a
 * short human-readable summary, and the underlying figures. This is a
 * discrete, explicit save — nothing here happens automatically just from
 * typing into a calculator, since a running live-recalculation has no
 * natural "this is the version worth keeping" moment. The person decides
 * that by pressing Save.
 */
export function getHistory() {
  return loadJSON(KEY, [])
}

/** Lets CloudSyncManager bulk-replace the log after merging with the
 * server copy, without round-tripping every entry through saveHistoryEntry. */
export function replaceHistory(entries) {
  const capped = entries.slice(0, MAX_ENTRIES)
  saveJSON(KEY, capped)
  return capped
}

function notifyChanged(detail = {}) {
  if (typeof window === 'undefined') return
  // detail carries WHAT changed (addedId/deletedId/cleared) so
  // CloudSyncManager can make a targeted server call instead of diffing.
  window.dispatchEvent(new CustomEvent('moneta:history-changed', { detail }))
}

export function saveHistoryEntry({ calculatorName, summary, details }) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    calculatorName,
    summary,
    details,
    savedAt: new Date().toISOString(),
  }
  const current = getHistory()
  const updated = [entry, ...current].slice(0, MAX_ENTRIES)
  saveJSON(KEY, updated)
  notifyChanged({ addedId: entry.id })
  return entry
}

export function deleteHistoryEntry(id) {
  const updated = getHistory().filter((e) => e.id !== id)
  saveJSON(KEY, updated)
  notifyChanged({ deletedId: id })
  return updated
}

export function clearHistory() {
  saveJSON(KEY, [])
  notifyChanged({ cleared: true })
}
