'use client'

import { useEffect, useRef } from 'react'
import { authClient } from '@/lib/auth-client'
import {
  SYNC_EVENTS,
  fetchRemoteData,
  mergeRemoteIntoLocal,
  pushProfile,
  pushRateOverrides,
  pushHistoryEntry,
  deleteRemoteHistoryEntry,
  clearRemoteHistory,
} from '@/lib/cloudSync'
import { getHistory } from '@/lib/history'
import { loadJSON } from '@/lib/localStore'

/**
 * Mounted once in app/layout.js. Renders nothing; owns the sync loop:
 *
 * 1. Sign-in (including one-tap guest) → pull server data and merge.
 *    Local edits that were never pushed win over the remote copy; a
 *    clean local state adopts the remote one; history always unions.
 * 2. Any local change → debounced push for profile/rates, immediate
 *    targeted writes for history (add/delete/clear carry their payload
 *    or id in the event detail).
 *
 * Dirty flags make the merge policy deterministic: set when the user
 * changes something, cleared only after a successful push.
 */
export default function CloudSyncManager() {
  const { data: session, isPending: pending } = authClient.useSession()
  const userId = session?.user?.id ?? null

  const dirty = useRef({ profile: false, rates: false })
  const timers = useRef({ profile: null, rates: null })
  const pulledFor = useRef(null)

  // ---- Reset bookkeeping whenever the signed-in user changes ----------
  useEffect(() => {
    dirty.current = { profile: false, rates: false }
    timers.current = { profile: null, rates: null }
    pulledFor.current = null
  }, [userId])

  // ---- Pull on sign-in -------------------------------------------------
  useEffect(() => {
    if (pending || !userId || pulledFor.current === userId) return
    pulledFor.current = userId

    let cancelled = false
    fetchRemoteData()
      .then((remote) => {
        if (cancelled) return
        mergeRemoteIntoLocal(remote, {
          adoptProfile: !dirty.current.profile,
          adoptRates: !dirty.current.rates,
        })
        // Refresh any listening UI even if nothing was adopted.
        window.dispatchEvent(new Event(SYNC_EVENTS.historyChanged))
        window.dispatchEvent(new Event(SYNC_EVENTS.dataImported))
      })
      .catch(() => {
        // Offline or server hiccup: local-only mode keeps working; the
        // next sign-in retries. Silent by design.
      })
    return () => {
      cancelled = true
    }
  }, [userId, pending])

  // ---- Push on local change -------------------------------------------
  useEffect(() => {
    if (!userId) return

    function schedule(resource, collect, pushFn) {
      dirty.current[resource] = true
      clearTimeout(timers.current[resource])
      timers.current[resource] = setTimeout(async () => {
        try {
          await pushFn(collect())
          dirty.current[resource] = false
        } catch {
          // Stay dirty; the next change retries.
        }
      }, 1000)
    }

    function onProfileChanged() {
      schedule('profile', () => loadJSON('income-profile', {}), pushProfile)
    }

    function onRatesChanged() {
      schedule('rates', () => loadJSON('rate-overrides', {}), pushRateOverrides)
    }

    function onHistoryChanged(event) {
      const detail = event.detail ?? {}
      try {
        if (detail.deletedId) {
          void deleteRemoteHistoryEntry(detail.deletedId).catch(() => {})
        } else if (detail.cleared) {
          void clearRemoteHistory().catch(() => {})
        } else if (detail.addedId) {
          const entry = getHistory().find((e) => e.id === detail.addedId)
          if (entry) void pushHistoryEntry(entry).catch(() => {})
        }
      } catch {
        // Never let sync break the UI action that caused it.
      }
    }

    window.addEventListener(SYNC_EVENTS.profileChanged, onProfileChanged)
    window.addEventListener(SYNC_EVENTS.ratesChanged, onRatesChanged)
    window.addEventListener(SYNC_EVENTS.historyChanged, onHistoryChanged)
    return () => {
      window.removeEventListener(SYNC_EVENTS.profileChanged, onProfileChanged)
      window.removeEventListener(SYNC_EVENTS.ratesChanged, onRatesChanged)
      window.removeEventListener(SYNC_EVENTS.historyChanged, onHistoryChanged)
      clearTimeout(timers.current.profile)
      clearTimeout(timers.current.rates)
    }
  }, [userId])

  return null
}
