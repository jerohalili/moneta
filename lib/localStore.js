const PREFIX = 'moneta:'

/**
 * Thin, defensive wrappers around localStorage. There's no account/database
 * layer yet (see CONTINUE.md), so this is the only persistence this app
 * has — it's per-browser, not synced across devices, and wiped if the
 * person clears site data. Every call is wrapped in try/catch because
 * localStorage can throw (private browsing, storage quota, disabled
 * storage) — in all those cases we just silently don't persist, rather
 * than crash the page over a missing feature.
 */
export function loadJSON(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Storage unavailable — this session's data just won't persist.
  }
}

export function removeJSON(key) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to do if removal fails — same fallback as above.
  }
}
