# AI-USAGE — Moneta

Started week 1, kept alongside work. Full 6 + 3 + who-wrote-what for finals badge; this is the current log.

## 1. How I used AI

- 2026-08-17, Claude — Vite → Next.js App Router migration plan (`app/layout.js`, `page.js`, `globals.css`). Kept shell, rewrote CSS twice after drift. Commit [`caf8370`](https://github.com/jerohalili/moneta/commit/caf83708472690ddb9de08a4bc874b8fbce096c9).
- 2026-08-22, Claude — income profiling (`IncomeProfile.js`, `useIncomeProfile.js`, graduated table). Kept engine-first pure `lib/` fns. Commit [`36fa7d9`](https://github.com/jerohalili/moneta/commit/36fa7d9ea9b4bc33913534c3cd4c59694a277d3e).
- 2026-08-23, Copilot — 15-calculator expansion (paired `lib/*.js` + wrappers). Kept primitives, split personal/payroll/business/property. Commits [`9718328`](https://github.com/jerohalili/moneta/commit/97183282911f6295826a6a38d6fb372b3a5c4f49), [`e912b2b`](https://github.com/jerohalili/moneta/commit/e912b2b034226916042a8e2f4eb225fd5a26be47), [`410bcc2`](https://github.com/jerohalili/moneta/commit/410bcc245b4c1e778acdef74bbb5dd994723b410).
- 2026-08-24, Claude — adjustable rates registry (`lib/taxConfig.js` + `SettingsEditor.js`). Kept registry + hydration contract, trimmed comments later. Commit [`6c7d64c`](https://github.com/jerohalili/moneta/commit/6c7d64cccf1fd9f5c3050a7da00b6efa768b9680).
- 2026-08-25, Claude — Better Auth + Neon/Drizzle + `/api/me/*` sync APIs + merge policy. Kept shape, hardened auth over Week 3. Commit [`65ff7df`](https://github.com/jerohalili/moneta/commit/65ff7dfc9ead83b6bf3f22ba7cecfd2eee9e9fd0).
- 2026-09-19, Claude — README 1–7 + SECURITY-CHECKLIST wording. Kept structure, evidence in own words. Commit [`a936bff`](https://github.com/jerohalili/moneta/commit/a936bff183398afb465a0d8f0814a879b56cab2f).
- 2026-09-20–26 (Week 6) — no new AI prompts logged. Screenshots + caption cleanup + portfolio case-study assembly done by hand; no code changes.

## 2. Where the AI got it wrong

- Auth shape mismatch (local session vs Neon `is_anonymous` column) broke first deploy; fixed with schema + `lib/auth.js` hardening. Commit [`65ff7df`](https://github.com/jerohalili/moneta/commit/65ff7dfc9ead83b6bf3f22ba7cecfd2eee9e9fd0) (Week-3 auth loop).
- Guest login set session without usable cookie (bounced to login); fixed with cookie-aware flow after 5 attempts + 1 revert ([`0ff7ba5`](https://github.com/jerohalili/moneta/commit/0ff7ba55c643e945554e605dfc420633c358c04e)). Week 3.
- Favicon svg-vs-ico flip-flop (5 commits in 5 hours) from competing Next.js conventions; settled on `public/favicon.svg`. Commit [`b9b2202`](https://github.com/jerohalili/moneta/commit/b9b2202920e427d4aa71bde630ec52c627f3a637) (Week 3).

## 3. Who wrote what

- I wrote: `lib/advisor.js` `buildAdvicePlan()` ranking + citations (commit [`410bcc2`](https://github.com/jerohalili/moneta/commit/410bcc245b4c1e778acdef74bbb5dd994723b410)), `hooks/useIncomeProfile.js` live-recompute engine (commit [`36fa7d9`](https://github.com/jerohalili/moneta/commit/36fa7d9ea9b4bc33913534c3cd4c59694a277d3e)), `lib/taxConfig.js` hydration-safe `RATES` layer (commit [`6c7d64c`](https://github.com/jerohalili/moneta/commit/6c7d64cccf1fd9f5c3050a7da00b6efa768b9680)), merge sync (`lib/cloudSync.js`, `CloudSyncManager.js`, commit [`65ff7df`](https://github.com/jerohalili/moneta/commit/65ff7dfc9ead83b6bf3f22ba7cecfd2eee9e9fd0)). Pure-fn bracket logic validated before UI.
- Best-understood AI piece: `middleware.js` fail-closed gate + `lib/session.js` 401 helper — checks `moneta.*` cookie, allows only `/login` + `/api/auth`, everything else redirects; I kept it because offline-first means nothing without a gate.
