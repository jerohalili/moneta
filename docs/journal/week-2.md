# Moneta - Week 2

## Week of: August 23-29, 2026

## My goal this week

Expand calculator coverage, make rates editable without redeploys, and make offline-first real with auth, database, and cloud sync.

## What I did

- I shipped the first capability wave (`9718328`, `e912b2b`): employee, net-pay, contributions, penalties, property, business, corporate, BMBE, EWT, mixed-income, overtime, variable-income, closure-penalty, filing-calendar, and form-finder calculators, each with a paired `lib/*.js` function and `data/taxRates2026.js` additions.
- I wired history plumbing (`1f2337d`): `lib/history.js`, `lib/localStore.js`, `HistoryList.js`, `SaveToHistoryButton.js`, IncomeProfile persistence, plus `DashboardHistoryPreview.js` (`6e41f17`).
- I built adjustable logic (`6c7d64c`, 2500+/274- across 32 files): `lib/taxConfig.js` (+830 with 2026 defaults), `SettingsEditor.js` (+414 with per-value revert, reset-all, JSON import-export), `AdvisorPlan.js`, `TaxWalkthrough.js`, `TaxConfigSync.js`, `useTaxRatesVersion.js`. Every `lib/*.js` now reads the mutable live layer.
- I landed auth + database + deploy (`65ff7df`, 6595+/3559-): Better Auth (Google, email, guest/anonymous) via `lib/auth.js`, Neon + Drizzle (`lib/db/schema.js`, `lib/db/index.js`, `drizzle.config.js`), sync APIs (`app/api/auth/[...all]/route.js`, `app/api/me/data|history|profile|rates/route.js`), `CloudSyncManager.js`, `lib/cloudSync.js`, `LoginForm.js`, `.env.example`.
- I reworked auth UI (`2193040`): `AuthGate.js`, login restyle, expanded `HistoryList.js`.
- I wired Save-to-History into all 21 calculators (`26fc224`) and reworked `AccountButton.js`.
- I added rental, passive-income, and quarterly calculators (`410bcc2`, 1711+/58- across 21 files) with multi-employer, OFW, and SMWE profile branches, plus advisor expansion and README rewrite (`180f383`, `0f1e611`, `e8611a6`, `87c300a`, `6283571`).

## What blocked me

- On first deploy the local session shape and the Neon `user` table (`is_anonymous` column) disagreed, which I only settled in the Week 3 Google/guest fix loops.
- I left rename debt expanding `buildAdvicePlan()` by 230 lines with generic variable names, cleaned up only in Week 5.
- My huge commits touching 30+ files hid regressions, so I needed a same-night follow-up (`26fc224`) for the history button.

## What I learned

- Every figure belongs in an editable registry at `/settings` instead of hardcoded constants, so rates survive government changes without a redeploy.
- Auth plus merge-based cloud sync (unsent local edits win on sign-in, history merges by id) has to come early, or offline-first is just a claim.
- Big commits feel fast but cost review. Smaller landings would have caught the history-button regression sooner.
