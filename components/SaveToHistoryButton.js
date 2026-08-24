'use client'

import { useState } from 'react'
import { saveHistoryEntry } from '@/lib/history'

/**
 * Live recalculation stays automatic (no "Calculate" button) — this button
 * is a separate, deliberate action: "keep a dated record of this specific
 * result." It lives at the bottom of the INPUT card (right where the
 * numbers are typed), renders as a full-width green call-to-action, and is
 * disabled until there's something worth saving.
 */
export default function SaveToHistoryButton({ calculatorName, summary, details, disabled = false }) {
  const [justSaved, setJustSaved] = useState(false)

  function handleSave() {
    saveHistoryEntry({ calculatorName, summary, details })
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  return (
    <button
      type="button"
      className={justSaved ? 'save-btn is-saved' : 'save-btn'}
      onClick={handleSave}
      disabled={disabled}
    >
      {justSaved ? 'Saved ✓ — in History' : 'Save to History'}
    </button>
  )
}
