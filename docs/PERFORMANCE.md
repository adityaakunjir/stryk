# Mobile performance pass — 9 October 2026

## Changes

- Preserve Inter and Bebas Neue, but self-host via next/font instead of a render-blocking Google CSS import.
- Replace the global perpetual aurora animation, full-screen blur and SVG turbulence with static gradients.
- Mobile/touch/reduced-motion screens and hidden tabs stop decorative card idle animation; mobile stat counters render their final values directly.
- Mobile card dossier uses an opaque dark surface instead of a 40px backdrop blur. Remove the duplicate blurred avatar on mobile home.
- Load home card dossier and progression panels only when opened, with a visible loading indicator.
- Remove four eager home route prefetches competing with the current screen's requests.
- Narrow weekly dashboard queries to personal games and public discovery games within the week; retain personal unfinished actions.
- Prevent overlapping standby polls, stop polling while hidden/offline, and bound each poll to 12 seconds.
- Generate separate mobile WebP assets; originals remain unchanged. Reproduce with `node frontend/scripts/optimize-mobile-assets.cjs`.

| Asset | Original bytes | Mobile bytes |
| --- | ---: | ---: |
| Logo | 134262 | 3684 |
| Card base | 108620 | 53702 |
| Home background | 191718 | 66474 |
| Landing background | 345250 | 71360 |

The unused landing-playercard variant is also available (586876 to 51218 bytes); it is not counted as a page-load saving.

## Verification

- Next.js 16.2.7 production build and TypeScript pass.
- Targeted ESLint: no errors; existing unused-variable warnings remain.
- 21 isolated backend tests passed: dashboard, waitlist, recurring games, reminders.
- New dashboard regression verifies unrelated historical/private games are not materialized while personal pending actions remain.
- Browser mobile viewport 390 x 844: landing typography and optimized logo loaded; no horizontal overflow; authenticated local home and weekly fixture data loaded; on-demand card opened and flipped; 640px card base and zero mobile backdrop blur confirmed.
- Screenshot: `performance-mobile-home.jpg`. Local tests used a disposable in-memory fixture, not production game mutations.

## Limits

This is a concrete first optimization pass, not a claim of zero latency. No CPU/network throttling capability was available in the connected browser; no low-end hardware benchmark or before/after Core Web Vitals score was measured. Authenticated data remains uncached by the service worker; match participation still requires connectivity. Network distance, Clerk, Vercel/Railway response times, and uploaded avatar sizes still affect loading.
