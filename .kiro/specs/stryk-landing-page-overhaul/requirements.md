# Requirements Document

## Introduction

This document formalises the requirements for the STRYK Landing Page Overhaul. The overhaul replaces the default Next.js starter page in the `clerk-nextjs` app with a locked, full-screen, mobile-app-style landing page that presents STRYK's dark gaming aesthetic (lime `#C6FF00` on a near-black background). The page exposes exactly two calls-to-action — "Log In" and "JOIN STRYK →" — backed by Clerk authentication modals. New users are funnelled through a five-step onboarding flow that collects player-card data and POSTs it to the FastAPI backend, then lands on `/dashboard`. Existing users are routed directly to `/dashboard` after sign-in.

---

## Glossary

- **Landing_Page**: The Next.js route component at `app/page.tsx` that renders the full-screen STRYK entry experience.
- **Onboarding_Page**: The Next.js route component at `app/onboarding/page.tsx` that manages the five-step player-card creation flow.
- **Clerk**: The third-party authentication SDK (`@clerk/nextjs`) providing sign-in and sign-up modal flows.
- **Middleware**: The Clerk edge middleware defined in `middleware.ts` that protects server routes.
- **PlayerCard**: The React component (`app/components/player-card.tsx`) that renders the holographic FIFA-style player card.
- **ImageWithFallback**: The React helper component (`app/components/image-with-fallback.tsx`) that displays a placeholder SVG when an avatar URL is absent or fails to load.
- **OnboardingForm**: The local state object (`OnboardingFormState`) that accumulates player data across the five onboarding steps before submission.
- **PlayerCreatePayload**: The JSON body sent to `POST /players/` on the FastAPI backend.
- **Backend**: The FastAPI service listening at `http://localhost:8000`.
- **FeatureGrid**: The static 2×2 grid of feature tiles rendered inline within `Landing_Page`.
- **DEMO_PLAYER**: The static `Player` object used to populate the `PlayerCard` preview on the landing page.
- **ViewportLock**: The CSS strategy (`overflow: hidden`, `position: fixed` on `html` and `body`) that prevents any scrolling across all pages.
- **StepMachine**: The step-navigation logic (`goNext`, `goPrev`, `handleSubmit`) that drives the onboarding flow.

---

## Requirements

### Requirement 1: Full-Screen Viewport Lock

**User Story:** As a visitor, I want the page to feel like a native mobile app, so that I get an immersive, scroll-free experience.

#### Acceptance Criteria

1. THE `globals.css` file SHALL define `html` and `body` with `overflow: hidden`, `height: 100%`, `position: fixed`, and `width: 100%` to prevent any scrolling on any screen size.
2. WHEN the `Landing_Page` renders, THE `Landing_Page` SHALL mount its root element with `height: 100dvh` and `overflow: hidden` so no vertical scroll is possible regardless of content height.
3. WHEN the `Onboarding_Page` renders, THE `Onboarding_Page` SHALL mount its root element with `height: 100dvh` and `overflow: hidden` so no vertical scroll is possible.
4. THE `Landing_Page` SHALL constrain its phone-frame container to `max-width: 390px` and `width: 100%` centered horizontally inside the full-screen shell.

---

### Requirement 2: Dark Gaming Visual Theme

**User Story:** As a visitor, I want to see STRYK's distinct dark gaming aesthetic, so that I immediately understand the brand identity.

#### Acceptance Criteria

1. THE `globals.css` file SHALL declare CSS custom properties: `--stryk-lime: #C6FF00`, `--stryk-bg: #05070B`, `--stryk-surface: #0B1020`, and `--stryk-border: rgba(255, 255, 255, 0.08)`.
2. THE `Landing_Page` SHALL render the outer shell with `background: #0A0A0A` and the inner phone-frame container with `background: #05070B`.
3. THE `Landing_Page` SHALL render the "JOIN STRYK →" CTA button with `background: #C6FF00` and `color: #000000`.
4. THE `Landing_Page` SHALL display the STRYK wordmark or logo in the top-left of the top bar.

---

### Requirement 3: Landing Page CTAs — Exactly Two

**User Story:** As a visitor, I want to see only "Log In" and "JOIN STRYK →" as my options, so that my path is clear and uncluttered.

#### Acceptance Criteria

1. THE `Landing_Page` SHALL render a "Log In" button in the top-right of the top bar.
2. THE `Landing_Page` SHALL render a "JOIN STRYK →" full-width CTA button at the bottom of the phone frame.
3. THE `Landing_Page` SHALL NOT render any button, link, or interactive element labelled "Explore Demo" or containing demo-related text.
4. THE `Landing_Page` SHALL NOT render any social-proof element such as avatar circles or player-count labels (e.g., "10K+ players").
5. THE `Landing_Page` SHALL render exactly these two interactive CTAs and no additional call-to-action elements.

---

### Requirement 4: Clerk Authentication Integration

**User Story:** As a visitor, I want clicking "Log In" or "JOIN STRYK →" to open the appropriate Clerk auth modal, so that I can authenticate without leaving the page.

#### Acceptance Criteria

1. WHEN a user clicks "Log In", THE `Landing_Page` SHALL call `openSignIn({ afterSignInUrl: "/dashboard" })` from the Clerk SDK.
2. WHEN a user clicks "JOIN STRYK →", THE `Landing_Page` SHALL call `openSignUp({ afterSignUpUrl: "/onboarding" })` from the Clerk SDK.
3. THE `Landing_Page` SHALL be declared as a Client Component using the `"use client"` directive so that Clerk hooks are available at runtime.
4. THE `app/layout.tsx` file SHALL wrap the application tree in `ClerkProvider` so that Clerk context is available to all pages and components.

---

### Requirement 5: Post-Authentication Routing

**User Story:** As a user, I want to be routed to the correct destination after authenticating, so that new users create their profile and existing users go straight to their dashboard.

#### Acceptance Criteria

1. WHEN an existing user completes Clerk sign-in, THE Clerk SHALL redirect the user to `/dashboard` via `afterSignInUrl`.
2. WHEN a new user completes Clerk sign-up, THE Clerk SHALL redirect the user to `/onboarding` via `afterSignUpUrl`.
3. THE `Middleware` SHALL protect the `/dashboard` route so that unauthenticated requests are redirected to Clerk sign-in.
4. THE `Middleware` SHALL protect the `/onboarding` route so that unauthenticated requests are redirected to Clerk sign-in.
5. WHEN an unauthenticated user visits `/onboarding` directly, THE `Middleware` SHALL intercept the request and redirect to Clerk sign-in before the `Onboarding_Page` component renders.

---

### Requirement 6: PlayerCard Component

**User Story:** As a visitor, I want to see a visually striking holographic player card on the landing page, so that I understand what my profile will look like.

#### Acceptance Criteria

1. THE `PlayerCard` component SHALL accept a `player` prop of type `Player`, an optional `size` prop of `"sm" | "md" | "lg"`, and an optional `onClick` callback.
2. THE `PlayerCard` component SHALL render the player's OVR rating, position, name, username, play style, strong foot, nation, and six stats (PAC, SHO, PAS, DRI, DEF, PHY).
3. THE `Landing_Page` SHALL render a `PlayerCard` populated with the static `DEMO_PLAYER` object as a preview.
4. WHEN `PlayerCard` is rendered with an empty `avatarUrl`, THE `ImageWithFallback` component SHALL display a placeholder SVG instead of a broken image element.
5. THE `PlayerCard` SHALL apply a holographic shimmer overlay using CSS gradients and a hover-activated sweep animation.

---

### Requirement 7: FeatureGrid

**User Story:** As a visitor, I want to see a brief summary of STRYK's key features, so that I understand the app's value before signing up.

#### Acceptance Criteria

1. THE `Landing_Page` SHALL render a 2×2 `FeatureGrid` containing exactly four feature tiles: "Player Cards", "Match Lobbies", "Real Stats", and "Grow & Earn".
2. THE `FeatureGrid` SHALL render each tile with an icon from `lucide-react` and a short description label.
3. THE `FeatureGrid` SHALL be a static, non-interactive presentational section with no click handlers.

---

### Requirement 8: Five-Step Onboarding Flow

**User Story:** As a new user, I want to be guided through a structured player-card creation process, so that I can set up my profile step by step without feeling overwhelmed.

#### Acceptance Criteria

1. THE `Onboarding_Page` SHALL present the onboarding flow as exactly five sequential steps: (1) full name + username, (2) position selection, (3) strong foot + play style, (4) avatar upload, (5) preview + confirm.
2. WHEN `currentStep < 5`, THE `StepMachine` SHALL increment `currentStep` by exactly 1 when `goNext` is called with valid form data for the current step.
3. WHEN `currentStep > 1`, THE `StepMachine` SHALL decrement `currentStep` by exactly 1 when `goPrev` is called.
4. WHEN `goNext` is called and the current step's required fields are invalid, THE `Onboarding_Page` SHALL display field-level error messages and SHALL NOT advance to the next step.
5. WHEN the user navigates backward with `goPrev`, THE `Onboarding_Page` SHALL preserve all previously entered `OnboardingForm` field values.
6. THE `Onboarding_Page` SHALL render a progress indicator reflecting the current step number out of five.

---

### Requirement 9: Onboarding Form Validation

**User Story:** As a new user, I want clear validation feedback on my inputs, so that I know exactly what I need to fix before I can proceed.

#### Acceptance Criteria

1. THE `OnboardingForm` SHALL require `fullName` to be a non-empty string between 2 and 100 characters inclusive.
2. THE `OnboardingForm` SHALL require `username` to be a non-empty string between 3 and 40 characters inclusive, composed only of alphanumeric characters, dots, and underscores, with no spaces and no leading or trailing dots.
3. THE `OnboardingForm` SHALL require `position` to be one of the 14 valid position codes: GK, LB, CB, RB, CDM, CM, LM, RM, CAM, LW, RW, ST, CF, LAM.
4. THE `OnboardingForm` SHALL require `strongFoot` to be exactly `"Left"` or `"Right"`.
5. THE `OnboardingForm` SHALL require `playStyle` to be one of: `"Playmaker"`, `"Dribbler"`, `"Target Man"`, `"Box-to-Box"`, `"Sweeper"`, `"Shot-stopper"`.
6. THE `OnboardingForm` SHALL allow `avatarUrl` to be `null` (avatar upload is optional and may be skipped).
7. THE `OnboardingForm` SHALL allow `bio` to be an empty string (bio is optional).

---

### Requirement 10: Player Creation API Submission

**User Story:** As a new user, I want my player profile to be created automatically after I complete onboarding, so that I don't have to do any manual setup afterwards.

#### Acceptance Criteria

1. WHEN a user confirms on step 5, THE `Onboarding_Page` SHALL send a `POST` request to `http://localhost:8000/players/` with `Content-Type: application/json`.
2. THE `PlayerCreatePayload` sent in the request body SHALL include `auth_user_id` set to `user.id` from the Clerk `useUser()` hook.
3. THE `PlayerCreatePayload` SHALL always include `rating: 80` as the hardcoded initial rating for new players.
4. WHEN the Backend responds with HTTP 201, THE `Onboarding_Page` SHALL call `router.push("/dashboard")` exactly once.
5. IF the Backend responds with a non-2xx status or a network error, THEN THE `Onboarding_Page` SHALL set `submitError` state and display an error banner on step 5, and SHALL NOT redirect.
6. WHILE a submission is in progress (`isSubmitting === true`), THE `Onboarding_Page` SHALL disable the submit button and SHALL NOT initiate a second `fetch` call if the handler is invoked again.
7. THE `Onboarding_Page` SHALL reset `isSubmitting` to `false` in a `finally` block regardless of whether the submission succeeded or failed.

---

### Requirement 11: Clerk Middleware Route Protection

**User Story:** As the system operator, I want protected routes to be inaccessible without a valid Clerk session, so that unauthenticated users cannot reach the dashboard or onboarding pages.

#### Acceptance Criteria

1. THE `middleware.ts` file SHALL use `clerkMiddleware` and `createRouteMatcher` from `@clerk/nextjs/server` to define protected routes.
2. THE `Middleware` SHALL match and protect both `/dashboard(.*)` and `/onboarding(.*)` route patterns.
3. WHEN a request matches a protected route and the Clerk session is absent, THE `Middleware` SHALL call `auth.protect()` to block the request and redirect to sign-in.
4. THE `middleware.ts` file SHALL export a `config` object with a `matcher` array that covers all application routes while excluding Next.js internals (`_next`), static assets, and API routes as appropriate.

---

### Requirement 12: Environment and Dependency Configuration

**User Story:** As a developer, I want all required packages and environment variables to be clearly specified, so that I can set up the project without guesswork.

#### Acceptance Criteria

1. THE project SHALL declare `@clerk/nextjs` as a dependency in `package.json`.
2. THE project SHALL declare `lucide-react` as a dependency in `package.json`.
3. THE `.env.local` file SHALL define `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` for Clerk authentication.
4. THE `.env.local` file SHALL define `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`.
5. THE `CLERK_SECRET_KEY` SHALL only be accessed server-side and SHALL NOT be referenced from any Client Component.

---

### Requirement 13: PlayerCard and ImageWithFallback Source Components

**User Story:** As a developer, I want the player card components to be placed in the correct location within the Next.js app, so that they are available to both the landing page and the onboarding preview.

#### Acceptance Criteria

1. THE `PlayerCard` component SHALL be located at `app/components/player-card.tsx`, copied from `docs/figma-export/src/app/components/player-card.tsx`.
2. THE `ImageWithFallback` component SHALL be located at `app/components/image-with-fallback.tsx`, copied from `docs/figma-export/src/app/components/figma/ImageWithFallback.tsx`.
3. THE `PlayerCard` component SHALL import `ImageWithFallback` from its co-located path (`./image-with-fallback`) rather than the figma-export source path.
4. WHEN `ImageWithFallback` receives an `src` that fails to load or is empty, THE `ImageWithFallback` component SHALL render a fallback placeholder SVG via its `onError` handler.
