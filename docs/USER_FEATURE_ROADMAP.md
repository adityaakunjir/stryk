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

Feature 1 is implemented in the working tree. Automated and mobile-browser validation pending.
Do not advance to feature 2 until feature 1 is checked.

## Validation principles

- Isolated database fixtures for write flows; never fabricate real-user match results.
- Mobile view required for UI validation, including scroll reachability and navigation.
- Confirm deployed frontend and backend revisions separately.
- Push permissions do not justify force pushing or overwriting unrelated changes.
- Report test limitations honestly; no broad completion claims from narrow passing checks.
