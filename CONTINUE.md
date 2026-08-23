# Continuing Moneta — handoff notes

Read this first if you're picking this project up in a new chat, a new LLM, or after a long gap.

## What this project is

Moneta is a free web tool that computes Philippine (BIR) taxes and flags **legal** ways to lower what someone owes — every tip cited to a specific tax rule. Repo: `jerohalili/moneta`. Individual-taxpayer-first tool: no admin panel, no multi-client/practice-management features. Currency is always PHP.

## Stack

- **Next.js 16** (App Router), **React 19**
- Plain CSS (`app/globals.css`), CSS custom properties, no Tailwind
- **Neon (Postgres)** and **Auth.js** are planned but *not wired up yet* — everything is client-side React state, per browser tab, reset on refresh. Known, intentional gap.
- Deployed on **Vercel**

## This session: second wave of calculators — 22 live calculators total

The person pasted a full competitor-style catalog (grouped as Personal Income / Payroll & Benefits / Business / Property & Transfer / Penalties & Compliance / BIR Tools / RDO Tools) and asked to "add what can be added, ignore what should not be added." Here's exactly what was added, what was deliberately skipped, and why — read this before assuming a gap is unintentional.

### Added this session

| Calculator | Route | Notes |
|---|---|---|
| Mixed Income Tax | `/calculators/mixed-income` | **High priority** — this is the calculator that resolves the "known inconsistency" flagged in earlier sessions. `lib/mixedIncomeTax.js` combines `computeEmployeeTax` + `compareRoutes({ isMixedIncomeEarner: true })`. The Dashboard's Mixed profile now links here directly instead of showing a disclaimer. |
| Variable Income | `/calculators/variable-income` | Mid-year salary changes / partial-year work. `lib/variableIncome.js` — build a list of {months, monthlySalary} periods, computes contributions per-period (not blended), sums to annual tax + 13th month. |
| Corporate Income Tax | `/calculators/corporate` | `lib/corporateTax.js` — CREATE Act (RA 11534): 25%/20% RCIT, 2% MCIT from year 4, pays the higher of the two. Doesn't model PEZA/BOI incentive regimes (ITH, 5% SCIT, Enhanced Deductions) — explicitly out of scope, stated in the UI. |
| VAT & Percentage Tax | `/calculators/business` (expanded) | `lib/percentageTax.js` gained `computeVat()` — simple output-minus-input VAT. Explicitly simplified: doesn't handle zero-rated/exempt sales mixes, input VAT apportionment, or carryover from prior periods — stated in the UI. Percentage tax mode unchanged from before. |
| BMBE Tax Savings | `/calculators/bmbe` | `lib/bmbe.js` — RA 9178, ₱3M asset ceiling (excluding land), 100% income tax exemption if eligible. Reuses `compareRoutes()` to show what they'd otherwise owe. |
| Sole Prop vs Corporation | `/calculators/sole-prop-vs-corp` | Pure UI composition of the freelancer and corporate calculators — no new lib file. Explicitly flags that it's income-tax-only and doesn't capture SEC filing costs, mandatory audits, or the dividend tax layer on distributed corporate profits. |
| Expanded Withholding Tax (EWT) | `/calculators/ewt` | `lib/ewt.js` — professional fees (5%/10% individual, 10%/15% corporate, threshold-dependent), rentals (5%), contractors (2%), gov't money payments (1% goods / 2% services). Covers ~6 common categories, not the full ~40-item ATC table — stated in the UI. |
| Overtime Pay | `/calculators/overtime` | `lib/overtimePay.js` — Labor Code multipliers (regular OT 125%, rest day 130%, regular holiday 200%, compounded combinations, +10% night differential). This is DOLE labor law, not BIR — included anyway since it's core to a "Payroll & Benefits" grouping and the multipliers are stable, not annually revised. |
| BIR Closure Penalty Estimator | `/calculators/closure-penalty` | `lib/closurePenalty.js` — reuses the compromise-penalty floor from `lib/penalties.js`, multiplied by count of unfiled returns. |
| BIR Filing Calendar | `/calculators/filing-calendar` | New `lib/deadlines.js` export: `RECURRING_BUSINESS_DEADLINES` (VAT/EWT/payroll withholding monthly+annual forms), alongside the existing `SELF_EMPLOYED_DEADLINES`/`EMPLOYEE_DEADLINES`. Full-year list view, not just "next deadline." |
| BIR Form Finder | `/calculators/form-finder` | Rule-based quiz, no new `lib/` file — conditional logic lives directly in the component since it's pure routing logic over profile type + a few yes/no flags. |
| Real Property Tax | `/calculators/property` (new mode) | `lib/realPropertyTax.js` — statutory ceiling rates only (1% province / 2% city + 1% SEF, RA 7160). Explicitly stated as a ceiling, not a bill — actual LGU rate may be lower. Takes assessed value directly; doesn't compute it from FMV since assessment-level tables are property-type-specific and not modeled. |
| DST — Loans & Leases | `/calculators/property` (new mode) | Added to `lib/propertyTax.js`'s neighborhood via two inline formulas in the component (loan: ₱1.50/₱200 face value; lease: ₱6 flat + ₱2/₱1,000 excess). Covers 2 of ~20 DST instrument types under NIRC Title VII — stated in the UI. |
| ONETT deadline | `/calculators/property` (Sale mode addition) | Given a notarization date, computes CGT due (+30 days) and DST due (5th of following month). **Deliberately does not auto-adjust for weekends/holidays** — see "Deliberately skipped" below. |

All new rate constants are in `data/taxRates2026.js`, each cited to its NIRC section, RA number, or RR. **Rates were verified via web search this session**, not pulled from memory — CREATE Act corporate rates, BMBE Law figures, EWT rates (RR 11-2018), and Local Government Code RPT ceilings all confirmed against multiple current sources before being hardcoded.

**All new `lib/*.js` functions were functionally smoke-tested**, not just linted — ran each with realistic inputs via a Node loader script resolving the `@/` alias, and hand-verified the arithmetic (e.g. confirmed the mixed-income 8% election genuinely produces a higher, correct tax than a pure self-employed person would pay on the same receipts, since the ₱250,000 exemption doesn't apply to them).

### Deliberately skipped, with reasons — don't build these without addressing the reason first

- **RDO Map** (interactive map of 124 BIR Revenue District Offices) — skipped. Building this honestly requires a verified, complete 124-entry dataset (RDO code, jurisdiction, address) that I couldn't confidently source and cross-check in this session. Getting even a few entries wrong has real consequences — it could send someone to the wrong RDO for an actual filing. If you build this, source it from BIR's own published RDO list directly, not secondary blog aggregations, and verify every entry.
- **Holiday-adjusted deadlines** (the "adjusts for holidays and weekends" part of ONETT, and implicitly every other deadline calculator) — skipped. The Philippine holiday calendar changes every year by presidential proclamation; hardcoding a fixed list would silently go stale. Every deadline calculator in this codebase computes the *base statutory date* and says explicitly, in the UI, that it doesn't auto-adjust for weekends/holidays. If you want real adjustment, it needs either a live holiday-calendar API or an annually-updated data file with a clear "as of" date.
- **Standalone "Income Tax Calculator" (generic employee+self-employed)** — skipped as redundant. The Employee and Freelancer calculators already cover this more clearly split apart than one combined router-style tool would.
- **Standalone "8% vs Graduated Rate"** — skipped as redundant. This comparison is already the core feature of the Freelancer calculator (`compareRoutes()`).
- **Standalone "Percentage Tax (OPT)"** — skipped as redundant with the Percentage Tax mode already in VAT & Percentage Tax.
- **"Ad" slots** from the pasted catalog — not calculators, not built. Anthropic's products don't insert ads, and there was no reason to scaffold placeholder ad components into someone else's app.

### Income Profile / Dashboard changes this session

`components/IncomeProfile.js`: the Mixed profile's "Cheapest legal route" section now links to the real `/calculators/mixed-income` page instead of showing a disclaimer explaining why it couldn't link anywhere. The "Related calculators" section's Mixed branch was updated to lead with the new Mixed Income calculator.

## Known gaps still open (mostly pre-existing, still true)

- No auth/persistence (Milestone 1 in the earlier scope conversation, still not started)
- Sales Tax Bucket roadmap tile (full VAT with zero-rated/exempt mixing) — the new VAT mode covers the simple case only
- Historical Archive — needs the database layer

## Verified working

- `npm install && npx eslint .` — clean, zero errors, full project
- All new `lib/*.js` logic hand-verified via direct Node execution (not just linted) — see smoke-test numbers above
- `npm run build` still can't be verified in a network-locked sandbox (`next/font/google` needs `fonts.googleapis.com`) — environment limitation, not a code issue

## Suggested next steps

1. Wire up Auth + Neon persistence — the single biggest lever left, unlocks Historical Archive and makes Income Profile durable across sessions
2. If RDO Map or holiday-adjusted deadlines come up again, source the underlying data properly first (see "Deliberately skipped" above) rather than hardcoding something unverified
3. Full VAT modeling (zero-rated/exempt mix, input VAT apportionment, carryover tracking) if the simplified version in `/calculators/business` proves insufficient for real users
4. Re-verify every rate constant in `data/taxRates2026.js` against official sources if reading this in a new tax year — this file is large now; the comments above each constant cite the legal basis to make re-verification tractable section by section

## How to hand this to a different LLM

Paste this file's contents (or point at `CONTINUE.md`) plus: "continue this project." It explains what's built, what was deliberately left out and why (important — don't re-attempt the skipped items without addressing the stated reason), and what's next.
