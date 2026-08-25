'use client'

import { useMemo, useState } from 'react'
import { compareRoutes } from '@/lib/freelancerTax'
import { getFreelancerTips } from '@/lib/advisor'
import { EXPENSE_CATEGORIES } from '@/lib/expenseCategories'
import useTaxRatesVersion from './useTaxRatesVersion'

/**
 * Drives the "automatic" version of the freelancer tax picture: every
 * number here recomputes live, on every keystroke, via useMemo — there is
 * no "Calculate" button anywhere in this flow. It's the same hook backing
 * both the compact Dashboard view and the full /calculators/freelancer
 * page, so they never drift out of sync.
 *
 * IMPORTANT LIMITATION: this state lives only in the browser tab. There's
 * no account/database layer yet (see CONTINUE.md), so refreshing the page
 * or navigating away and back resets everything. That's a known, called-out
 * gap — not a bug to quietly work around.
 */
export function useFreelancerTax() {
  const [grossReceiptsInput, setGrossReceiptsInput] = useState('')
  const [ledger, setLedger] = useState([])
  const [draft, setDraft] = useState({
    label: '',
    category: EXPENSE_CATEGORIES[0].id,
    amount: '',
    fileName: '',
  })

  const grossReceipts = Math.max(0, Number(grossReceiptsInput) || 0)
  const hasIncome = grossReceipts > 0

  // Recompute everything when rates change on /settings.
  const ratesVersion = useTaxRatesVersion()

  const itemizedExpenses = useMemo(
    () => ledger.reduce((sum, entry) => sum + entry.amount, 0),
    [ledger]
  )

  const comparison = useMemo(
    () => {
      void ratesVersion // cache-bust when rates are edited on /settings
      return hasIncome ? compareRoutes({ grossReceipts, itemizedExpenses }) : null
    },
    [grossReceipts, itemizedExpenses, hasIncome, ratesVersion]
  )

  const tips = useMemo(
    () => {
      void ratesVersion // cache-bust when rates are edited on /settings
      return comparison ? getFreelancerTips({ grossReceipts, itemizedExpenses, comparison }) : []
    },
    [comparison, grossReceipts, itemizedExpenses, ratesVersion]
  )

  const categoryTotals = useMemo(() => {
    const totals = {}
    for (const entry of ledger) totals[entry.category] = (totals[entry.category] ?? 0) + entry.amount
    return EXPENSE_CATEGORIES.map((c) => ({ ...c, total: totals[c.id] ?? 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [ledger])

  const errors = useMemo(() => {
    const list = []
    if (grossReceiptsInput !== '' && Number(grossReceiptsInput) < 0) {
      list.push('Gross receipts can\u2019t be negative — check the number you entered.')
    }
    if (hasIncome && itemizedExpenses > grossReceipts) {
      list.push('Your logged expenses add up to more than your gross receipts — double-check the ledger above.')
    }
    return list
  }, [grossReceiptsInput, grossReceipts, itemizedExpenses, hasIncome])

  const best = comparison?.best ?? null
  const netIncomePreTax = hasIncome ? grossReceipts - itemizedExpenses : null
  const estimatedTax = best ? best.total : null
  const effectiveRate = best && grossReceipts > 0 ? best.total / grossReceipts : null
  const takeHome = best ? grossReceipts - itemizedExpenses - best.total : null
  const quarterlyReserve = best ? best.total / 4 : null

  function addEntry() {
    const amount = Number(draft.amount)
    if (!draft.label.trim() || !amount || amount <= 0) return
    setLedger((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: draft.label.trim(),
        category: draft.category,
        amount,
        fileName: draft.fileName || null,
        loggedAt: new Date(),
      },
    ])
    setDraft({ label: '', category: draft.category, amount: '', fileName: '' })
  }

  function removeEntry(id) {
    setLedger((prev) => prev.filter((e) => e.id !== id))
  }

  return {
    grossReceiptsInput,
    setGrossReceiptsInput,
    ledger,
    draft,
    setDraft,
    addEntry,
    removeEntry,
    grossReceipts,
    itemizedExpenses,
    hasIncome,
    comparison,
    tips,
    categoryTotals,
    errors,
    netIncomePreTax,
    estimatedTax,
    effectiveRate,
    takeHome,
    quarterlyReserve,
  }
}
