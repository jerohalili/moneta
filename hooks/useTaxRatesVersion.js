'use client'

import { useEffect, useState } from 'react'
import { subscribeToRates } from '@/lib/taxConfig'

/**
 * Subscribes to live tax-rate changes (made on /settings) and returns a
 * version counter that increments each time rates change. Include it in
 * useMemo dependency arrays so memoized computations recompute when the
 * user edits rates — inputs alone aren't enough to detect a rate change.
 */
export default function useTaxRatesVersion() {
  const [version, setVersion] = useState(0)
  useEffect(() => subscribeToRates(() => setVersion((v) => v + 1)), [])
  return version
}
