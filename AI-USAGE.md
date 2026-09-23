# AI-USAGE — Moneta

Started week 1, kept alongside work. Full 6 + 3 + who-wrote-what for finals badge; this is the current log.

## 1. How I used AI

- 2026-08-17, Claude — Vite → Next.js App Router migration plan (`app/layout.js`, `page.js`, `globals.css`). Kept shell, rewrote CSS twice after drift. Commit `caf8370`.
- 2026-08-22, Claude — income profiling (`IncomeProfile.js`, `useIncomeProfile.js`, graduated table). Kept engine-first pure `lib/` fns. Commit `36fa7d9`.
- 2026-08-23, Copilot — 15-calculator expansion (paired `lib/*.js` + wrappers). Kept primitives, split personal/payroll/business/property. Commits `9718328`, `e912b2b`, `410bcc2`.
- 2026-08-24, Claude — adjustable rates registry (`lib/taxConfig.js` + `SettingsEditor.js`). Kept registry + hydration contract, trimmed comments later. Commit `6c7d64c`.
- 2026-08-25, Claude — Better Auth + Neon/Drizzle + `/api/me/*` sync APIs + merge policy. Kept shape, hardened auth over Week 3. Commit `65ff7df`.
- 2026-09-19, Claude — README §§1–7 + SECURITY-CHECKLIST wording. Kept structure, evidence in own words. Commit (this change).

## 2. Where the AI got it wrong

- Auth shape mismatch (local session vs Neon `is_anonymous` column) broke first deploy; fixed with schema + `lib/auth.js` hardening across 5 Google-auth commits. Week-3 loop.
- Guest login set session without usable cookie (bounced to login); fixed with cookie-aware flow after 5 attempts + 1 revert (`0ff7ba5`). Week 3.
- Favicon svg-vs-ico flip-flop (5 commits in 5 hours) from competing Next.js conventions; settled on `public/favicon.svg`. Week 3.

## 3. Who wrote what

- I wrote: `lib/advisor.js` `buildAdvicePlan()` ranking + citations, `hooks/useIncomeProfile.js` live-recompute engine, `lib/taxConfig.js` hydration-safe `RATES` layer, merge sync (`lib/cloudSync.js`, `CloudSyncManager.js`). Pure-fn bracket logic validated before UI.
- Best-understood AI piece: `middleware.js` fail-closed gate + `lib/session.js` 401 helper — checks `moneta.*` cookie, allows only `/login` + `/api/auth`, everything else redirects; I kept it because offline-first means nothing without a gate.
