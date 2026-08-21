# Moneta

Free Philippine tax calculators with a rule-based advisor that flags legal ways to lower what you owe. A tool to make basic tax literacy free and accessible for everyone.

## Stack

- **Next.js** (App Router) — chosen so the same codebase can later host auth and database-backed API routes without a separate backend service
- **Neon (Postgres)** — planned for the Shared Income Profile and calculator history (not wired up yet)
- **Auth.js** — planned for user accounts (not wired up yet)
- Deployed on **Vercel**

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/
  page.js                     Dashboard (home route)
  calculators/freelancer/     Freelancer tax calculator route
  layout.js                   Root layout: fonts, nav shell
  globals.css                 Design system (ledger aesthetic)
components/
  AppNav.js                   Site navigation
  FreelancerCalculator.js     Freelancer calculator UI
lib/
  freelancerTax.js            Pure tax computation functions
  advisor.js                  Rule-based advisory tips, cited to BIR rules
data/
  taxRates2026.js             BIR figures for tax year 2026 — verify before reuse in a new tax year
```

## Roadmap

See the project scope doc for the full milestone list. Next up: Shared Income Profile data model + auth.
