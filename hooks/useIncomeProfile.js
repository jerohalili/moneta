'use client'

import { useMemo, useState } from 'react'
import { compareRoutes } from '@/lib/freelancerTax'
import { computeEmployeeTax } from '@/lib/employeeTax'
import { getFreelancerTips } from '@/lib/advisor'
import { EXPENSE_CATEGORIES } from '@/lib/expenseCategories'

export const PROFILE_TYPES = [
  { id: 'employee', label: 'Employee', description: 'Compensation income, one employer.' },
  { id: 'freelancer', label: 'Freelancer', description: 'Self-employed / professional income.' },
  { id: 'business', label: 'Business Owner', description: 'Sole proprietorship gross sales.' },
  { id: 'mixed', label: 'Mixed (Employed + Freelancing)', description: 'Both compensation and business income.' },
]

/**
 * Drives the Dashboard's Income Profile: pick what kind of taxpayer you
 * are, enter the numbers that apply to that profile, and every stat below
 * recomputes live. No "Calculate" button.
 *
 * Business Owner is computed with the exact same function as Freelancer —
 * BIR taxes a sole proprietor's business income and a freelancer's
 * professional income identically under NIRC Sec. 24(A)/24(A)(2)(b); the
 * label is different, the math isn't.
 *
 * Mixed applies the RR 8-2018 rule that a mixed-income earner's 8% election
 * does NOT get the ₱250,000 exemption on the business side (see
 * lib/freelancerTax.js) since that exemption is already used up by their
 * compensation income.
 */
export function useIncomeProfile() {
  const [profileType, setProfileType] = useState(null)

  const [grossCompensationInput, setGrossCompensationInput] = useState('')
  const [contributionsInput, setContributionsInput] = useState('')
  const [grossReceiptsInput, setGrossReceiptsInput] = useState('')
  const [ledger, setLedger] = useState([])
  const [draft, setDraft] = useState({
    label: '',
    category: EXPENSE_CATEGORIES[0].id,
    amount: '',
    fileName: '',
  })

  const needsEmployeeFields = profileType === 'employee' || profileType === 'mixed'
  const needsBusinessFields = profileType === 'freelancer' || profileType === 'business' || profileType === 'mixed'
  const isMixed = profileType === 'mixed'

  const grossCompensation = Math.max(0, Number(grossCompensationInput) || 0)
  const mandatoryContributions = Math.max(0, Number(contributionsInput) || 0)
  const grossReceipts = Math.max(0, Number(grossReceiptsInput) || 0)

  const itemizedExpenses = useMemo(
    () => ledger.reduce((sum, entry) => sum + entry.amount, 0),
    [ledger]
  )

  const hasEmployeeIncome = needsEmployeeFields && grossCompensation > 0
  const hasBusinessIncome = needsBusinessFields && grossReceipts > 0
  const hasAnyIncome = hasEmployeeIncome || hasBusinessIncome

  const employeeResult = useMemo(
    () => (hasEmployeeIncome ? computeEmployeeTax({ grossCompensation, mandatoryContributions }) : null),
    [hasEmployeeIncome, grossCompensation, mandatoryContributions]
  )

  const businessComparison = useMemo(
    () =>
      hasBusinessIncome
        ? compareRoutes({ grossReceipts, itemizedExpenses, isMixedIncomeEarner: isMixed })
        : null,
    [hasBusinessIncome, grossReceipts, itemizedExpenses, isMixed]
  )

  const tips = useMemo(
    () => (businessComparison ? getFreelancerTips({ grossReceipts, itemizedExpenses, comparison: businessComparison }) : []),
    [businessComparison, grossReceipts, itemizedExpenses]
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
    if (needsEmployeeFields && contributionsInput !== '' && mandatoryContributions > grossCompensation) {
      list.push('Your contributions exceed your gross compensation — double-check the numbers.')
    }
    if (needsBusinessFields && hasBusinessIncome && itemizedExpenses > grossReceipts) {
      list.push('Your logged expenses add up to more than your gross receipts/sales — double-check the ledger below.')
    }
    return list
  }, [needsEmployeeFields, needsBusinessFields, contributionsInput, mandatoryContributions, grossCompensation, hasBusinessIncome, itemizedExpenses, grossReceipts])

  // Deliberately defined the same way across all four profile types, so
  // the four headline stat tiles mean the same thing no matter which
  // profile is selected.
  const grossIncome = grossCompensation + grossReceipts
  const totalDeductions = mandatoryContributions + itemizedExpenses
  const estimatedTax = (employeeResult?.total ?? 0) + (businessComparison?.best.total ?? 0)
  const netIncomePreTax = hasAnyIncome ? grossIncome - totalDeductions : null
  const effectiveRate = hasAnyIncome && grossIncome > 0 ? estimatedTax / grossIncome : null
  const takeHome = hasAnyIncome ? grossIncome - totalDeductions - estimatedTax : null

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
      },
    ])
    setDraft({ label: '', category: draft.category, amount: '', fileName: '' })
  }

  function removeEntry(id) {
    setLedger((prev) => prev.filter((e) => e.id !== id))
  }

  return {
    profileType,
    setProfileType,
    grossCompensationInput,
    setGrossCompensationInput,
    contributionsInput,
    setContributionsInput,
    grossReceiptsInput,
    setGrossReceiptsInput,
    ledger,
    draft,
    setDraft,
    addEntry,
    removeEntry,
    needsEmployeeFields,
    needsBusinessFields,
    isMixed,
    hasAnyIncome,
    hasBusinessIncome,
    businessComparison,
    tips,
    categoryTotals,
    errors,
    netIncomePreTax,
    estimatedTax,
    effectiveRate,
    takeHome,
  }
}
