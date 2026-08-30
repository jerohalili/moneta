import { loadJSON, saveJSON } from './localStore'
import { getHistory, replaceHistory } from './history'

/**
 * Client half of cloud sync. All functions here run in the browser only.
 *
 * MERGE POLICY (deliberate, simple, deterministic):
 * - Profile & rates: dirty-wins. If the user edited something since the
 *   last successful push ("dirty"), local beats remote on sign-in; the
 *   pending local version is pushed up instead of being clobbered.
 *   Otherwise remote wins — it's the same data from another device.
 * - History: union by entry id (ids are client-generated and stable),
 *   newest first, capped to the same 200-entry limit as localStorage.
 * - Guest upgrade: anonymous users get a real user row server-side, so
 *   linking Google/email later preserves every synced row automatically;
 *   nothing special is needed here beyond syncing guests like anyone else.
 */

const PROFILE_KEY = 'income-profile'
const RATES_KEY = 'rate-overrides'

export const SYNC_EVENTS = {
  profileChanged: 'moneta:profile-changed',
  ratesChanged: 'moneta:rates-changed',
  historyChanged: 'moneta:history-changed',
  dataImported: 'moneta:data-imported',
}

export async function fetchRemoteData() {
  const res = await fetch('/api/me/data', { method: 'GET' })
  if (!res.ok) throw new Error(`Sync fetch failed (${res.status})`)
  return res.json()
}

export function pushProfile(data) {
  return fetch('/api/me/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  })
}

export function pushRateOverrides(overrides) {
  return fetch('/api/me/rates', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ overrides }),
  })
}

export function pushHistoryEntry(entry) {
  return fetch('/api/me/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
}

export function deleteRemoteHistoryEntry(id) {
  return fetch(`/api/me/history?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function clearRemoteHistory() {
  return fetch('/api/me/history?all=1', { method: 'DELETE' })
}

/**
 * Applies a /api/me/data payload to localStorage. The caller decides per
 * resource whether remote may ADOPT-over-local (`adoptX` = true when the
 * user has no unsynced local edits and remote actually differs); history
 * is always unioned. Returns which resources were adopted so the manager
 * knows what to re-render. Absent remote rows are always skipped.
 */
export function mergeRemoteIntoLocal(remote, { adoptProfile, adoptRates }) {
  const imported = { profile: false, rates: false }

  const remoteProfile = remote.profile?.data ?? null
  const localProfile = loadJSON(PROFILE_KEY, null)
  const profileEmpty = !(localProfile && (localProfile.profileType || localProfile.grossCompensationInput || localProfile.grossReceiptsInput))
  if (
    remoteProfile &&
    (profileEmpty || (adoptProfile && JSON.stringify(remoteProfile) !== JSON.stringify(localProfile)))
  ) {
    saveJSON(PROFILE_KEY, remoteProfile)
    imported.profile = true
  }

  const remoteOverrides = remote.rates?.overrides ?? null
  const localOverrides = loadJSON(RATES_KEY, {})
  const ratesEmpty = Object.keys(localOverrides).length === 0
  if (
    remoteOverrides &&
    (ratesEmpty || (adoptRates && JSON.stringify(remoteOverrides) !== JSON.stringify(localOverrides)))
  ) {
    saveJSON(RATES_KEY, remoteOverrides)
    imported.rates = true
  }

  // History: union by id, newest first.
  const remoteEntries = Array.isArray(remote.history) ? remote.history : []
  const byId = new Map()
  for (const entry of [...getHistory(), ...remoteEntries]) {
    if (entry?.id && !byId.has(entry.id)) byId.set(entry.id, entry)
  }
  const merged = [...byId.values()].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
  replaceHistory(merged)

  return imported
}
