'use client'

import { useState } from 'react'
import { saveHistoryEntry } from '@/lib/history'

/**
 * Live recalculation stays automatic (no "Calculate" button) — this button
 * is a separate, deliberate action: "keep a dated record of this specific
 * result." Without an explicit save action, there's no discrete moment to
 * log, since the numbers are continuously changing as someone types.
 */
export default function SaveToHistoryButton({ calculatorName, summary, details, disabled = false }) {
  const [justSaved, setJustSaved] = useState(false)

  function handleSave() {
    saveHistoryEntry({ calculatorName, summary, details })
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <button type="button" className="btn-primary" onClick={handleSave} disabled={disabled}>
      {justSaved ? 'Saved ✓' : 'Save to History'}
    </button>
  )
}
