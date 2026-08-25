'use client'

import { useEffect, useMemo, useState } from 'react'
import { compareRoutes } from '@/lib/freelancerTax'
import { computeEmployeeTax } from '@/lib/employeeTax'
import { computeCorporateTax } from '@/lib/corporateTax'
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
  { id: 'employee-multi', label: 'Employee — Multiple Employers', description: 'Two or more employers in the same year.' },
  { id: 'smwe', label: 'Minimum Wage Earner', description: 'Compensation at or near the statutory minimum wage.' },
  { id: 'ofw', label: 'OFW / Non-Resident Citizen', description: 'Working abroad — only PH-source income is taxed here.' },
  { id: 'freelancer', label: 'Freelancer / Professional', description: 'Self-employed or professional practice income.' },
  { id: 'business', label: 'Business Owner', description: 'Sole proprietorship gross sales.' },
  { id: 'mixed', label: 'Mixed (Employed + Freelancing)', description: 'Both compensation and business income.' },
  { id: 'corporation', label: 'Corporation / OPC', description: 'Domestic corporation, incl. One Person Corporations.' },
  { id: 'estate-trust', label: 'Estate or Trust', description: 'Taxed on the individual graduated table (NIRC Sec. 60).' },
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
  const [withheldTaxInput, setWithheldTaxInput] = useState('')
  const [smwAnnualInput, setSmwAnnualInput] = useState('')
  const [foreignIncomeInput, setForeignIncomeInput] = useState('')
  const [corpGrossSalesInput, setCorpGrossSalesInput] = useState('')
  const [corpDeductionsInput, setCorpDeductionsInput] = useState('')
  const [corpAssetsInput, setCorpAssetsInput] = useState('')
  const [corpYearsInput, setCorpYearsInput] = useState('')
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
      setWithheldTaxInput(saved.withheldTaxInput ?? '')
      setSmwAnnualInput(saved.smwAnnualInput ?? '')
      setForeignIncomeInput(saved.foreignIncomeInput ?? '')
      setCorpGrossSalesInput(saved.corpGrossSalesInput ?? '')
      setCorpDeductionsInput(saved.corpDeductionsInput ?? '')
      setCorpAssetsInput(saved.corpAssetsInput ?? '')
      setCorpYearsInput(saved.corpYearsInput ?? '')
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
      withheldTaxInput,
      smwAnnualInput,
      foreignIncomeInput,
      corpGrossSalesInput,
      corpDeductionsInput,
      corpAssetsInput,
      corpYearsInput,
      ledger,
    })
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('moneta:profile-changed'))
  }, [
    hydrated, profileType, grossCompensationInput, contributionsOverride, useContributionsOverride,
    grossReceiptsInput, totalAssetsInput, vatRegistered, withheldTaxInput, smwAnnualInput,
    foreignIncomeInput, corpGrossSalesInput, corpDeductionsInput, corpAssetsInput, corpYearsInput,
    ledger,
  ])

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
      setWithheldTaxInput(saved?.withheldTaxInput ?? '')
      setSmwAnnualInput(saved?.smwAnnualInput ?? '')
      setForeignIncomeInput(saved?.foreignIncomeInput ?? '')
      setCorpGrossSalesInput(saved?.corpGrossSalesInput ?? '')
      setCorpDeductionsInput(saved?.corpDeductionsInput ?? '')
      setCorpAssetsInput(saved?.corpAssetsInput ?? '')
      setCorpYearsInput(saved?.corpYearsInput ?? '')
      setLedger(saved?.ledger ?? [])
    }
    window.addEventListener('moneta:data-imported', rehydrate)
    return () => window.removeEventListener('moneta:data-imported', rehydrate)
  }, [])

  const needsEmployeeFields = ['employee', 'employee-multi', 'mixed', 'smwe', 'ofw'].includes(profileType)
  const needsBusinessFields = ['freelancer', 'business', 'mixed'].includes(profileType)
  const needsCorporateFields = profileType === 'corporation'
  const needsEstateTrustFields = profileType === 'estate-trust'
  const isMixed = profileType === 'mixed'
  const isMultiEmployer = profileType === 'employee-multi'
  const isSmwe = profileType === 'smwe'
  const isOfw = profileType === 'ofw'
  // Net Pay / 13th Month auto-orchestration only makes sense when the
  // compensation figure belongs to ONE employer — a multi-employer
  // employee's monthly net depends on how the split, so showing a single
  // "monthly take-home" off the combined figure would mislead.
  const needsPayrollTiles = ['employee', 'smwe', 'ofw'].includes(profileType)

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

  const withheldTax =
    isMultiEmployer && withheldTaxInput.trim() !== ''
      ? Math.max(0, Number(withheldTaxInput) || 0)
      : null
  const smwAnnual = isSmwe ? Math.max(0, Number(smwAnnualInput) || 0) : 0
  const foreignIncome =
    isOfw && foreignIncomeInput.trim() !== '' ? Math.max(0, Number(foreignIncomeInput) || 0) : 0
  const corpGrossSales = Math.max(0, Number(corpGrossSalesInput) || 0)
  const corpDeductions = Math.max(0, Number(corpDeductionsInput) || 0)
  const corpAssets = corpAssetsInput.trim() === '' ? null : Math.max(0, Number(corpAssetsInput) || 0)
  const corpYears = Math.max(0, Math.floor(Number(corpYearsInput) || 0))

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
  const hasEstateTrustIncome = needsEstateTrustFields && grossCompensation > 0
  const hasCorporateIncome = needsCorporateFields && corpGrossSales > 0
  const hasAnyIncome =
    hasEmployeeIncome || hasBusinessIncome || hasEstateTrustIncome || hasCorporateIncome

  const employeeResult = useMemo(
    () => {
      void ratesVersion
      if (!hasEmployeeIncome) return null
      if (isSmwe) {
        // Statutory minimum wage earners (RA 9504): the minimum-wage
        // portion of compensation is exempt, so only the excess above the
        // SMW (minus contributions) runs through the bracket table.
        return computeEmployeeTax({
          grossCompensation: Math.max(0, grossCompensation - smwAnnual),
          mandatoryContributions,
        })
      }
      return computeEmployeeTax({
        grossCompensation,
        mandatoryContributions,
        withheldTax: isMultiEmployer ? withheldTax : null,
      })
    },
    [hasEmployeeIncome, isSmwe, isMultiEmployer, grossCompensation, smwAnnual, mandatoryContributions, withheldTax, ratesVersion]
  )

  const estateTrustResult = useMemo(
    () => {
      void ratesVersion
      // Estates and trusts compute like individuals on the graduated
      // table (NIRC Sec. 60) — but pay no SSS/PhilHealth/Pag-IBIG.
      return hasEstateTrustIncome
        ? computeEmployeeTax({ grossCompensation, mandatoryContributions: 0 })
        : null
    },
    [hasEstateTrustIncome, grossCompensation, ratesVersion]
  )

  const corporateResult = useMemo(
    () => {
      void ratesVersion
      if (!hasCorporateIncome) return null
      return computeCorporateTax({
        grossIncome: corpGrossSales,
        netTaxableIncome: Math.max(0, corpGrossSales - corpDeductions),
        totalAssets: corpAssets ?? 0,
        yearsInOperation: corpYears,
      })
    },
    [hasCorporateIncome, corpGrossSales, corpDeductions, corpAssets, corpYears, ratesVersion]
  )

  // Auto-orchestration: Net Pay and 13th Month Pay run automatically off
  // the same compensation figure, rather than requiring a separate visit
  // to each calculator page. Only for single-employer compensation
  // profiles (see needsPayrollTiles above).
  const netPayResult = useMemo(
    () => {
      void ratesVersion
      return needsPayrollTiles && grossCompensation > 0 ? computeNetPay({ monthlyGrossCompensation: grossCompensation / 12 }) : null
    },
    [needsPayrollTiles, grossCompensation, ratesVersion]
  )
  const thirteenthMonthResult = useMemo(
    () => {
      void ratesVersion
      return needsPayrollTiles && grossCompensation > 0 ? computeThirteenthMonthPay({ totalBasicSalary: grossCompensation }) : null
    },
    [needsPayrollTiles, grossCompensation, ratesVersion]
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
            isMultiEmployer,
            isSmwe,
            isOfw,
            isEstateTrust: needsEstateTrustFields,
            smwAnnual,
            foreignIncome,
            employeeResult,
            estateTrustResult,
            comparison: businessComparison,
            thirteenthMonthResult,
            corporate: corporateResult
              ? {
                  grossIncome: corpGrossSales,
                  netTaxableIncome: Math.max(0, corpGrossSales - corpDeductions),
                  yearsInOperation: corpYears,
                  result: corporateResult,
                }
              : null,
          })
        : null
    },
    [
      hasAnyIncome, profileType, grossCompensation, grossReceipts, itemizedExpenses,
      mandatoryContributions, totalAssets, vatRegistered, hasEmployeeIncome,
      hasBusinessIncome, isMixed, isMultiEmployer, isSmwe, isOfw, needsEstateTrustFields,
      smwAnnual, foreignIncome, employeeResult, estateTrustResult, businessComparison,
      thirteenthMonthResult, corporateResult, corpGrossSales, corpDeductions, corpYears,
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
    if (hasCorporateIncome && corpDeductions > corpGrossSales) {
      list.push('Corporate deductions exceed gross sales, which zeroes out taxable income — double-check both figures.')
    }
    if (isSmwe && smwAnnual > grossCompensation && grossCompensation > 0) {
      list.push(
        'The minimum wage you entered exceeds your gross compensation — the exemption can\'t reduce taxable income below zero.'
      )
    }
    return list
  }, [
    useContributionsOverride, contributionsOverride, grossCompensation, hasEmployeeIncome,
    autoAnnualContributions, needsBusinessFields, hasBusinessIncome, itemizedExpenses,
    grossReceipts, hasCorporateIncome, corpDeductions, corpGrossSales, isSmwe, smwAnnual,
  ])

  // Deliberately defined the same way across every profile type, so the
  // headline stat tiles mean the same thing no matter which is selected.
  const grossIncome = grossCompensation + grossReceipts + corpGrossSales
  const totalDeductions = mandatoryContributions + itemizedExpenses + corpDeductions
  const estimatedTax =
    (employeeResult?.total ?? 0) +
    (businessComparison?.best.total ?? 0) +
    (estateTrustResult?.total ?? 0) +
    (corporateResult?.tax ?? 0)
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
    withheldTaxInput,
    setWithheldTaxInput,
    smwAnnualInput,
    setSmwAnnualInput,
    foreignIncomeInput,
    setForeignIncomeInput,
    corpGrossSalesInput,
    setCorpGrossSalesInput,
    corpDeductionsInput,
    setCorpDeductionsInput,
    corpAssetsInput,
    setCorpAssetsInput,
    corpYearsInput,
    setCorpYearsInput,
    withheldTax,
    smwAnnual,
    foreignIncome,
    corpGrossSales,
    corpDeductions,
    corpAssets,
    corpYears,
    ledger,
    draft,
    setDraft,
    addEntry,
    removeEntry,
    needsEmployeeFields,
    needsBusinessFields,
    needsCorporateFields,
    needsEstateTrustFields,
    needsPayrollTiles,
    isMixed,
    isMultiEmployer,
    isSmwe,
    isOfw,
    hasAnyIncome,
    hasEmployeeIncome,
    hasBusinessIncome,
    hasEstateTrustIncome,
    hasCorporateIncome,
    employeeResult,
    estateTrustResult,
    corporateResult,
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
