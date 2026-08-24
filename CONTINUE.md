# Continuing Moneta — handoff notes

Read this first if picking this project up fresh.

## What this project is

Moneta is a free web tool that computes Philippine (BIR) taxes and flags **legal** ways to lower what someone owes. Individual-taxpayer-first: no admin panel, no multi-client features. Currency always PHP.

## Stack

- **Next.js 16** (App Router), **React 19**
- Plain CSS (`app/globals.css`), CSS custom properties, no Tailwind
- **No account system / no database.** As of this session, there IS a persistence layer, but it's **localStorage only** — see below. Auth + Neon (real cross-device persistence) is still not started.
- Deployed on **Vercel**

## This session: fixed 3 real bugs + built the local persistence/history layer the person actually asked for

### Bug 1 — contrast: "Live" pill black-on-dark-green in light mode
Already fixed and pushed in a prior message this session (`.btn-primary`, `.badge`, `.status-pill.live` all had their light/dark text colors backwards). If that patch didn't make it to GitHub before this one, it's included again here since this patch was generated from the actual current repo state, whatever that turned out to be — no action needed either way, just confirming it's not been silently dropped.

### Bug 2 — explanatory text stuck in a narrow column
`.empty-copy { max-width: 58ch }` was a leftover from an earlier, narrower layout. Every "How this is computed" paragraph, the Write-off Ledger's empty state, and similar text blocks were all capped at ~460px regardless of how wide the actual card was — hence "stuck at half left side." **Fixed: removed the `max-width` from `.empty-copy` entirely.** `.disclaimer` never had this problem. If text ever looks unexpectedly narrow again, check for a stray `max-width` on the class in question before assuming it's a flex/grid layout bug.

### Bug 3 — auto-computed contributions producing nonsense for tiny inputs
Typing something like "100" for annual gross compensation (a testing/placeholder value, or a genuine typo) produced ~₱6,000 in computed contributions and a negative net income. **This wasn't a math bug** — `lib/contributions.js`'s floors are real: SSS has a ₱5,000 minimum Monthly Salary Credit and PhilHealth has a ₱10,000 floor, both of which apply regardless of how low the actual salary is. The problem was that **nothing flagged when this produced a nonsensical result** — the auto-computed path had no sanity check, even though the *manual override* path already had one.

**Fixed in `hooks/useIncomeProfile.js`:** added an error check — if auto-computed annual contributions exceed the entered gross compensation, `errors` now includes a message explaining *why* (the floors), not just that something's wrong, and suggests double-checking the number or using the manual override. The underlying math in `lib/contributions.js` is untouched, since the floors are accurate — this was a missing-validation bug, not a formula bug. If you touch any other calculator that calls `computeMonthlyContributions` or `computeNetPay` (Net Pay calculator, Mixed Income calculator), the same edge case can occur there too and doesn't yet have the same warning — only the Income Profile hook has it as of this session.

### Bug 4 (visual) — the "Contributions (computed automatically)" stat looked broken
`components/IncomeProfile.js` and `components/FreelancerWorkbench.js` both had a recurring anti-pattern: a `.stat-tile` div with `style={{ border: 'none', padding: 0, background: 'transparent' }}` stripping out all the actual `.stat-tile` styling, leaving raw unstyled text stacked with no card treatment — inconsistent with every other stat on the page. **Fixed by using the real `<StatTile>` component inside a proper `.stat-grid` wrapper**, matching everywhere else. Search for that exact inline-style string before adding a new one-off stat display; it should never recur.

## This session: local persistence + history (the actual feature request)

The person's core complaint: "automatic" (live recalculation, no Calculate button) was the right call for *display*, but it removed any discrete moment to *save* a result, and the Income Profile reset on every page refresh. Two different problems, two different fixes — **live recalculation was NOT reverted**; a separate save action was added alongside it.

### `lib/localStore.js` (new)
Thin, defensive `loadJSON`/`saveJSON`/`removeJSON` wrappers around `window.localStorage`, all try/caught (private browsing, disabled storage, quota — all fail silently rather than crash). This is genuinely the only persistence layer in the app right now. It's per-browser, not synced across devices, and wiped if the person clears site data — say so in the UI wherever it's used, don't let it read as real cloud storage.

### `lib/history.js` (new) + `components/HistoryList.js` (new) + `components/SaveToHistoryButton.js` (new)
A calculation history log backed by `lib/localStore.js`. `SaveToHistoryButton` is a reusable button (label: "Save to History", not "Calculate" — the distinction matters, see above) that snapshots `{ calculatorName, summary, details, savedAt }` into the log. `app/history/page.js` was rewritten from a static placeholder into a real client component (`HistoryList`) that lists, deletes, and clears saved entries.

**Wired up so far:** Income Profile, Freelancer calculator, Employee calculator, Mixed Income calculator. **Not yet wired up:** the other ~14 calculators (Contributions, Net Pay, 13th Month, Corporate, BMBE, EWT, Overtime, Property/Sale/Estate/Donor/RPT/DST modes, Penalties, Closure Penalty, Sole vs Corp, Business/VAT). If picking this up again, adding `<SaveToHistoryButton />` to the rest is mechanical — copy the pattern from `EmployeeTaxCalculator.js` (simplest example): compute a `summary` string and a `details` object from the calculator's existing state/result, done.

### `hooks/useIncomeProfile.js` — now persists across refresh
The whole Income Profile (`profileType`, both income figures, the write-off ledger, the contributions override) is loaded from localStorage on mount and saved on every change. This is the "store all the needed info" fix — the profile is now a real, if locally-scoped, saved object, not disposable render state. Follows the same "start with server-safe defaults, hydrate after mount" pattern already used by `ThemeToggle.js`/`FilingCountdown.js` to avoid SSR/hydration mismatches — don't try to read localStorage during initial render.

### Dashboard auto-orchestration — partially addressed
For Employee/Mixed profiles, `useIncomeProfile` now also runs `computeNetPay()` and `computeThirteenthMonthPay()` automatically off the same stored compensation figure, and `components/IncomeProfile.js` renders those results directly in a new "Net Pay & 13th Month Pay" section — not just a link out to those calculators anymore. Business-side profiles (Freelancer/Business/Mixed) already had this pattern from an earlier session (cheapest-route + tips shown inline). **Not done:** anything beyond these two — e.g. auto-suggesting BMBE eligibility would need a new "business assets" field the Income Profile doesn't currently collect. If asked to go further here, that's the natural next data point to add.

## Verified working

- `npm install && npx eslint .` — clean, zero errors, full project
- All fixes verified against the actual current GitHub state (cloned fresh, applied, installed, linted) before being called done

## Suggested next steps

1. Extend Save-to-History to the remaining calculators (mechanical, see above)
2. Add the same "auto contributions exceed income" sanity check to Net Pay and Mixed Income calculators, not just the Income Profile hook
3. Auth + Neon — still the big lever; once it exists, `lib/localStore.js`-backed history and profile persistence should migrate to real per-account storage, and the "this is per-browser only" disclaimers throughout the UI can come out
4. If deepening Dashboard auto-orchestration further, consider what new profile fields would be needed (e.g. business assets → BMBE eligibility) before building the UI for it

## How to hand this to a different LLM

Paste this file plus: "continue this project." Pay particular attention to the "automatic ≠ no way to save" distinction above — it's a real design decision this session made explicit, not an oversight to revisit casually.
