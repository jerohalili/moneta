# Moneta Weekly Increment Report

Project: Moneta — Philippine Tax-Smart Companion
Repo: https://github.com/jerohalili/moneta
Live: https://moneta-lovat.vercel.app/
Status: Feature-complete, polish / pre-final mode.


---

## Week 1 — August 17-22, 2026: Vite prototype to Next.js rework + income profiling (8 commits)

### What changed this week

#### Base + framework rework

- Initial prototype (`1c6489b Initial commit`, `c38222f Fix formatting in README description`, `cb11498 initial: moneta`): Vite + React skeleton with `src/lib/freelancerTax.js`, `src/lib/advisor.js`, `src/pages/FreelancerCalculator.jsx`.
- Next.js rework (`caf8370 feat: reworked system`): migration of `src/*` to `lib/` + `data/`, new App Router shell (`app/layout.js`, `app/page.js`, `app/globals.css`, `app/history/page.js`), `AppNav`, `StatTile`, `ChartPlaceholder`, `next.config.mjs`, `eslint.config.mjs`.
- SaaS layout passes (`3031d4b feat: Saas layout`, `d56c03b feat: better UI`): `app/globals.css` rewritten twice (384+/1091 lines, then 452-line cleanup), deletion of `desktop-shell-color.patch` (729 lines).

#### Dashboard + income profile

- Dashboard (`1943865 feat: better dashboard`): `FreelancerWorkbench.js`, `ExpenseLedger.js`, `RouteComparison.js`, `CategoryBars.js`, `FilingCountdown.js`, `TipsList.js`, `hooks/useFreelancerTax.js`, `lib/deadlines.js`, `lib/expenseCategories.js`.
- Income profiling (`36fa7d9 feat: income profiling`): `components/IncomeProfile.js` (+187), `hooks/useIncomeProfile.js` (+157), `ProfileTypeSelector.js`, graduated-table support in `lib/employeeTax.js`, `lib/freelancerTax.js`.

### Why

- I chose engine-first with pure functions in `lib/` and no React, because I wanted bracket logic and route comparison smoke-tested before any UI existed.
- I put one shared Income Profile first to drive live recompute, because I didn't want each screen re-asking the same inputs like a calculator dump.
- I chose Next.js Route Handlers early because I wanted the whole API to deploy as Vercel serverless functions with no separate server or CORS layer.

### What broke or what I got stuck on

- **Framework-switch churn:** I got stuck on the import rewrite in `caf8370` when `src/lib` to `lib/` and `src/data` to `data/` moved plus Vite entry points were deleted in one pass, which broke anything referencing old paths until the move settled.
- **CSS rewrite thrash:** I got stuck rewriting `globals.css` twice in one day (`3031d4b`, `d56c03b`) — adding then deleting a 729-line patch file while letting styling drift per component with no token contract, which pushed me to lock the Week 4 design system.
- **Scope risk:** I rushed scope by landing dashboard and profiling the same day as the framework rework, so my review suffered and calculator coverage outpaced shared history/settings plumbing until I caught up in Week 2.

### What is left

- I closed shared rates layer, auth + persistence, history, and deploy in Week 2, plus auth hardening and guest login in Week 3.


---

## Week 2 — August 23-29, 2026: adjustable rates + auth/DB/deploy + history (14 commits)

### What changed this week

#### Calculator expansion

- First capability wave (`9718328 feat: more capabilities`, `e912b2b feat: more capabilities`, Aug 23): employee, net-pay, contributions, penalties, property, business, corporate, BMBE, EWT, mixed-income, overtime, variable-income, closure-penalty, filing-calendar, form-finder calculators, each with paired `lib/*.js` pure function and `data/taxRates2026.js` additions (1157+/1816 lines across the two commits).

#### History + offline store

- History plumbing (`1f2337d fix: better UI and UX`): `lib/history.js`, `lib/localStore.js`, `HistoryList.js`, `SaveToHistoryButton.js`, IncomeProfile persistence via `hooks/useIncomeProfile.js` (+100).
- Dashboard preview (`6e41f17 feat: minor changes`): `DashboardHistoryPreview.js`.

#### Adjustable logic

- `6c7d64c feat: adjustable logic` (2500+/274-, 32 files): `lib/taxConfig.js` (+830, registry-documented 2026 defaults), `SettingsEditor.js` (+414, per-value revert / reset-all / JSON import-export), `AdvisorPlan.js`, `TaxWalkthrough.js` (+88), `TaxConfigSync.js`, `useTaxRatesVersion.js`; every `lib/*.js` switched to read the mutable live layer.

#### Auth + database + deploy

- `65ff7df feat: add auth, database and deploy` (6595+/3559-): Better Auth (Google, email, guest/anonymous) via `lib/auth.js`, Neon + Drizzle (`lib/db/schema.js`, `lib/db/index.js`, `drizzle.config.js`), sync APIs (`app/api/auth/[...all]/route.js`, `app/api/me/data|history|profile|rates/route.js`), `CloudSyncManager.js`, `lib/cloudSync.js`, `LoginForm.js` (+155), `.env.example`.
- Auth UI (`2193040 fix: auth page`): `AuthGate.js`, login page restyle, `HistoryList.js` expansion (+170).
- History-everywhere (`26fc224 fix: history button`): Save-to-History wired into all 21 calculators, `AccountButton.js` rework (+93).

#### Calculators + docs

- New calculators (`410bcc2 feat: new and better calculators`, 1711+/58-, 21 files): rental (`lib/rentalIncome.js`), passive-income final taxes (`lib/passiveIncome.js`), 1701Q quarterly worksheet (`lib/quarterlyTax.js`, `QuarterlyTaxCalculator.js` +206), multi-employer/OFW/SMWE profile branches in `IncomeProfile.js` (+255) and `hooks/useIncomeProfile.js` (+209), advisor expansion (`lib/advisor.js` +230).
- Polish + docs (`180f383`, `0f1e611`, `e8611a6`, `87c300a`, `6283571 feat: update readme`): removal of completed roadmap from `app/page.js`, rewrite of `README.md` (+175) with engine-first build order.

### Why

- I put every figure in a registry I can edit at `/settings` instead of hardcoded constants, because I wanted rates to survive government changes without a redeploy.
- I put auth + merge-based cloud sync first (unsent local edits win on sign-in, history merges by id), because I knew offline-first was only a claim without it.
- I added rental, passive-income, and quarterly calculators to close my biggest coverage gaps for freelancers and landlords deciding on the 8% election.

### What broke or what I got stuck on

- **Auth shape mismatch:** I got stuck on first deploy when the local session shape vs Neon `user` table (`is_anonymous` column) did not agree, so I had to settle it with my Week 3 Google/guest fix loops (`lib/auth.js`, `lib/db/schema.js`).
- **Advisor rename debt:** I left rename debt when expanding `buildAdvicePlan()` by 230 lines in `410bcc2` with generic variable names, which I only cleaned up in my Week 5 streamline.
- **Large-commit review cost:** I chose large commits touching 30+ files in `65ff7df` and `6c7d64c`, which hid regressions so I needed my follow-up `26fc224` the same night for the history button.

### What is left

- I closed Google/guest sign-in hardening, redirect middleware, favicon and overflow fixes in Week 3, plus the design-system lock in Week 4.


---

## Week 3 — August 30 - September 5, 2026: auth hardening + favicon churn (20 commits)

### What changed this week

#### Google auth fixes

- Auth loop (`92a0441 fix: remove redundancy`, `7a04c13 fix: button login style`, `836473c fix: google login`, `d49ce31 fix: google auth`, `e4da714 fix: working google auth`): trim of `app/api/auth/[...all]/route.js` (13 lines, -9), hardening of `lib/auth.js` (+38), fix of `lib/db/schema.js` anonymous-column mapping.

#### Favicon + theme

- Favicon churn (`b772300`, `3678114`, `ec2bb6d`, `328538b`, `b9b2202`): svg to ico flip-flops between `public/favicon.svg` and `app/favicon.ico`, ending on restored `public/favicon.svg` (+22) with tab title simplified to `Moneta` in `app/layout.js`.
- Theme button (`91e15e8 fix: better theme button`): `ThemeToggle.js` + `AuthGate.js` guard for pre-paint render without flash.

#### Redirects + guest login

- Redirects (`2410bf2 fix: redirects`): new `middleware.js` (+24), `AuthGate.js` simplification (-24/+8), `CloudSyncManager.js` sync-path fix.
- Guest loop (5 attempts: `0ef238e`, `02d3afa`, `0ff7ba5 fix: revert not working solution`, `e3060cf fix: guest login cookie`, `bd533e5 fix: guest login`): `components/LoginForm.js` rework from optimistic guest tap to cookie-aware flow, ending at 7+/20- net.

#### Spacing + docs + overflow

- `c54e382 feat: consistent page spacing` (`app/globals.css`, `IncomeProfile.js`), `b52cedc fix: update documentation` (`README.md`), `3d3020f fix: fix account overflow bug` (`app/globals.css` +5).

### Why

- I put lossless guest-to-Google/email upgrade first (same `user.id` cascade deletes), because I wanted the one-tap guest path to set cookies and survive middleware redirects.
- I fixed favicon and theme-toggle first even though they were small, because I knew a broken tab icon and a flashing theme on load reads as an unfinished product.

### What broke or what I got stuck on

- **Guest-login loop:** I got stuck on guest login for 2 days across 5 fixes, including one revert I had to make (`0ff7ba5`): my first attempts set the session without a usable cookie, so my guests bounced straight back to login (`components/LoginForm.js`).
- **Google-auth loop:** I got stuck on Google auth for a day across 5 fixes — breaking route handler shape, button wiring, and schema column in turn (`lib/auth.js`, `app/api/auth/[...all]/route.js`, `lib/db/schema.js`).
- **Favicon churn:** I got stuck flipping svg vs ico paths across 5 commits in 5 hours (`b772300`, `3678114`, `ec2bb6d`, `328538b`, `b9b2202`) when I hit competing `app/favicon.ico` vs `public/favicon.*` conventions in Next.js.
- **Account overflow:** I fixed long email/account strings overflowing the account menu on narrow screens by adding a 5-line CSS clamp in `app/globals.css` (`3d3020f`).

### What is left

- I closed the design-system lock in Week 4 to stop my per-component CSS drift, plus lib cleanup in Week 5.


---

## Week 4 — September 6-12, 2026: design system (2 commits)

### What changed this week

- `9e759d0 feat: design system` — new `DESIGN-SYSTEM.html` (+1021 lines): ledger-minimalist tokens (`--paper`, `--ink`, `--accent`), glass cards via `rgba(var(--glass-rgb), a)`, radial-gradient page wash, `data-theme` dark/light contract, touch-sized nav targets, table-scroll rules.
- `08a7680 feat: update design system` (48+/78-) — condensation of verbose sections into compact code blocks.

### Why

- I chose to lock spacing, theme, and component states in one file after three weeks of my per-component CSS fixes, because I wanted every screen checkable against a single contract before the final.

### What broke or what I got stuck on

- First spec was too long, so I cut 78 lines in 08a7680 the same week.

### What is left

- I put consistency application plus lib streamline into Week 5, leaving only final prod verification after that.


---

## Week 5 — September 13-19, 2026: consistency + lib streamline (2 commits)

### What changed this week

- `229b2be fix: design system consistency` — in `DESIGN-SYSTEM.html` (28+/20-): token and component-state wording aligned with `app/globals.css`.
- `902d0ed fix: streamline lib files` (233+/438-, 34 files): strip of stale header comments from every `lib/*.js`, slim of `data/taxRates2026.js` (-17), fix of `EmployeeTaxCalculator.js` display logic, shared `hooks/useNumericInput.js` (+10), cleanup of `hooks/useIncomeProfile.js`, `hooks/useFreelancerTax.js`, `lib/advisor.js` (-66/+44 net deletions), `lib/freelancerTax.js`, `lib/taxConfig.js`.

### Why

- I chose to remove ~438 lines of dead comments and duplicated numeric-input parsing so my engine reads as one style, keeping a single `useNumericInput` hook to stop per-calculator input drift.
- I kept `RATES` hydration-safe (SSR and first paint agree; overrides apply after mount) while shrinking the code around it.

### What broke or what I got stuck on

- Week 5 was a small pass on purpose; the risk was touching 34 files in 902d0ed, so I need a clean build + lint + bracket-boundary check.

### What is left

- Prod check left on moneta-lovat: guest-to-Google/email link keeping history and rates, plus a last responsive pass. Nothing blocking.
