# Moneta - Week 1

## Week of: August 17-22, 2026

## My goal this week

Get the tax engine right first, then give it a real app shell: rework the prototype into Next.js and land income profiling with live recompute.

## What I did

- I started with a Vite + React skeleton (`1c6489b`, `c38222f`, `cb11498`) holding `src/lib/freelancerTax.js`, `src/lib/advisor.js`, and `src/pages/FreelancerCalculator.jsx`.
- I reworked everything into Next.js (`caf8370`): moved `src/*` to `lib/` + `data/`, built the App Router shell (`app/layout.js`, `app/page.js`, `app/globals.css`, `app/history/page.js`), plus `AppNav`, `StatTile`, `ChartPlaceholder`, `next.config.mjs`, `eslint.config.mjs`.
- I did SaaS layout passes (`3031d4b`, `d56c03b`): rewrote `app/globals.css` twice and deleted the 729-line `desktop-shell-color.patch`.
- I built the dashboard (`1943865`): `FreelancerWorkbench.js`, `ExpenseLedger.js`, `RouteComparison.js`, `CategoryBars.js`, `FilingCountdown.js`, `TipsList.js`, `hooks/useFreelancerTax.js`, `lib/deadlines.js`, `lib/expenseCategories.js`.
- I added income profiling (`36fa7d9`): `components/IncomeProfile.js` (+187), `hooks/useIncomeProfile.js` (+157), `ProfileTypeSelector.js`, and graduated-table support in `lib/employeeTax.js` and `lib/freelancerTax.js`.

## What blocked me

- The framework switch churned imports: `src/lib` to `lib/` and `src/data` to `data/` moved plus Vite entry points deleted in one pass, so anything referencing old paths broke until the move settled.
- I rewrote `globals.css` twice in one day while styling drifted per component with no token contract. That pushed me to lock the Week 4 design system.
- I rushed scope by landing the dashboard and profiling the same day as the rework, so review suffered and calculator coverage outpaced history and settings plumbing.

## What I learned

- Engine first works: pure functions in `lib/` with no React let me smoke-test bracket logic and route comparison before any UI existed.
- One shared Income Profile driving live recompute beats every screen re-asking the same inputs.
- Next.js Route Handlers from the start means the whole API deploys as Vercel serverless functions with no separate server or CORS layer.
