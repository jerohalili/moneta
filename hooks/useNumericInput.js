'use client'

import { useState } from 'react'

// BIR forms take raw strings; clamp to >= 0 only when computing.
export function useBirNumericInput(initial = '') {
  const [raw, setRaw] = useState(initial)
  const value = Math.max(0, Number(raw) || 0)
  return [raw, setRaw, value]
}
