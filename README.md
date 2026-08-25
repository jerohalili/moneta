# Moneta | Philippine Tax-Smart Companion

## Short Introduction

Moneta is a full-stack web app that answers one specific question millions of Filipino freelancers, sari-sari store owners, and small business operators get stuck on: *am I paying more tax than I legally have to?*

Instead of another jargon-filled BIR explainer, Moneta asks you to build your **Income Profile** once — how you earn, what you make, what you spend on the business — and computes everything from it live: every tax you owe, when it's due, and a ranked, peso-valued plan of legal moves that lower the bill. Every recommendation cites the exact regulation it stands on (NIRC sections, TRAIN, CREATE, RA 9178, BIR Revenue Regulations) in plain language, not accountant-speak.

**Core Philosophy:** *A decision engine, not a calculator dump.* Individual calculators are views onto one shared profile — the Dashboard advises rather than routes you between isolated forms.

The project also exists as a practice ground for real-world concerns: a rule engine where every suggestion must be defensible to a citation, a per-user rate-override layer that survives government rate changes without a redeploy, offline-first persistence with merge-based cloud sync, and a hydration-safe live-recompute architecture.

> ⚠️ Moneta provides general tax **information**, not personalized professional advice. It covers simple cases; complex ones still belong with a CPA.

---

## Live Website

**Website:** <https://moneta-lovat.vercel.app/>

---

## Technologies Used

### Frontend

- Next.js 16 (App Router) + React 19
- Plain CSS design system (`app/globals.css`) — a "ledger-minimalist" aesthetic built on CSS custom properties (`--paper`, `--ink`, `--accent`), glass cards via `rgba(var(--glass-rgb), a)` layering, and a radial-gradient page wash. No Tailwind by choice: one design language, zero utility-class noise
- Dark / light theme via a `data-theme` attribute on `<html>`, persisted to `localStorage`, with a pre-paint inline script so returning dark-mode visitors never see a flash
- Typography via `next/font`: Fraunces (display), IBM Plex Mono (figures), Inter (body)

### Backend

- Next.js Route Handlers — the entire API is serverless functions on Vercel; no separate server process
- [Better Auth](https://better-auth.com) — Google OAuth, email + password, and one-tap **guest accounts** (anonymous plugin). Lazily initialized (`getAuth()`) because construction needs env vars that don't exist at build time
- Zod — every sync endpoint validates the envelope and payload size (the server stores client-shaped snapshots; it never computes with them)

### Database

- PostgreSQL on [Neon](https://neon.tech), accessed through `@neondatabase/serverless` over the HTTP driver
- Drizzle ORM, schema-pushed with `drizzle-kit`
- Core tables: Better Auth's four (`user` with `is_anonymous`, `session`, `account`, `verification`) plus three app tables — `income_profiles`, `rate_overrides`, `history_entries` — all referencing `user.id ON DELETE CASCADE`, so deleting an account wipes everything in one cascade

### Dev Tools

- ESLint (`eslint-config-next`)
- drizzle-kit (schema push; reads `.env.local` directly, no dotenv dependency)

---

## Features

### Nine Taxpayer Profiles — One Source of Truth

The Income Profile isn't a form; it's the engine's input. Pick who you are and it orchestrates everything:

- **Employee** (single employer, substituted filing)
- **Employee with multiple employers** — estimates the *underwithholding balance* you'll owe when filing BIR Form 1700, since each employer withholds against their own salary alone
- **Minimum wage earner** — the statutory minimum-wage exemption (RA 9504) applied regionally; only the excess is taxed
- **OFW / non-resident citizen** — foreign-source income recorded but never computed (NIRC Sec. 23)
- **Freelancer / professional** and **sole proprietor** — 8% flat election vs. graduated, OSD vs. itemized
- **Mixed earner** — applies RR 8-2018: the ₱250k exemption is consumed by compensation, so it's suppressed on the business side
- **Corporation / OPC** — CREATE Act RCIT (25% / 20% small-rate test) with MCIT from year 4
- **Estate or trust** — graduated table per NIRC Sec. 60, with the 35%-on-accumulation warning

This improves:
- Accuracy — contributions, net pay, and 13th-month pay auto-compute from the same figure instead of being retyped per calculator
- Coverage — the profiles most tools ignore (multi-employer, SMWE, OFW, estates) are first-class

### 21 Live Calculators

Personal income (employee, freelancer, mixed, variable income, rental with the 8% election), payroll & benefits (net pay, 13th month, overtime, SSS/PhilHealth/Pag-IBIG contributions), business (VAT & percentage tax, corporate, EWT, BMBE savings, sole-prop-vs-corp), property & transfer (capital gains, documentary stamp, real property, estate, donor's), penalties (surcharges, closure penalty), and filing tools (filing calendar, form finder, 1701Q quarterly worksheet). Every calculator recomputes as you type — there is no "Calculate" button anywhere in the app.

### Rule-Based Optimization Advisor with Citations

The advisor evaluates the whole profile against codified BIR rules and returns ranked, peso-valued actions: elect the 8% (vs. the cheapest graduated total), register as a BMBE (income-tax share only, honestly gated), keep itemizing vs. take the OSD, structure bonuses inside the ₱90k 13th-month envelope, VAT-threshold proximity timing, and more. Every action names the rule it stands on.

This improves:
- Trust — nothing is suggested that can't be traced to a provision
- Actionability — each flag says what to *do* and what it's worth in pesos

### Line-by-Line Tax Walkthroughs

For each income stream, a table shows exactly how the tax was built: gross → deductions → taxable → each bracket slice with your real numbers → other taxes → total. After reading it, the brackets aren't a mystery anymore.

### User-Editable Rates & Logic

`lib/taxConfig.js` wraps hand-verified 2026 defaults in a mutable live layer. Every figure — brackets, contribution tables, multipliers — is registry-documented (unit, group, teaching description) and editable at `/settings` with per-value revert, reset-all, and JSON export/import. When the government changes a rate, users adapt the app themselves — no admin panel, no redeploy.

### Offline-First Persistence + Cloud Sync

Everything mirrors to `localStorage` and syncs to Postgres for signed-in users via window-event-driven pushes with a deliberate merge policy: unsent local edits win on sign-in, history merges by id (newest first, deletes forward). Guests get a real account instantly and can link Google/email later — every synced row carries over because it references the same `user.id`.

### Calculator History

Every calculator has Save-to-History. The History page stores full figure snapshots (not just totals), with filter chips per calculator, expandable rows showing every saved figure in plain English, and JSON export.

### Filing Countdown & Compliance Tools

A live countdown to the next deadline for your profile type (individual, corporate, or estate/trust sets), a full-year filing calendar, and a question-driven BIR form finder.

### Dark / Light Theme + Responsive Design

Manual theme toggle persisted per browser, and a responsive pass across breakpoints — stacked centered nav with touch-sized targets on phones, grids that collapse, tables that scroll instead of overflowing.

---

## Development Process (How It Was Built and Why)

### Why I Built It

Most Philippine tax content online is either a static BIR page written in legal prose or a CPA's article that assumes you already know what "OSD" means. Neither helps a freelancer with a blank invoicing template decide whether the 8% election will actually save them money this year.

I wanted to build something that treats tax the way it actually works for simple cases: as a small set of facts (how you earn, what you make, what you spend) that mechanically determine your options — and that surfaces the legal moves most people never hear about, with the citation to back each one.

### Build Order

The project was built engine-first, deliberately, because the riskiest unknowns — live recalculation from one shared profile, and a rule engine where every output needs a citation — live in the logic, not the UI:

1. **Pure computation libraries first.** Every tax computation is a pure function in `lib/` with no React, validated with bracket-boundary and route-comparison smoke tests before any interface existed.
2. **Calculator suite, staged.** Personal income → payroll → business → property/transfer → penalties → filing tools, each reusing the same primitives (graduated table, route comparison).
3. **Shared Income Profile.** The Dashboard became the single input surface that orchestrates every computation automatically, replacing per-calculator retyping.
4. **Advisor engine.** A static tips list was replaced by `buildAdvicePlan()` — ranked, peso-valued, citation-backed actions plus line-by-line walkthroughs generated from the user's actual figures.
5. **Editable rates layer.** A registry-backed override store with a hydration contract (`RATES` starts identical to defaults so SSR and first paint agree; overrides apply after mount and notify subscribers), including documented gotchas like `Infinity` bracket bounds surviving JSON round-trips.
6. **Auth + persistence.** Better Auth with Google, email, and guest accounts; Neon via Drizzle; a sync API under `/api/me/*`; and merge-based cloud sync so the app works fully offline.
7. **Taxpayer expansion.** The profile grew from 4 types to 9 — multi-employer (with 1700 balance estimation), minimum wage earners, OFWs, corporations, estates/trusts — plus new calculators for rental income, passive-income final taxes, and the cumulative 1701Q worksheet.
8. **Polish passes.** Responsive design fixes, stale roadmap copy removal, input-first information architecture (the write-off ledger moved above the results it feeds), and lint/build/smoke-test verification at every step.

---

## Setup Instructions

### Prerequisites

- Node.js 18+
- A [Neon](https://neon.tech) Postgres database (or any Postgres instance — point `DATABASE_URL` at it)
- Optional, for Google sign-in: a Google Cloud OAuth 2.0 Web client

### 1. Clone the repo

```
git clone https://github.com/jerohalili/moneta.git
cd moneta
```

### 2. Install dependencies

```
npm install
```

### 3. Configure environment

```
cp .env.example .env.local
```

Fill in:

- `DATABASE_URL` — your Neon connection string
- `BETTER_AUTH_SECRET` — generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` — `http://localhost:3000` locally; your production URL on Vercel
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from Google Cloud Console (Credentials → OAuth client → Web application). Add both redirect URIs: `http://localhost:3000/api/auth/callback/google` and `https://your-domain/api/auth/callback/google`. Leave empty to disable Google sign-in — the button degrades gracefully and guest/email still work.

The build intentionally succeeds with **no** env vars set (lazy initialization is load-bearing), but the app needs a real `DATABASE_URL` to run.

### 4. Create the tables

```
npx drizzle-kit push
```

### 5. Run it

```
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The fastest way in is the one-tap guest account — everything works, and linking a real account later keeps your data.

### Deploying

Deploy to Vercel and set the same environment variables there (`BETTER_AUTH_URL` must be the production URL). Push the schema to your production database with `npx drizzle-kit push` against the production `DATABASE_URL`.

---

## License

See [LICENSE](https://github.com/jerohalili/moneta/blob/main/LICENSE) (MIT) for details.
