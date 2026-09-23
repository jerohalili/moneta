# SECURITY-CHECKLIST — Moneta

Filled before going public. Every row: Yes / No / N/A + one line of evidence in my own words.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 1 | .env is gitignored and is not in the repository | Yes | `.gitignore:2-3` lists `.env` and `.env.local`; `git ls-files` shows only `.env.example` |
| 2 | A .env.example with placeholder values only is committed | Yes | `.env.example` has 5 empty keys plus `openssl rand -base64 32` instruction, no real values |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | Searched `lib/`, `app/api/` — `DATABASE_URL`, `BETTER_AUTH_SECRET`, `AUTH_GOOGLE_*` read from env only (`lib/db/index.js:18`, `lib/auth.js:28,37-40,49`); `dev-only-insecure-secret` fallback is non-prod only |
| 4 | Git history is clean: I searched git log -p for password, secret, api key and postgres:// | Yes | Ran `git log -p --all -S password -S secret -S "api key" -S postgres://`; no credential hits |
| 5 | Any credential that was ever committed has been rotated | N/A | No credential was ever committed; local `.env.local` never entered git |
| 6 | Production credentials live only in my hosting provider's environment settings | Yes | Prod values set in Vercel env settings only, including `BETTER_AUTH_URL` = production URL |

## GitHub Actions

Project has no workflows — rows 7–11 are N/A for that reason.

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 7 | No secret value is written literally in any workflow YAML file | N/A | No `.github/workflows/` files exist |
| 8 | Secrets are stored in repository Actions secrets and read with ${{ secrets.NAME }} | N/A | No workflows to audit |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | N/A | No workflows, no runs |
| 10 | Uploaded build artifacts contain no .env, key file or generated config | N/A | No workflows; Vercel build is standard Next.js output |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | N/A | No workflows |
| 12 | Secret scanning and push protection are enabled on the repository | Yes | Checked Settings → Code security after last push; both on |

## Database

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | All `app/api/me/*` use Drizzle `eq/and/desc/insert/onConflictDoUpdate/delete`; no raw `sql``` or concatenation |
| 14 | The database is not open to the whole internet, or is reachable only by the app | Yes | Neon pooled URL, password-gated; only holder of `DATABASE_URL` can connect |
| 15 | The database user the app connects as has only the permissions it needs | No | Neon single-owner string has full rights to this DB; mitigated by per-project DB, env-only storage, no raw DDL in app |
| 16 | Seed and sample data is invented, not real people's data | Yes | `data/taxRates2026.js` is statutory tax tables only; no seed users or PII |
| 17 | Debug, seed and reset routes are removed before going public | Yes | `app/api/*` is only auth + `me/data,profile,rates,history,account`; no debug/seed/reset/drop routes |

## Access control

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | Better Auth with Google + email + guest/anonymous (`lib/auth.js:44`, `app/api/auth/[...all]/route.js:9`) |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | Not used; Neon + Drizzle only |
| 20 | If Zero Trust: tjakoen.s@gmail.com is on the access policy. If an app password: the credentials are in my private workspace project/README.md | N/A | No Zero Trust or app password; real login covers access |
| 21 | The gate covers every route, including the ones that only change data | Yes | `middleware.js:3,12-17` fail-closed (only `/login`, `/api/auth` public); every `me/*` route calls `getSessionOrUnauthorized()` first → 401, queries scoped `where(eq(userId))`, history delete uses `and(id,userId)` |
| 22 | The credentials for the gate are environment variables, not in source | Yes | `BETTER_AUTH_SECRET`, `AUTH_GOOGLE_ID/SECRET`, `DATABASE_URL` via env; cookies `moneta` prefix, `httpOnly`, `secure` in prod, `sameSite:lax`, rate-limited |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 23 | Input from the user is validated on the server, not only in the browser | Yes | Zod envelopes on all writes (`profile`, `rates`, `history`); size caps 300KB/100KB/50KB → 413; history `limit(500)` |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | Zero `innerHTML`/`eval` in `components/`; only static theme script in `app/layout.js` with no user data |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | All errors are generic (`Invalid payload`, `Too large`, `Conflict`, `Not signed in`); no `stack` in responses |
| 26 | CORS is not a wildcard on routes that change data | Yes | No CORS headers; same-origin fetches only, scoped by `allowedHosts`/`trustedOrigins` (`localhost:3000`, `moneta-lovat.vercel.app`) |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
|---|-------|----------------|----------|
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | Yes | Searched repo + `git log`; only `github.com/jerohalili/moneta` and live URL |
| 28 | No classmate's personal data in the repository | Yes | No other people's data anywhere |
| 29 | Dependencies come from official registries, and node_modules is gitignored | Yes | `@neondatabase/serverless`, `better-auth`, `drizzle-orm`, `next`, `zod` from npm; `/node_modules` + `/.next` gitignored + untracked |
| 30 | Images, fonts and other assets are mine, licensed, or credited | Yes | `next/font` (Fraunces, IBM Plex Mono, Inter), Lucide icons, own favicon |
| 31 | Repository visibility is deliberate, and I checked it after my last push | Yes | Public by intent for grading; visibility re-checked after final push |

## Anything I found and fixed

Nothing secret-related — env-only credentials, Zod validation, and fail-closed middleware all checked out. The checklist caught a stale `CONTINUE.md` reference in `.env.example` comments (redirect-URI guide not in repo); the URIs are now documented in README §2.3, and the `dev-only-insecure-secret` fallback is confirmed non-prod only.
