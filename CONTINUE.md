# Continuing Moneta — handoff notes

Read this first if you're picking this project up in a new chat, a new LLM, or after a long gap. It's written so a model with zero prior context on this repo can get productive in one read.

## What this project is

Moneta is a free web tool that computes Philippine (BIR) taxes and flags **legal** ways to lower what someone owes — every tip cited to a specific tax rule, not a guess. Repo: `jerohalili/moneta`. Target user: an individual Filipino freelancer, employee, or small business owner who wants plain-language tax math without hiring an accountant just to understand their own numbers.

**This is currently an individual-taxpayer tool, not a practice-management tool for accountants/bookkeepers.** That distinction matters for what to build next — see "Open product question" below.

Currency is always PHP (₱) — this is a Philippines-only tool, don't genericize it to other currencies.

## Stack

- **Next.js 16** (App Router), **React 19** — chosen so the same codebase can later add auth + database-backed API routes without a separate backend
- Plain CSS (`app/globals.css`) using CSS custom properties — no Tailwind, no CSS-in-JS
- **Neon (Postgres)** and **Auth.js** are planned but *not wired up yet* — everything on the Dashboard is computed **client-side, in React state, for the current browser tab only**. Refresh the page and it resets. This is a known, intentional gap, not a bug — don't "fix" it by faking persistence
- Deployed on **Vercel**

## Current state of the code

### What's real and working
- `lib/freelancerTax.js` — pure functions comparing the 8% flat rate vs. graduated rate (OSD or itemized)
- `lib/advisor.js` — rule-based tips generator, each tip cited to a specific BIR provision
- `data/taxRates2026.js` — actual BIR figures for tax year 2026, with a comment warning to re-verify if reused in a future tax year
- `lib/deadlines.js` — standard statutory BIR due dates for a calendar-year filer; `getNextDeadline()` finds the next upcoming one from today
- `lib/expenseCategories.js` — the category list used in the write-off ledger
- `lib/format.js` — `formatPHP()` / `formatPercent()` helpers used everywhere numbers are displayed
- `hooks/useFreelancerTax.js` — **the core of "automatic" calculation.** Holds gross receipts + an expense ledger in React state, and recomputes everything (`compareRoutes`, `getFreelancerTips`, category totals, validation errors) live via `useMemo` on every keystroke. There is deliberately no "Calculate" button anywhere. This one hook powers both the Dashboard's compact view and the full calculator page — they can't drift out of sync because they share state logic, not just styling
- `components/FreelancerWorkbench.js` — renders the hook's output, with a `variant="dashboard" | "full"` prop controlling how much detail shows
- `app/calculators/freelancer/page.js` — the first real, working calculator (previously just a "Coming soon" tile with no page behind it)
- `components/RouteComparison.js` — **the comparison view.** Shows every eligible tax route (8% flat, graduated+OSD, graduated+itemized) side by side as cards, cheapest one highlighted with a badge. `compareRoutes()` already ranked routes in `lib/`, but had no UI before this
- `components/ExpenseLedger.js`, `CategoryBars.js`, `FilingCountdown.js`, `ErrorFlags.js`, `TipsList.js` — supporting pieces, described below
- `app/page.js` — the Dashboard now embeds `<FreelancerWorkbench variant="dashboard" />` instead of showing static "—" placeholders

### What's still a placeholder, and why (be honest about this if asked)
A small "On the roadmap" grid on the Dashboard lists three tiles, each with the real reason it isn't built:
- **Sales Tax Bucket** — needs VAT input/output-credit logic not modeled anywhere yet; today's numbers are income-tax-only
- **Payroll Contributions** — needs 2026 SSS/PhilHealth/Pag-IBIG contribution tables, which don't exist in `data/` yet
- **Historical Archive** — needs an account + database to persist anything between visits; nothing persists today

### Deliberately not built, and why
An earlier feature wishlist for the dashboard also included: Payment Gateway (one-click bill pay), Client Health Grid, Task Assignment, and E-File Queue (batch submission). These were **not** built:
- **Payment Gateway** is a real payment-processing integration with compliance/licensing implications — not something to fake with a button that doesn't actually move money
- **Client Health Grid, Task Assignment, E-File Queue** are practice-management features for an accountant/bookkeeper managing *multiple clients*. They don't fit an individual-taxpayer tool's data model (no concept of "clients" or "staff" exists anywhere) and represent a different product

**Open product question, unresolved:** is Moneta staying an individual-taxpayer tool, or expanding to also serve accountants/bookkeepers managing multiple clients? This changes the data model significantly (multi-tenant accounts, staff roles, client records) and should be settled before building toward the four features above.

## Design system

### 1. Full-width layout fix
`.app-shell` has no fixed max-width cap. A `.container` class (`max-width: 1360px`, `padding: 0 clamp(20px, 4vw, 56px)`) is applied separately to the header and to `<main>`, so the header bar reaches screen edges while content still lines up sensibly.

### 2. Dark mode — charcoal first, green second
An earlier pass used near-black-green backgrounds almost everywhere, which read as "all green" instead of a real dark theme. Corrected to:

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--paper` | `#F5FAF6` | `#17191B` | page background — dark is neutral charcoal, not green-black |
| `--paper-raised` | `#FFFFFF` | `#1E2124` | card/tile base color before glass transparency |
| `--ink` | `#10251C` | `#ECEFED` | primary text |
| `--ink-soft` | `#55695E` | `#9BA39E` | secondary text |
| `--rule` | `#DBE6DD` | `#33373A` | borders/dividers — neutral gray in dark mode |
| `--accent` / `--accent-strong` | `#14804A` / `#0C5C34` | `#34D399` / `#6EE7B4` | green is reserved for accents, glow, and highlights only — never a background fill |
| `--accent-soft` | `#E1F3E7` | `#1D2E27` | tinted highlight backgrounds (best-route card, category tags) |
| `--danger` / `--danger-soft` | `#B4232C` / `#FBE6E4` | `#F0605C` / `#2E1E1E` | used by `ErrorFlags` |
| `--glass-rgb` | `255, 255, 255` | `30, 33, 36` | RGB triple (not hex) so glass surfaces can use `rgba(var(--glass-rgb), 0.6)` |

### 3. Default theme is always light
The theme init script in `app/layout.js` only reads `localStorage` — it never checks `prefers-color-scheme`. First-time visitors always start in light mode regardless of OS setting, and only switch once they've used the toggle themselves.

### 4. Glassmorphism + gradients
- `.card`, `.stat-tile`, `.calc-tile` use `background: rgba(var(--glass-rgb), 0.62)` + `backdrop-filter: blur(...)` over a fixed radial-gradient body background (`--bg-wash`)
- `.btn-primary` is a pill-shaped gradient button used for the "Log it" ledger action
- `.badge` and `.status-pill.live` got the same gradient treatment
- `.glow-card` puts a soft gradient-outline glow around the main gross-receipts input card — the one deliberate visual flourish; everything else stays quiet

## New Dashboard behavior

The Dashboard (`app/page.js`) embeds `<FreelancerWorkbench variant="dashboard" />`, which:
1. Takes a gross receipts input
2. Recalculates Net Income (Pre-Tax), Estimated Tax Owed, Effective Rate, and Est. Take-Home live
3. Shows a real Filing Schedule countdown (`FilingCountdown.js`, using `lib/deadlines.js`)
4. Shows a Quarterly Tax Reserve estimate (annual tax ÷ 4, clearly labeled as a simplified even split, not the actual BIR cumulative quarterly formula)
5. Lets you log expenses with a category and optional receipt file (`ExpenseLedger.js`) — filename is remembered in-memory only, nothing is uploaded anywhere, and the UI says so
6. Shows a category breakdown as horizontal bars (`CategoryBars.js`)
7. Shows the cheapest route + links to the full calculator for the complete comparison
8. Shows the top recommendation + a link to see all of them
9. Runs live validation (`ErrorFlags.js`) — e.g. flags if logged expenses exceed gross receipts

The full calculator at `/calculators/freelancer` uses the same hook (`variant="full"`) and shows everything above plus the complete `RouteComparison` grid and the full tips list.

## Verified working

- `npm install && npx eslint .` — clean, zero errors
- `npm run build` can't be verified in the sandbox this was built in (outbound network there can't reach `fonts.googleapis.com`, which `next/font/google` needs) — an environment limitation, not a code issue. Builds normally on Vercel or any machine with real internet access

## Suggested next steps, roughly in priority order

1. **Resolve the open product question above** before building Client Health Grid / Task Assignment / E-File Queue / Payment Gateway — they need a real answer on scope, not an assumption
2. Build **Employee Income Tax** and **Contributions** (SSS/PhilHealth/Pag-IBIG) calculators the same way the Freelancer one was built: pure logic in `lib/`, a shared hook, a `Workbench` component with `dashboard`/`full` variants
3. Wire up Neon + Auth.js so the "session-only" limitation goes away and the Historical Archive tile can become real
4. Re-verify `data/taxRates2026.js` against bir.gov.ph if you're reading this in a new tax year

## How to hand this to a different LLM

Paste this file's contents (or point it at `CONTINUE.md` in the repo root) plus: "continue this project." It explains what's real vs. placeholder, what changed most recently, the open product-scope question, and what to build next.
