# Moneta | Philippine Tax-Smart Companion

[![Made with AI](https://img.shields.io/badge/Made_with-AI_assistance-blue)](AI-USAGE.md)

> Built with AI assistance (Claude + Copilot) across engine scaffolding, calculator expansion, and copy polish; see [AI-USAGE.md](AI-USAGE.md) for the full log.

**Repo:** https://github.com/jerohalili/moneta
**Live:** https://moneta-lovat.vercel.app/

> ⚠️ Moneta provides general tax **information**, not personalized professional advice. Simple cases only; complex ones still belong with a CPA.

---

## 1. Overview

Moneta is a full-stack web app for Filipino freelancers, sari-sari store owners, and small operators asking *am I paying more tax than I legally have to?* You build one Income Profile — how you earn, what you make, what you spend — and it live-computes every tax you owe, when it's due, and a ranked peso-valued plan of legal moves that lower the bill, each cited to its regulation in plain language.

**Core philosophy:** *A decision engine, not a calculator dump.* One profile drives live recompute + advisor; 21 standalone calculators cover focused what-ifs.

Technologies: Next.js 16 App Router + React 19 (Route Handlers, no separate server), Better Auth (Google/email/guest), PostgreSQL on Neon via Drizzle ORM, plain-CSS ledger-minimalist design system.

---

## 2. Setup and installation

### Prerequisites

- Node.js 18+
- A Postgres database (Neon recommended)
- Optional: Google Cloud OAuth 2.0 Web client (for Google sign-in; app works without it via guest/email)

### 2.1 Get the code

```bash
git clone https://github.com/jerohalili/moneta.git
cd moneta
```

### 2.2 Install dependencies

```bash
npm install
```

### 2.3 Environment and configuration

```bash
cp .env.example .env.local
```

| Variable | Required | Example value | Notes |
|----------|----------|---------------|-------|
| `DATABASE_URL` | Yes | `postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require` | Neon connection string. App needs a real one to run (build succeeds without it via lazy init). |
| `BETTER_AUTH_SECRET` | Yes | `openssl rand -base64 32` output, e.g. `XyZ…32chars…==` | Session signing secret. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | Yes | `http://localhost:3000` locally; `https://moneta-lovat.vercel.app` on Vercel | Public app URL. |
| `AUTH_GOOGLE_ID` | No | `123…apps.googleusercontent.com` | From Google Cloud Console → Credentials → OAuth Web client. Leave empty to disable Google (guest/email still work). |
| `AUTH_GOOGLE_SECRET` | No | `GOCSPX-…` | Same as above. Register redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://<prod>/api/auth/callback/google`. |

Never commit real values — `.env.local` is gitignored.

### 2.4 Create the tables

```bash
npx drizzle-kit push
```

Pushes `lib/db/schema.js` (Better Auth 4 tables + `income_profiles, rate_overrides, history_entries`, all `user.id ON DELETE CASCADE`). For production, run against the production `DATABASE_URL`.

---

## 3. How to run it

```bash
npm run dev
```

Open http://localhost:3000. Fastest entry: one-tap guest account — everything works, linking Google/email later keeps data (same `user.id`).

Deploy: Vercel + same env vars (`BETTER_AUTH_URL` = production URL), then `npx drizzle-kit push` against production DB.

---

## 4. Features and usage

Primary flow: **Income Profile once → live results + advisor + walkthrough → standalone calculators → history → settings.**

- **Nine taxpayer profiles (Dashboard `/`):** employee, multi-employer (1700 underwithholding estimate), minimum-wage (RA 9504 regional), OFW/non-resident (foreign income recorded, never taxed), freelancer/professional, sole proprietor (8% vs graduated, OSD vs itemized), mixed (RR 8-2018 ₱250k rule), corporation/OPC (CREATE RCIT/MCIT), estate/trust. Contributions, net pay, 13th-month auto-compute; no Calculate button.
- **Rule-based advisor:** ranked peso-valued actions (8% election, BMBE gating, OSD vs itemized, ₱90k bonus envelope, VAT-threshold timing) with citations (NIRC, TRAIN, CREATE, RA 9178, RRs).
- **Line-by-line walkthroughs:** gross → deductions → taxable → bracket slices → total per stream.
- **21 standalone calculators** (`/calculators`, independent state, not reading the profile): freelancer, employee, variable-income, mixed, rental, passive-income; net-pay, 13th-month, overtime, contributions; corporate, VAT/percentage, BMBE, sole-prop-vs-corp, EWT; property transfer (5 modes); penalties, closure-penalty, filing-calendar; form-finder, 1701Q worksheet.
- **Editable rates (`/settings`):** every figure in `lib/taxConfig.js` registry, per-value revert/reset/JSON import-export. Survives rate changes without redeploy.
- **Offline-first + sync:** `localStorage` mirror, window-event pushes, merge policy (unsent local wins on sign-in, history merge-by-id). Guest→Google/email upgrade preserves rows.
- **History (`/history`):** full-figure snapshots, filter chips, expandable rows, JSON export. Filing countdown + calendar + form finder. Dark/light theme + responsive.

### Main API endpoints (Next.js Route Handlers; all `me/*` require session → 401)

| Method | Path | What it does |
|--------|------|--------------|
| GET+POST | `/api/auth/[...all]` | Better Auth handler (Google, email, guest/anonymous) |
| GET | `/api/me/data` | One-shot sync: `{profile, rates, history≤500}` |
| PUT | `/api/me/profile` | Upsert income-profile blob (Zod, 300KB cap) |
| PUT | `/api/me/rates` | Upsert rate overrides (100KB cap) |
| POST/DELETE | `/api/me/history` | Save entry (50KB, ownership-checked, 409) / delete one or all |
| DELETE | `/api/me/account` | Delete user (cascade wipes profile/rates/history) |

---

## 5. Project structure

```
moneta/
  app/                  # Next.js App Router: layout.js, page.js (Dashboard), login/, history/, settings/, calculators/[21]/, api/
  app/api/auth/[...all]/route.js
  app/api/me/{data,profile,rates,history,account}/route.js
  components/           # ~35: IncomeProfile, AdvisorPlan, TaxWalkthrough, ExpenseLedger, FilingCountdown/Calendar, FormFinder, CloudSyncManager, AuthGate, SaveToHistoryButton, per-calculator wrappers
  lib/                  # pure fns (no React): employeeTax, freelancerTax, mixedIncomeTax, corporateTax, rentalIncome, passiveIncome, quarterlyTax, netPay, contributions, propertyTax, penalties, advisor (buildAdvicePlan), taxConfig (live RATES), auth, session, cloudSync, localStore, history, db/
  hooks/                # useIncomeProfile (dashboard engine), useFreelancerTax, useNumericInput, useTaxRatesVersion
  data/taxRates2026.js  # hand-verified 2026 defaults
  lib/db/schema.js      # Better Auth 4 + 3 app tables
  drizzle.config.js     # reads DATABASE_URL / .env.local
  middleware.js         # fail-closed: PUBLIC /login + /api/auth only, else 302 /login
```

---

## 6. Screenshots

> Captured from the live site (`moneta-lovat.vercel.app`) on Sep 23, 2026.

![Dashboard](docs/screenshots/tax-snapshot.jpeg)
*Tax Snapshot dashboard — Income Profile with live stats, bracket breakdown, action plan, and history.*

![Calculators](docs/screenshots/calculators.jpeg)
*Calculator gallery — every calculator recomputes live as you type.*

![Sign in](docs/screenshots/signin.jpeg)
*Sign in — Google, guest pass, or email; guests upgrade losslessly to Google/email.*

---

## 7. Known issues and next steps

- Prod check left on `moneta-lovat`: guest→Google/email link preserving history + rates, plus last responsive pass. Nothing blocking.
- `dev-only-insecure-secret` fallback in `lib/auth.js` is non-prod only by intent — documented, not a prod path.
- Referenced `CONTINUE.md` (Google redirect-URI guide) is not in the repo; redirect URIs are listed in §2.3 above.
- Next: align auth error copy, keep bracket-boundary smoke tests green after lib streamlines, verify build+lint clean.

---

## License

See [LICENSE](https://github.com/jerohalili/moneta/blob/main/LICENSE) (MIT).
