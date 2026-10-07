# User feature implementation and verification gates

Requested: implement each feature individually and verify in a mobile browser before moving to the next.
Each new/changed screen must match STRYK's existing design: Bebas Neue display headings,
Inter body, dark glass/gold surfaces, tracked uppercase labels and lime primary actions.
Shared feature styles live in frontend/lib/feature-ui.ts; no unrelated visual redesigns.

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

UI consistency update 9a194da verified Ready on Vercel and rendered on authenticated
production Notifications at 390 x 844. Gold labels, Bebas Neue display headings,
dark panels and existing Inter body typography render correctly. Reminder preference
remains Off; no production test matches or account-preference changes made.
Railway Variables still lacks VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY. The private-key
entry form is prepared for user handoff; follow docs/PUSH_SETUP.md. Actual phone
delivery remains the feature 3 gate; do not advance to waitlist implementation yet.
Screenshot: docs/reminders-mobile-live-design.jpg.

VAPID variables were added by the user and Railway returned Online. User reports
the phone shows Disable phone notifications, but no notification has been received.
Added an explicit current-device test action without fake matches/inbox entries.
Authenticated ownership and opt-in checks, atomic persisted 60-second cooldown,
safe upstream errors and expired-subscription invalidation covered by isolated tests.
Fourteen backend checks passed; TypeScript and targeted ESLint passed. Mobile
390 x 844 verified the missing-subscription guard, 48px touch target, Bebas Neue
font and no horizontal overflow. Screenshot: docs/reminder-test-mobile.jpg.
Push-service acceptance is not proof of visible device delivery. User must send
the test on the subscribed phone and confirm the notification tray before feature 4.

User confirmed the test notification arrives perfectly on the subscribed phone.
Feature 3 delivery gate passed; feature 4 is now in progress.
First feature 4 foundation batch: normal/code/invite joins lock the match row and
commit roster insertion and capacity state together. Leaving/kicking reopens a full
lobby, cancelled games reject invitation acceptance, and leave errors no longer
expose other player IDs. Seventeen isolated backend regression tests passed.
SQLite tests prove endpoint/capacity behavior, not live PostgreSQL concurrency;
PostgreSQL SELECT FOR UPDATE is the serialization mechanism. No frontend changes
in this batch. Queue/promotion implementation and mobile gate are still pending.

## Validation principles

- Isolated database fixtures for write flows; never fabricate real-user match results.
- Mobile view required for UI validation, including scroll reachability and navigation.
- Confirm deployed frontend and backend revisions separately.
- Push permissions do not justify force pushing or overwriting unrelated changes.
- Report test limitations honestly; no broad completion claims from narrow passing checks.
