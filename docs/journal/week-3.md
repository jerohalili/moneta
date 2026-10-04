# Moneta - Week 3

## Week of: August 30 - September 5, 2026

## My goal this week

Harden sign-in (Google + guest), fix redirects, and clean up small UI bugs like favicon, theme flash, and overflow.

## What I did

- I fixed the Google auth loop (`92a0441`, `7a04c13`, `836473c`, `d49ce31`, `e4da714`): trimmed `app/api/auth/[...all]/route.js`, hardened `lib/auth.js` (+38), and fixed the anonymous-column mapping in `lib/db/schema.js`.
- I churned the favicon (`b772300`, `3678114`, `ec2bb6d`, `328538b`, `b9b2202`) between `public/favicon.svg` and `app/favicon.ico`, ending on restored `public/favicon.svg` with the tab title simplified to `Moneta` in `app/layout.js`.
- I fixed the theme button (`91e15e8`): `ThemeToggle.js` plus an `AuthGate.js` guard so there is no flash before paint.
- I fixed redirects (`2410bf2`): new `middleware.js` (+24), simplified `AuthGate.js`, and a sync-path fix in `CloudSyncManager.js`.
- I fought the guest-login loop across 5 attempts (`0ef238e`, `02d3afa`, `0ff7ba5` revert, `e3060cf`, `bd533e5`): reworked `components/LoginForm.js` from optimistic guest tap to a cookie-aware flow.
- I made page spacing consistent (`c54e382`), updated docs (`b52cedc`), and fixed the account overflow bug with a 5-line CSS clamp (`3d3020f`).

## What blocked me

- Guest login stuck me for 2 days including one revert (`0ff7ba5`): my first attempts set the session without a usable cookie, so guests bounced straight back to login.
- Google auth stuck me for a day across 5 fixes: route handler shape, button wiring, and schema column broke in turn.
- Favicon stuck me for 5 commits in 5 hours flipping svg vs ico paths because of competing `app/favicon.ico` vs `public/favicon.*` conventions in Next.js.
- Long email and account strings overflowed the account menu on narrow screens until the CSS clamp.

## What I learned

- Lossless guest-to-Google/email upgrade (same `user.id`, cascade deletes) has to come first so one-tap guest sets cookies and survives middleware redirects.
- Small polish (tab icon, theme flash) reads as finished or unfinished fast, so it is worth fixing early even when it feels tiny.
- When I am flip-flopping on a convention (like favicon paths), I should stop and read the framework docs instead of committing a sixth guess.
