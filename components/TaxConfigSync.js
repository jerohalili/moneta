'use client'

import { useEffect } from 'react'
import { applyStoredOverrides } from '@/lib/taxConfig'

/**
 * Applies any stored rate overrides exactly once, after mount. Rendered
 * once from app/layout.js so every page in the app picks up customized
 * rates without knowing about it.
 *
 * Must never run during render: server rendering and the client's first
 * paint both use compiled defaults, and overrides are layered in after
 * hydration — same SSR-safety rule as ThemeToggle and useIncomeProfile.
 */
export default function TaxConfigSync() {
  useEffect(() => {
    applyStoredOverrides()
    // A cloud pull can replace the stored overrides wholesale (e.g. first
    // sign-in on a new device). Re-apply so live rates match what's on disk.
    function onImported() {
      applyStoredOverrides()
    }
    window.addEventListener('moneta:data-imported', onImported)
    return () => window.removeEventListener('moneta:data-imported', onImported)
  }, [])
  return null
}
