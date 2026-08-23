# Continuing Moneta — handoff notes

Read this first if you're picking this project up in a new chat, a new LLM, or after a long gap. It's written so a model with zero prior context on this repo can get productive in one read.

## What this project is

Moneta is a free web tool that computes Philippine (BIR) taxes and flags **legal** ways to lower what someone owes — every tip cited to a specific tax rule, not a guess. Repo: `jerohalili/moneta`. Target user: an individual Filipino freelancer, employee, or small business owner. This is an individual-taxpayer tool, not a practice-management tool for accountants/bookkeepers — no admin panel, no multi-client features, by design.

Currency is always PHP (₱).

## Stack

- **Next.js 16** (App Router), **React 19**
- Plain CSS (`app/globals.css`) using CSS custom properties — no Tailwind, no CSS-in-JS
- **Neon (Postgres)** and **Auth.js** are planned but *not wired up yet* — everything is computed **client-side, in React state, for the current browser tab only**. Refresh and it resets. Intentional, known gap — don't fake persistence
- Deployed on **Vercel**

## This session: full calculator suite, all 8 now live

Previously only the Freelancer calculator was real; the rest were "Coming soon" tiles. All 8 are now built and linked from `/calculators`:

| Calculator | Route | Core logic |
|---|---|---|
| Freelancer / Self-Employed Tax | `/calculators/freelancer` | `lib/freelancerTax.js` (pre-existing) |
| Employee Income Tax | `/calculators/employee` | `lib/employeeTax.js` (pre-existing) |
| Contributions | `/calculators/contributions` | `lib/contributions.js` (new) |
| Net Pay | `/calculators/net-pay` | `lib/netPay.js` (new, composes contributions + employee tax) |
| 13th Month Pay | `/calculators/thirteenth-month` | `lib/thirteenthMonthPay.js` (new) |
| Business Taxes | `/calculators/business` | `lib/percentageTax.js` (new) |
| Property & Transfer Taxes | `/calculators/property` | `lib/propertyTax.js` (new — CGT, DST, estate tax, donor's tax, one page with a mode switcher) |
| BIR Penalties | `/calculators/penalties` | `lib/penalties.js` (new — surcharge, interest, compromise) |

All new rate constants live in `data/taxRates2026.js` alongside the existing ones, with citations to the specific NIRC section or law in the comments (RA 11199 for SSS, RA 11223 for PhilHealth, RA 11976/EOPT Act for the reduced penalty rates, etc.).

**Rates were verified via web search this session** (SSS/PhilHealth/Pag-IBIG schedules, CGT/DST/estate/donor's tax rates, BIR surcharge/interest/EOPT rates, RMO 7-2015 compromise brackets) rather than pulled from memory, since these are exactly the kind of figures that drift with circulars. Two honesty notes worth knowing if you touch this code:

- **The compromise penalty table in `lib/penalties.js`/`data/taxRates2026.js` is a representative estimate, not an exact quote.** Source tables for RMO 7-2015 disagree across different secondary sources depending on violation type. The UI says this explicitly ("confirm your exact bracket at your RDO") — don't remove that caveat without re-sourcing the table from BIR's actual RMO text.
- **SSS Monthly Salary Credit (MSC) is estimated by rounding to the nearest ₱500**, not looked up from the official bracket table (which isn't machine-readable anywhere I could find). This is accurate almost everywhere but can be off by one bracket right at a boundary — also called out in the UI.
- **All new logic was functionally smoke-tested by hand** (ran each function with realistic inputs, verified the arithmetic manually) before considering it done — not just linted. See the numbers checked out: e.g. ₱600,000 gross − ₱25,000 contributions → ₱57,500 tax, which matches the TRAIN bracket formula (₱22,500 + 20% of the excess over ₱400,000) exactly.

### Business Taxes scope note
Only percentage tax (3%, non-VAT-registered, NIRC Sec. 116) is modeled. VAT input/output-credit computation for VAT-registered businesses is explicitly flagged as not built (same gap noted on the Dashboard roadmap).

## Income Profile — improved this session

`hooks/useIncomeProfile.js` and `components/IncomeProfile.js`: mandatory contributions for Employee/Mixed profiles are now **computed automatically** from annual gross compensation via `lib/contributions.js`, instead of requiring the person to self-report a number they'd probably have to look up anyway. There's still a manual override checkbox ("My actual contributions are different") for people with irregular pay or multiple employers, but auto-compute is the default path now.

This also means the "Payroll Contributions" roadmap tile is gone from the Dashboard — it's built now, not a placeholder.

## Dashboard — improved this session

`components/IncomeProfile.js` now ends with a **"Related calculators" section** that deep-links to the right full calculators based on the selected profile type (e.g. an Employee profile links to Employee Income Tax, Net Pay, 13th Month Pay, and Contributions; a Freelancer/Business profile links to the Freelancer calculator, Business Taxes, and Property & Transfer Taxes). This is what actually connects the Dashboard to the calculator suite — previously they were two disconnected parts of the app.

The roadmap grid now only has two tiles left: **Sales Tax Bucket** (needs VAT credit modeling) and **Historical Archive** (needs the database layer). Everything else that was on the original wishlist is built.

## Known inconsistency, still flagged in the UI (carried over from a previous session)

For **Mixed** profiles, the Dashboard correctly applies the RR 8-2018 rule that a mixed-income earner's 8% election doesn't get the ₱250,000 exemption. The full Freelancer calculator at `/calculators/freelancer` still always assumes pure self-employment, so it would show a more favorable — and wrong — number for a Mixed profile. The Dashboard's "Cheapest legal route" card only links out to that calculator for Freelancer/Business profiles, and shows an explicit disclaimer instead for Mixed. Fix properly by building a real Mixed-income calculator page (see next steps).

## Design system (unchanged this session, for reference)

Charcoal-first dark mode (`--paper: #17191B`, not green-black), green reserved for accents (`--accent: #34D399` in dark, `#14804A` in light), glassmorphism (`rgba(var(--glass-rgb), a)` + `backdrop-filter: blur()`), default theme always light for first-time visitors, full-width layout via `.container` (`max-width: 1360px`). All of this lives in `app/globals.css`.

## Verified working

- `npm install && npx eslint .` — clean, zero errors
- **All new `lib/*.js` functions were run directly in Node** (via a loader script resolving the `@/` path alias) with realistic inputs and the output was checked by hand against the known tax formulas — not just linted
- `npm run build` still can't be verified in a network-locked sandbox (`next/font/google` needs `fonts.googleapis.com`) — environment limitation, not a code issue

## Suggested next steps

1. Build a real **Mixed-income calculator page** so the Dashboard's Mixed profile can link out with confidence instead of showing a disclaimer suppressing the link
2. VAT input/output-credit modeling for VAT-registered businesses (the Sales Tax Bucket roadmap item)
3. Auth + persistence (Neon + Auth.js) — the big architectural lift that unlocks Historical Archive and makes the Income Profile a true cross-session single source of truth instead of resetting on refresh
4. Re-verify all rate constants in `data/taxRates2026.js` against official sources if you're reading this in a new tax year — especially the SSS/PhilHealth/Pag-IBIG schedules and the compromise penalty brackets, both flagged above as estimates

## How to hand this to a different LLM

Paste this file's contents (or point at `CONTINUE.md` in the repo root) plus: "continue this project." It explains what's real, what's an honest estimate vs. an exact figure, the Dashboard/calculator connection, the mixed-income rule inconsistency to watch for, and what to build next.
