# Moneta - Week 5

## Week of: September 13-19, 2026

## My goal this week

Apply the design system consistently and streamline the engine so the whole codebase reads as one style before the final.

## What I did

- I aligned token and component-state wording between `DESIGN-SYSTEM.html` and `app/globals.css` (`229b2be`).
- I streamlined lib files (`902d0ed`, 233+/438- across 34 files): stripped stale header comments from every `lib/*.js`, slimmed `data/taxRates2026.js`, fixed `EmployeeTaxCalculator.js` display logic, added shared `hooks/useNumericInput.js` (+10), and cleaned `hooks/useIncomeProfile.js`, `hooks/useFreelancerTax.js`, `lib/advisor.js` (-66/+44 net), `lib/freelancerTax.js`, and `lib/taxConfig.js`.

## What blocked me

- Touching 34 files in one commit is risky on purpose, so I still need a clean build plus lint plus a bracket-boundary check to be sure nothing regressed.

## What I learned

- Removing ~438 lines of dead comments and duplicated numeric-input parsing was worth it: one shared `useNumericInput` hook stops per-calculator input drift.
- I kept `RATES` hydration-safe (SSR and first paint agree, overrides apply after mount) while shrinking the code around it. What is left is a prod check on moneta-lovat for guest-to-Google/email linking with history and rates kept, plus a last responsive pass.
