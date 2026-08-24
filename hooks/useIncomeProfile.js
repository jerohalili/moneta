'use client'

import { useEffect, useMemo, useState } from 'react'
import { compareRoutes } from '@/lib/freelancerTax'
import { computeEmployeeTax } from '@/lib/employeeTax'
import { computeMonthlyContributions } from '@/lib/contributions'
import { computeNetPay } from '@/lib/netPay'
import { computeThirteenthMonthPay } from '@/lib/thirteenthMonthPay'
import { buildAdvicePlan } from '@/lib/advisor'
import { EXPENSE_CATEGORIES } from '@/lib/expenseCategories'
import { formatPHP } from '@/lib/format'
import { loadJSON, saveJSON } from '@/lib/localStore'
import { RATES } from '@/lib/taxConfig'
import useTaxRatesVersion from './useTaxRatesVersion'

export const PROFILE_TYPES = [
  { id: 'employee', label: 'Employee', description: 'Compensation income, one employer.' },
  { id: 'freelancer', label: 'Freelancer', description: 'Self-employed / professional income.' },
  { id: 'business', label: 'Business Owner', description: 'Sole proprietorship gross sales.' },
  { id: 'mixed', label: 'Mixed (Employed + Freelancing)', description: 'Both compensation and business income.' },
]

const STORAGE_KEY = 'income-profile'

/**
 * Drives the Dashboard's Income Profile.
 *
 * PERSISTENCE: this whole profile — type, income figures, the write-off
 * ledger, contribution overrides — is saved to localStorage and reloaded
 * on every visit. There's no account system yet (see CONTINUE.md), so
 * this is per-browser, not synced across devices, but it means the
 * profile survives a refresh instead of resetting every time, which it
 * did not do before this was added.
 *
 * AUTO-ORCHESTRATION: for Employee/Mixed profiles, this doesn't just
 * compute a tax number — it also runs the Net Pay and 13th Month Pay
 * calculators automatically against the same stored compensation figure,
 * so the Dashboard surfaces those results directly instead of only
 * linking out to separate pages.
 *
 * Business Owner is computed with the exact same function as Freelancer —
 * BIR taxes a sole proprietor's business income and a freelancer's
 * professional income identically under NIRC Sec. 24(A)/24(A)(2)(b); the
 * label is different, the math isn't.
 *
 * Mixed applies the RR 8-2018 rule that a mixed-income earner's 8%
 * election does NOT get the ₱250,000 exemption on the business side (see
 * lib/freelancerTax.js) since that exemption is already used up by their
 * compensation income.
 */
export function useIncomeProfile() {
  const [profileType, setProfileType] = useState(null)
  const [grossCompensationInput, setGrossCompensationInput] = useState('')
  const [contributionsOverride, setContributionsOverride] = useState('')
  const [useContributionsOverride, setUseContributionsOverride] = useState(false)
  const [grossReceiptsInput, setGrossReceiptsInput] = useState('')
  const [totalAssetsInput, setTotalAssetsInput] = useState('')
  const [vatRegistered, setVatRegistered] = useState(false)
  const [ledger, setLedger] = useState([])
  const [draft, setDraft] = useState({
    label: '',
    category: EXPENSE_CATEGORIES[0].id,
    amount: '',
    fileName: '',
  })
  const [hydrated, setHydrated] = useState(false)

  // Load any previously-saved profile once, right after mount (localStorage
  // doesn't exist during server rendering, so this can't run during the
  // initial render without a client/server mismatch).
  useEffect(() => {
    const saved = loadJSON(STORAGE_KEY, null)
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read of localStorage, not a render-derivable value */
    if (saved) {
      setProfileType(saved.profileType ?? null)
      setGrossCompensationInput(saved.grossCompensationInput ?? '')
      setContributionsOverride(saved.contributionsOverride ?? '')
      setUseContributionsOverride(saved.useContributionsOverride ?? false)
      setGrossReceiptsInput(saved.grossReceiptsInput ?? '')
      setTotalAssetsInput(saved.totalAssetsInput ?? '')
      setVatRegistered(saved.vatRegistered ?? false)
      setLedger(saved.ledger ?? [])
    }
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  // Persist on every change, but only after the initial load above has
  // run — otherwise this would fire first with blank default state and
  // immediately overwrite whatever was actually saved. Also announces
  // the change so CloudSyncManager can push it for signed-in users.
  useEffect(() => {
    if (!hydrated) return
    saveJSON(STORAGE_KEY, {
      profileType,
      grossCompensationInput,
      contributionsOverride,
      useContributionsOverride,
      grossReceiptsInput,
      totalAssetsInput,
      vatRegistered,
      ledger,
    })
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('moneta:profile-changed'))
  }, [hydrated, profileType, grossCompensationInput, contributionsOverride, useContributionsOverride, grossReceiptsInput, totalAssetsInput, vatRegistered, ledger])

  // Cloud sync may replace the stored profile after sign-in (or when a
  // guest upgrades to a real account). Re-read localStorage into state so
  // the UI reflects what was just pulled — same field-by-field pattern as
  // the hydration effect above.
  useEffect(() => {
    // Event-driven re-read of localStorage after a cloud pull — the rule
    // correctly treats listener callbacks as user-originated, not render.
    function rehydrate() {
      const saved = loadJSON(STORAGE_KEY, null)
      setProfileType(saved?.profileType ?? null)
      setGrossCompensationInput(saved?.grossCompensationInput ?? '')
      setContributionsOverride(saved?.contributionsOverride ?? '')
      setUseContributionsOverride(saved?.useContributionsOverride ?? false)
      setGrossReceiptsInput(saved?.grossReceiptsInput ?? '')
      setTotalAssetsInput(saved?.totalAssetsInput ?? '')
      setVatRegistered(saved?.vatRegistered ?? false)
      setLedger(saved?.ledger ?? [])
    }
    window.addEventListener('moneta:data-imported', rehydrate)
    return () => window.removeEventListener('moneta:data-imported', rehydrate)
  }, [])

  const needsEmployeeFields = profileType === 'employee' || profileType === 'mixed'
  const needsBusinessFields = profileType === 'freelancer' || profileType === 'business' || profileType === 'mixed'
  const isMixed = profileType === 'mixed'

  // Bumps whenever rates are edited on /settings — included in every
  // memo dependency below so the whole snapshot recomputes live.
  const ratesVersion = useTaxRatesVersion()

  // null (not 0) when the field is blank: "unknown" must not read as
  // "definitely has no assets" for BMBE eligibility.
  const totalAssets = totalAssetsInput.trim() === ''
    ? null
    : Math.max(0, Number(totalAssetsInput) || 0)

  const grossCompensation = Math.max(0, Number(grossCompensationInput) || 0)
  const grossReceipts = Math.max(0, Number(grossReceiptsInput) || 0)

  const autoContributions = useMemo(
    () => {
      void ratesVersion // cache-bust when rates are edited on /settings
      return needsEmployeeFields && grossCompensation > 0
        ? computeMonthlyContributions({ monthlyCompensation: grossCompensation / 12 })
        : null
    },
    [needsEmployeeFields, grossCompensation, ratesVersion]
  )
  const autoAnnualContributions = autoContributions ? autoContributions.totalEmployee * 12 : 0
  const mandatoryContributions =
    useContributionsOverride && contributionsOverride !== ''
      ? Math.max(0, Number(contributionsOverride) || 0)
      : autoAnnualContributions

  const itemizedExpenses = useMemo(
    () => ledger.reduce((sum, entry) => sum + entry.amount, 0),
    [ledger]
  )

  const hasEmployeeIncome = needsEmployeeFields && grossCompensation > 0
  const hasBusinessIncome = needsBusinessFields && grossReceipts > 0
  const hasAnyIncome = hasEmployeeIncome || hasBusinessIncome

  const employeeResult = useMemo(
    () => {
      void ratesVersion
      return hasEmployeeIncome ? computeEmployeeTax({ grossCompensation, mandatoryContributions }) : null
    },
    [hasEmployeeIncome, grossCompensation, mandatoryContributions, ratesVersion]
  )

  // Auto-orchestration: Net Pay and 13th Month Pay run automatically off
  // the same compensation figure, rather than requiring a separate visit
  // to each calculator page.
  const netPayResult = useMemo(
    () => {
      void ratesVersion
      return hasEmployeeIncome ? computeNetPay({ monthlyGrossCompensation: grossCompensation / 12 }) : null
    },
    [hasEmployeeIncome, grossCompensation, ratesVersion]
  )
  const thirteenthMonthResult = useMemo(
    () => {
      void ratesVersion
      return hasEmployeeIncome ? computeThirteenthMonthPay({ totalBasicSalary: grossCompensation }) : null
    },
    [hasEmployeeIncome, grossCompensation, ratesVersion]
  )

  const businessComparison = useMemo(
    () => {
      void ratesVersion
      return hasBusinessIncome
        ? compareRoutes({ grossReceipts, itemizedExpenses, isMixedIncomeEarner: isMixed })
        : null
    },
    [hasBusinessIncome, grossReceipts, itemizedExpenses, isMixed, ratesVersion]
  )

  // The advisor engine: ranked peso-valued actions + line-by-line
  // explanations of how every tax was computed. This replaces the old
  // static "Recommendations" tips list.
  const advicePlan = useMemo(
    () => {
      void ratesVersion
      return hasAnyIncome
        ? buildAdvicePlan({
            profileType,
            grossCompensation,
            grossReceipts,
            itemizedExpenses,
            mandatoryContributions,
            totalAssets,
            vatRegistered,
            hasEmployeeIncome,
            hasBusinessIncome,
            isMixed,
            employeeResult,
            comparison: businessComparison,
            thirteenthMonthResult,
          })
        : null
    },
    [
      hasAnyIncome, profileType, grossCompensation, grossReceipts, itemizedExpenses,
      mandatoryContributions, totalAssets, vatRegistered, hasEmployeeIncome,
      hasBusinessIncome, isMixed, employeeResult, businessComparison, thirteenthMonthResult,
      ratesVersion,
    ]
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
    if (useContributionsOverride && contributionsOverride !== '' && Number(contributionsOverride) > grossCompensation) {
      list.push('Your contributions exceed your gross compensation — double-check the numbers.')
    }
    // The auto-computed path can hit the same problem for a different
    // reason: SSS and PhilHealth both have fixed minimum contribution
    // floors (currently ~₱6,000/year combined) that apply even to a very
    // small declared income. Below a certain point, that floor can
    // exceed the income itself — which almost always means the entered
    // figure isn't a realistic annual salary, not that the math is wrong.
    if (!useContributionsOverride && hasEmployeeIncome && autoAnnualContributions > grossCompensation) {
      list.push(
        `Computed contributions (${formatPHP(autoAnnualContributions)}) exceed your entered gross compensation ` +
        `(${formatPHP(grossCompensation)}). SSS and PhilHealth apply fixed minimum contribution floors regardless ` +
        `of how low the salary is, so this almost always means the compensation figure is unrealistically low for ` +
        `a real annual salary — double-check it, or use the manual override if your situation is genuinely unusual.`
      )
    }
    if (needsBusinessFields && hasBusinessIncome && itemizedExpenses > grossReceipts) {
      list.push('Your logged expenses add up to more than your gross receipts/sales — double-check the ledger below.')
    }
    return list
  }, [useContributionsOverride, contributionsOverride, grossCompensation, hasEmployeeIncome, autoAnnualContributions, needsBusinessFields, hasBusinessIncome, itemizedExpenses, grossReceipts])

  // Deliberately defined the same way across all four profile types, so
  // the four headline stat tiles mean the same thing no matter which
  // profile is selected.
  const grossIncome = grossCompensation + grossReceipts
  const totalDeductions = mandatoryContributions + itemizedExpenses
  const estimatedTax = (employeeResult?.total ?? 0) + (businessComparison?.best.total ?? 0)
  const netIncomePreTax = hasAnyIncome ? grossIncome - totalDeductions : null
  const effectiveRate = hasAnyIncome && grossIncome > 0 ? estimatedTax / grossIncome : null
  const takeHome = hasAnyIncome ? grossIncome - totalDeductions - estimatedTax : null

  // Smart suggestion: gross receipts above the VAT threshold force VAT
  // registration regardless of what the business/8% comparison above
  // says — compareRoutes() already excludes the 8% option once this
  // happens, but the person still needs to be told explicitly that
  // registration itself is now mandatory, not just "the 8% option is
  // gone." grossReceipts here is the entered figure, not a run-rate
  // projection — this only fires once the actual number crosses the line.
  const exceedsVatThreshold = hasBusinessIncome && grossReceipts > RATES.VAT_THRESHOLD

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
    contributionsOverride,
    setContributionsOverride,
    useContributionsOverride,
    setUseContributionsOverride,
    autoContributions,
    autoAnnualContributions,
    mandatoryContributions,
    grossReceiptsInput,
    setGrossReceiptsInput,
    totalAssetsInput,
    setTotalAssetsInput,
    vatRegistered,
    setVatRegistered,
    totalAssets,
    ledger,
    draft,
    setDraft,
    addEntry,
    removeEntry,
    needsEmployeeFields,
    needsBusinessFields,
    isMixed,
    hasAnyIncome,
    hasEmployeeIncome,
    hasBusinessIncome,
    employeeResult,
    netPayResult,
    thirteenthMonthResult,
    businessComparison,
    advicePlan,
    categoryTotals,
    errors,
    grossIncome,
    netIncomePreTax,
    estimatedTax,
    effectiveRate,
    takeHome,
    exceedsVatThreshold,
  }
}
