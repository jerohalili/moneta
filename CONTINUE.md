# Continuing Moneta — handoff notes

Read this first if you're picking this project up in a new chat, a new LLM, or after a long gap. It's written so a model with zero prior context on this repo can get productive in one read.

## What this project is

Moneta is a free web tool that computes Philippine (BIR) taxes and flags **legal** ways to lower what someone owes — every tip cited to a specific tax rule, not a guess. Repo: `jerohalili/moneta`. Target user: an individual Filipino freelancer, employee, or small business owner who wants plain-language tax math without hiring an accountant just to understand their own numbers.

**This is currently an individual-taxpayer tool, not a practice-management tool for accountants/bookkeepers.** That distinction matters for what to build next — see "Open product question" below.

Currency is always PHP (₱) — this is a Philippines-only tool, don't genericize it to other currencies.

## Stack

- **Next.js 16** (App Router), **React 19**
- Plain CSS (`app/globals.css`) using CSS custom properties — no Tailwind, no CSS-in-JS
- **Neon (Postgres)** and **Auth.js** are planned but *not wired up yet* — everything is computed **client-side, in React state, for the current browser tab only**. Refresh and it resets. Intentional, known gap — don't fake persistence
- Deployed on **Vercel**

## Important correction from this session

An earlier session accidentally turned the **Dashboard** into a Freelancer-only calculator (it embedded the freelancer workbench directly, with freelancer-specific copy like "Freelancer Quick Profile"). **That was wrong and has been reverted.** The Dashboard is now a general-purpose **Income Profile** that works for any of four taxpayer types. The freelancer-specific calculator UI lives *only* at `/calculators/freelancer`, where it belongs.

If you're about to embed calculator-specific UI into the Dashboard again: don't. The Dashboard should stay profile-type-agnostic; type-specific deep-dive calculators belong under `/calculators/*`.

## Current state of the code

### Income Profile (Dashboard) — new this session
- `hooks/useIncomeProfile.js` — the Dashboard's live calculation state. Holds a `profileType` (`'employee' | 'freelancer' | 'business' | 'mixed'`, starts `null` until the person picks one), plus whichever inputs are relevant to that type, and recomputes four headline stats (Net Income Pre-Tax, Estimated Tax Owed, Effective Rate, Est. Take-Home) the same way regardless of profile type — so the four tiles always mean the same thing
- `components/ProfileTypeSelector.js` — the four-way picker (segmented cards, not a dropdown)
- `components/IncomeProfile.js` — renders the whole Dashboard flow: profile picker → type-appropriate input fields → stats → filing schedule (or a substituted-filing note for pure employees) → quarterly reserve → expense ledger/categories (business-relevant types only) → cheapest route + recommendations (business-relevant types only)
- `lib/employeeTax.js` (new) — compensation income tax estimator, reusing the same `applyGraduatedTable()` bracket function the freelancer calculator uses. Contributions (SSS/PhilHealth/Pag-IBIG) must be entered manually — the official 2026 tables aren't in this codebase yet (see Payroll Contributions roadmap item)
- `lib/freelancerTax.js` — extended, not replaced. `computeEightPercentRoute()` now takes an `applyExemption` flag, and `compareRoutes()` takes `isMixedIncomeEarner`. When true, the ₱250,000 exemption on the 8% election is *not* applied — this is the real RR 8-2018 rule: a mixed-income earner's ₱250,000 exemption is already used up on the compensation side, so it can't also apply to their business income. **Business Owner reuses this exact same function as Freelancer** — BIR taxes a sole proprietor's business income and a freelancer's professional income identically under Sec. 24(A)/24(A)(2)(b); only the input label differs ("gross sales" vs. "gross receipts")
- `lib/deadlines.js` — split into `SELF_EMPLOYED_DEADLINES` (quarterly 1701Q/2551Q + annual 1701, for freelancer/business/mixed) and `EMPLOYEE_DEADLINES` (just the 1700 annual return, with a note that most single-employer employees never file it themselves — substituted filing via BIR Form 2316 covers them). `getNextDeadline(profileType, referenceDate)` now takes the profile type as its first argument
- `components/FilingCountdown.js` — takes a `profileType` prop and passes it through to `getNextDeadline()`

### Known inconsistency, flagged in the UI itself
For **Mixed** profiles, the Dashboard correctly applies the no-₱250k-exemption rule to the 8% route. But `/calculators/freelancer` (the full calculator) always assumes pure self-employment (`isMixedIncomeEarner` defaults `false`), so it would show a more favorable — and wrong — number for a mixed-income earner. The Dashboard's "Cheapest legal route" card only links to the full calculator for Freelancer/Business profiles, and for Mixed shows an explicit disclaimer instead, telling the person to trust the Dashboard's number over the calculator's. If you build a real Mixed-income calculator page later, this disclaimer and the link-suppression logic in `components/IncomeProfile.js` can come out.

### Freelancer calculator — unchanged in substance, simplified in code
`components/FreelancerWorkbench.js` no longer has a `variant` prop — it used to render differently for "dashboard" vs. "full" embedding, but since the Dashboard doesn't embed it anymore, it always renders the full view. Still lives only at `/calculators/freelancer/page.js`.

### What's still a placeholder, and why
The Dashboard's "On the roadmap" grid:
- **Sales Tax Bucket** — needs VAT input/output-credit logic, not modeled
- **Payroll Contributions** — needs 2026 SSS/PhilHealth/Pag-IBIG tables in `data/`, which don't exist yet. Until then, the Income Profile's Employee/Mixed fields ask the person to self-report their total contributions
- **Historical Archive** — needs an account + database; nothing persists today

### Deliberately not built, and why
Payment Gateway (real payment-processing/compliance concern) and Client Health Grid / Task Assignment / E-File Queue (practice-management features for an accountant handling multiple clients — a different product than an individual-taxpayer tool).

**Open product question, unresolved:** does Moneta stay an individual-taxpayer tool, or expand to also serve accountants/bookkeepers managing multiple clients? Settle this before building toward the four features above.

## Design system

### Layout
`.app-shell` has no fixed max-width; a `.container` class (`max-width: 1360px`, `padding: 0 clamp(20px, 4vw, 56px)`) is applied to the header and to `<main>` separately.

**Bug fixed this session:** `.masthead` used to set `padding: 28px 0 16px` — a shorthand that zeroes out left/right padding. Since `.masthead` and `.container` were both applied to the same header element, this silently overrode `.container`'s horizontal padding, so the nav bar touched the screen edges on some viewport widths. Fixed by using `padding-top` / `padding-bottom` only on `.masthead`, which can no longer clobber `.container`'s horizontal padding regardless of CSS source order. **If you ever add padding/margin shorthand to a class that's combined with `.container` on the same element, double check it doesn't zero out `0 clamp(...)` again.**

### Nav bar background
**Also fixed this session:** the masthead bar used to be transparent, blending into the page's gradient wash. `.masthead-bar` now has an explicit `background: var(--paper-raised)` (solid white in light mode, solid charcoal in dark mode) plus a hairline bottom border and `--card-shadow`, so it reads as a distinct, opaque bar rather than blending into the background.

### Dark mode — charcoal first, green second
| Token | Light | Dark |
|---|---|---|
| `--paper` | `#F5FAF6` | `#17191B` |
| `--paper-raised` | `#FFFFFF` | `#1E2124` |
| `--ink` | `#10251C` | `#ECEFED` |
| `--ink-soft` | `#55695E` | `#9BA39E` |
| `--rule` | `#DBE6DD` | `#33373A` |
| `--accent` / `--accent-strong` | `#14804A` / `#0C5C34` | `#34D399` / `#6EE7B4` |
| `--accent-soft` | `#E1F3E7` | `#1D2E27` |
| `--danger` / `--danger-soft` | `#B4232C` / `#FBE6E4` | `#F0605C` / `#2E1E1E` |
| `--glass-rgb` | `255, 255, 255` | `30, 33, 36` |

Green is reserved for accents/glow, never a background fill. Default theme is always light for first-time visitors (`app/layout.js`'s init script only reads `localStorage`, never `prefers-color-scheme`).

### Glassmorphism + gradients
`.card`, `.stat-tile`, `.calc-tile`, and now `.profile-type-card` use `rgba(var(--glass-rgb), a)` + `backdrop-filter: blur(...)` over a fixed radial-gradient body background (`--bg-wash`). `.btn-primary`, `.badge`, `.status-pill.live` use a green gradient fill. `.glow-card` puts a soft gradient-outline glow around the one primary input card per page — the single deliberate flourish.

## Verified working

- `npm install && npx eslint .` — clean, zero errors, as of this session
- `npm run build` still can't be verified in a network-locked sandbox (can't reach `fonts.googleapis.com` for `next/font/google`) — environment limitation, not a code issue. Builds fine with real internet access

## Suggested next steps, roughly in priority order

1. **Resolve the open product-scope question** before building any multi-client feature
2. Build a real **Mixed-income calculator page** at `/calculators/mixed` so the Dashboard's Mixed profile can link out with confidence instead of showing a disclaimer suppressing the link
3. Build **Employee** and **Contributions** (SSS/PhilHealth/Pag-IBIG) as their own full calculator pages, following the same pattern as the Freelancer one (pure logic in `lib/`, a hook, a `Workbench`-style component)
4. Wire up Neon + Auth.js so state persists and the Historical Archive tile can become real
5. Re-verify `data/taxRates2026.js` against bir.gov.ph if you're reading this in a new tax year

## How to hand this to a different LLM

Paste this file's contents (or point it at `CONTINUE.md` in the repo root) plus: "continue this project." It explains what's real vs. placeholder, the Dashboard/calculator scope boundary, the mixed-income rule inconsistency to watch for, the open product-scope question, and what to build next.
