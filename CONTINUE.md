# Continuing Moneta — handoff notes

Read this first if picking this project up fresh.

## What this project is

Moneta is a free web tool that computes Philippine (BIR) taxes and flags **legal** ways to lower what someone owes. Individual-taxpayer-first: no admin panel, no multi-client features. Currency always PHP.

## Stack

- **Next.js 16** (App Router), **React 19**
- Plain CSS (`app/globals.css`), CSS custom properties, no Tailwind
- **No account system / no database.** Persistence is **localStorage only** via `lib/localStore.js` — see below. Auth + Neon (real cross-device persistence) is still not started.
- Deployed on **Vercel**

## This session: Dashboard became a real advisor + user-editable rates & logic

The person's brief, verbatim intent: the old Dashboard "doesn't really do anything aside from automatically suggest a calculator." It should collect info, compute everything automatically, and act as a genuine advisor that lowers taxes and teaches how they work — plus the user must be able to **edit rates/logic/calculations** so the site adapts when the government or economy changes. Both halves shipped this session; neither is a stub.

### Part 1 — Editable rates & logic (`/settings`, nav label "Rates & Logic")

- **`lib/taxConfig.js` is the new rate layer.** `data/taxRates2026.js` remains the compiled defaults (unchanged, still verified-Aug-2026 figures). `RATES` is a mutable live copy of the defaults; every lib module and every component that previously imported constants directly now reads `RATES.*`. A localStorage-backed override store (`moneta:rate-overrides`) layers user edits on top. Registry entries carry `unit`, `group`, an educational `description` (the settings UI doubles as documentation), and tables declare `columns`.
- **Hydration contract:** `RATES` starts identical to defaults so SSR and first client paint agree. `components/TaxConfigSync.js` (rendered once in `app/layout.js`) calls `applyStoredOverrides()` in a mount effect, which mutates `RATES` and notifies subscribers. `hooks/useTaxRatesVersion.js` returns a version counter that increments on every change; both income hooks include it in every `useMemo` dep array with a `void ratesVersion` body reference (that's deliberate cache-busting, not a lint accident). Non-hook calculator pages just read `RATES` at render — SPA navigation remounts them, so they pick up edits on mount.
- **`/settings` page** (`app/settings/page.js` + `components/SettingsEditor.js`): grouped editors for all ~45 scalars and both bracket tables (graduated income tax, compromise penalties). Scalars commit on blur; tables keep a local working copy and commit on cell blur / add / remove / "Fix cumulative bases" (recomputes the base column from the rates). Per-value revert, reset-all, JSON export/import (import validates keys against the registry and rejects unknown keys loudly rather than silently ignoring).
- **Gotchas encoded in `taxConfig.js` (do not regress):**
  - `clone()` spread-copies table rows because a JSON round-trip turns `Infinity` (the open-ended final bracket bound) into `null` — which silently corrupts `explainGraduatedTable`'s slice math.
  - `sanitizeOverride` accepts `Infinity` for `currency-or-inf` columns; `Number.isFinite(Infinity)` is false, so a naive finite-check rejects every legal bracket table.
  - `applyStoredOverrides()` must never run during render — same SSR rule as ThemeToggle/useIncomeProfile.
  - `OT_CATEGORIES` no longer carries multipliers at module scope; `computeOvertimePay` resolves them from `RATES` at call time by id, otherwise OT-rate edits wouldn't take effect.

### Part 2 — Dashboard advisor

- **`lib/advisor.js` gained `buildAdvicePlan(...)`** (the original `getFreelancerTips` is untouched — the Freelancer Workbench still uses it). Given the whole profile context, it returns:
  - `actions[]` — ranked peso-valued moves: elect-the-8% (vs cheapest graduated total), keep-itemizing (OSD delta), BMBE registration (income-tax share only, gated on known assets ≤ ceiling, !vatRegistered, receipts ≤ VAT threshold, and honest about practice-of-profession exclusion), expense-headroom (₱25k example through the actual bracket math), VAT-threshold proximity/crossed/VAT-already-registered variants, bonus-envelope structuring around the 13th-month exemption (impact = spillover × marginal bracket rate), and file-on-time (a real computed 30-day-late penalty estimate as avoided cost). Sorted impact-desc, nulls last, capped at 7.
  - `walkthroughs[]` — line-by-line computation explanations per income stream (gross → deductions → taxable → per-bracket slices with the person's real numbers → other taxes → total), powered by new `explainGraduatedTable()` in `lib/freelancerTax.js`.
- **Dashboard intake expanded:** business profiles now also ask **total assets (optional)** and **already-VAT-registered**, persisted with the rest of the profile. Assets-as-blank means null ("unknown"), never 0 — that distinction drives BMBE gating.
- **UI changes** (`components/IncomeProfile.js`): new `AdvisorPlan` (ranked action cards with impact badges, tag pills, rule citations, links only where another page adds something) and `TaxWalkthrough` (bracket-slice tables) sit right under the headline stats. The "Related calculators" grid, "Cheapest legal route", and old "Recommendations" cards are GONE — the person explicitly didn't want a calculator router as the dashboard's job. Net Pay/13th-month, filing countdown, quarterly reserve, ledger, categories all kept.

### Verification performed

- `npx eslint .` — zero errors/warnings
- `npm run build` — clean, 25 routes incl. `/settings`
- A throwaway Node smoke suite (40 checks, run outside the repo against the real modules via a `@/`-resolution loader hook): bracket boundary math, route comparison totals, mixed-earner exemption suppression, live override→recompute→reset round trips, Infinity survival through clone/reset/import, import validation rejections, advisor plan composition for freelancer/business/employee scenarios, BMBE impact = income-tax-share-only. All green. Recreate it if touching `lib/taxConfig.js` or `lib/advisor.js`.

## This session: Better Auth + Neon + cloud sync (guests included)

The person approved the stack: **Vercel (deploy) + Neon (Postgres) + Better Auth** with Google, email+password, AND a guest account. Code is complete and verified (`eslint` clean, `next build` clean, 25 routes + `/login`). What remains is pure dashboard work by the person — see "Setup checklist" below; nothing in code is blocked on it except a live database.

### Architecture

- **Auth = `better-auth@1.x`**, lazy-initialized in `lib/auth.js` (`getAuth()`) because construction needs env vars that don't exist during `next build`. Same lazy pattern in `lib/db/index.js` (`getDb()` wraps `neon(DATABASE_URL)` HTTP driver + Drizzle). Route handlers resolve per-request.
- **Schema (`lib/db/schema.js`)**: Better Auth's four tables (`user` incl. `is_anonymous`, `session`, `account` w/ provider-unique index, `verification`) plus three app tables — `income_profiles` (jsonb blob, mirrors localStorage shape exactly), `rate_overrides` (jsonb), `history_entries` (client-id PK + jsonb payload). ALL reference `user.id ON DELETE CASCADE` → account deletion wipes everything.
- **Sync API** under `/api/me/*`: `GET /data` (one-shot pull of everything), `PUT /profile`, `PUT /rates`, `POST/DELETE /history`. Every route guards via `lib/session.js` (`auth.api.getSession`) and zod-validates envelope + size (never field-by-field — the server stores snapshots, never computes). History POST checks id ownership before upsert so one user can't overwrite another's row.
- **Client sync**: `components/CloudSyncManager.js` (mounted in layout, renders null) + `lib/cloudSync.js`. Events on `window`: `moneta:profile-changed` (from useIncomeProfile save effect), `moneta:rates-changed` (SettingsEditor), `moneta:history-changed` (lib/history.js, CustomEvent detail carries `{addedId|deletedId|cleared}`), `moneta:data-imported` (manager → hooks re-hydrate; TaxConfigSync re-applies overrides).
- **Merge policy (deliberate)**: profile/rates = dirty-wins (local edits not yet pushed beat remote on sign-in; otherwise remote adopts over local when different); history = union-by-id newest-first, deletes/clears forward to server via event detail so entries don't resurrect. Pushes are debounced 1s; failures stay dirty and retry on next change. No clocks consulted anywhere.
- **Guest flow**: `anonymous()` plugin server-side + `anonymousClient()` client-side (BOTH required or signIn.anonymous doesn't exist). Guest = real user row (`isAnonymous=true`); signing in later with Google/email ON THE SAME BROWSER links accounts → same user.id → all synced rows survive automatically. Nav shows a guest badge via `AccountButton`.
- Email verification is deliberately OFF (`emailAndPassword.enabled` only) — turning on `requireEmailVerification` needs a transactional mailer (Resend) first. That plus privacy/terms pages + rate-limiting review are the remaining public-launch items.

### Follow-up: auth is now the front door + History v2

- **`components/AuthGate.js`** wraps `{children}` in layout: every route except `/login` requires a session (account OR guest); signed-out visitors get the splash → redirect to `/login`; signed-in users visiting `/login` get sent home. APIs were already failing closed — this aligned the UI with the server. localStorage still mirrors everything, so offline reads work and pre-auth typing (none possible now) would have merged dirty-wins anyway.
- **`/login` redesigned** as a centered welcome screen (`.auth-shell/.auth-box/.auth-brand`): Google + guest as equal primary buttons, email form below a divider. Guest copy explains it's instant and links into a real account later.
- **History rebuilt**: filter chips per calculator name, expandable rows revealing the full saved `details` figure set (money keys via formatPHP, `*rate*` keys via formatPercent, primitives only), Export JSON, cloud-synced disclaimer. The details data was always stored — this page finally surfaces it.

### Setup checklist (the person's part — code won't run against a DB until done)

1. **Neon**: Vercel project → Storage → create Neon Postgres → copy `DATABASE_URL` into local `.env.local` AND Vercel env vars.
2. **Secret**: `openssl rand -base64 32` → `BETTER_AUTH_SECRET` (both places). Set `BETTER_AUTH_URL` to `http://localhost:3000` locally and the prod URL on Vercel.
3. **Google OAuth**: console.cloud.google.com → OAuth consent screen → Web client → Authorized redirect URI: `<BETTER_AUTH_URL>/api/auth/callback/google` (add BOTH localhost and prod lines) → put client ID/secret in `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`. Leave empty = Google button errors honestly instead of breaking anything else.
4. **Tables**: `.env.local` has DATABASE_URL → `npx drizzle-kit push`.
5. **Deploy**: `vercel --prod` (or push; Vercel auto-deploys).

### Verified working
- `npx eslint .` zero problems; `npm run build` clean (`/api/*` dynamic, `/login` static)
- Build succeeds WITHOUT any env vars set (lazy init is load-bearing — keep it)

## Previous sessions (still accurate where not superseded above)

### Bug 3 — auto-computed contributions producing nonsense for tiny inputs
`hooks/useIncomeProfile.js` errors include the explanatory message when auto-computed contributions exceed gross compensation (SSS ₱5,000 / PhilHealth ₱10,000 floors are real — missing-validation bug, not formula bug).

### Bug 4 (visual)
Never use `.stat-tile` divs with inline styles stripping card treatment — use `<StatTile>` inside `.stat-grid`.

### Local persistence + history
`lib/localStore.js` (defensive localStorage wrappers), `lib/history.js` + `SaveToHistoryButton` + `HistoryList` (capped-200 log), profile persistence in `useIncomeProfile` under `moneta:income-profile` with hydrate-after-mount gating. Live recalculation was never reverted; explicit save exists alongside it.

### Verified working
- `npm install && npx eslint . && npm run build`

## Suggested next steps

1. Wire Save-to-History into the remaining ~14 calculators (mechanical; pattern in `EmployeeTaxCalculator.js`)
2. Auth + Neon — then migrate rate overrides AND history/profile off localStorage; `/settings` export/import becomes the sharing story until then
3. Advisor extensions: quarterly cumulative-form-correct reserve (not even-split); EWT-aware net-receipts view for professionals whose clients withhold
4. If adding NEW rates, add them to `RATE_REGISTRY` (with unit/description/group) in the same commit — anything absent from the registry can't be edited and silently stays compiled-default

## How to hand this to a different LLM

Paste this file plus: "continue this project." Pay attention to (a) the hydration contract around `RATES` overrides, (b) the Infinity-in-brackets clone gotcha, and (c) the design decision that the Dashboard advises rather than routes to calculators — all three are deliberate, documented decisions, not oversights to revisit casually.
