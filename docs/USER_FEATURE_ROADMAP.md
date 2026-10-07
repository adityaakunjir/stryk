# User feature implementation and verification gates

Requested: implement each feature individually and verify in a mobile browser before moving to the next.

## Required scope (all retained)

1. Play this week: personal upcoming games, available spots, invitations and pending stat actions.
2. Recurring games: reusable weekly scheduling with invitations and attendance.
3. Match reminders: opt-in notifications for matches/changes/stat deadlines.
4. Waitlist and substitutes: capacity-safe queue and cancellation replacement.
5. Share a match: useful mobile invite link and preview.
6. Post-match recap: scores, verified contributions and progression.
7. Transparent progression: real XP/level, reward reasons and rating sample size.
8. Separate profile editing from onboarding.
9. Simplify position-aware stat entry.
10. Explain verification eligibility, disputes and expiry.
11. Recover from connectivity/auth errors without false onboarding.
12. Reporting, blocking and privacy controls.
13. Credible ratings: sample size and separate attendance vs performance.

## Current gate

Feature 1 deployed in commit 1d3db5c. Three isolated API tests and TypeScript checks passed.
Mobile browser checked at 390 x 844: existing Aditya profile loaded; a pending stat action
and upcoming/open-spots empty states rendered; Find or create a game navigated to matches.
Unauthenticated production endpoint returns 401. Populated upcoming/open-spots filtering
is covered by isolated API fixtures, not fabricated production matches.
Feature 2 implemented: 2–12 weekly public games at a local kickoff time, independent
rosters/invitations through existing match pages, idempotent creation retries, and
host-only stop of future unstarted occurrences without deleting history.
Eight isolated backend checks (including feature 1 regression) passed, plus TypeScript
and new-page ESLint. Mobile browser at 390 x 844 created three fixtures, displayed
weekly local dates/capacity, and confirmed all future games cancelled after stop.
Fixture API uses an in-memory database on loopback; no fake production games created.
Commit c3c58a3 deployed successfully on Vercel and Railway. The live mobile screen
loaded its authenticated schedule list and displayed the full form/submit button.
Existing match join endpoint also tested: recurring dates include UTC offsets and
cancelled occurrences reject joins. Feature 3 (match reminders) is next.

Feature 3 in progress: opt-in inbox reminders, kickoff/change/deadline scheduler,
account-scoped preferences, per-device push subscriptions/delivery, and service-worker
notification handling implemented. TypeScript/new-component lint passed.
Twelve isolated backend tests passed. Mobile fixture at 390 x 844 displayed an inbox
reminder, marked it read and persisted opt-out. Validated inbox/scheduler code is being
pushed; VAPID production configuration, live deployment and actual phone push delivery
verification remain required before advancing to feature 4.

## Validation principles

- Isolated database fixtures for write flows; never fabricate real-user match results.
- Mobile view required for UI validation, including scroll reachability and navigation.
- Confirm deployed frontend and backend revisions separately.
- Push permissions do not justify force pushing or overwriting unrelated changes.
- Report test limitations honestly; no broad completion claims from narrow passing checks.
