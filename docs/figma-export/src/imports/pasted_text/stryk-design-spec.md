# STRYK Design System & Product UI Spec

## Product Summary

STRYK is a mobile-first football identity platform. It is not a turf booking app. The product should feel like a premium sports game lobby mixed with a collectible player card system. The core experience is built around player identity, match lobbies, verified stats, and shareable football cards.

The UI should feel:

* premium
* modern
* minimal
* game-like
* cinematic
* high contrast
* mobile-first
* emotionally engaging
* easy to use with one hand

The visual language should be inspired by:

* FIFA Ultimate Team
* EA FC menus
* Valorant lobby UI
* BGMI/PUBG game menus
* premium gaming dashboards

But STRYK must remain original.

---

## Product Direction

### What STRYK Is

* A football identity platform
* A place where players build their football card
* A place where players create/join match lobbies
* A place where stats are submitted and verified by peers
* A place where football memories become history
* A place where player reputation grows over time

### What STRYK Is Not

* Not Playo
* Not a turf marketplace first
* Not a booking-heavy utility app
* Not a dashboard product
* Not an enterprise tool

---

## Design Goals

### Primary Goal

Make every user feel like they are entering a football game universe where their real-life football journey has status, identity, and progression.

### Secondary Goals

* Make every screen feel premium and uncluttered
* Make the product instantly understandable
* Make the player card the visual centerpiece
* Make the lobby experience feel like a game session
* Make the verification flow feel trustworthy but lightweight
* Make the product shareable on social media

---

## Core UX Principles

### 1. One Screen, One Primary Action

Each screen should have one main purpose. Do not overload the user with too many competing elements.

### 2. Identity First

Every screen should reinforce the idea that the user has a football identity, a rank, a style, and a reputation.

### 3. Game-Like Motion

Use subtle transitions, card flips, sliding panels, and smooth reveals. The product should feel alive.

### 4. Minimal but Premium

Use fewer components, more spacing, and stronger hierarchy. Avoid clutter.

### 5. Mobile-First

Design for 9:16 portrait first. The product should work elegantly on a phone with no need to scroll on key home screens.

### 6. Fast Interactions

The user should complete most core actions in seconds.

---

## Visual Style

### Color Palette

Primary background should be very dark.

* Background: #05070B
* Surface: #0B1020
* Elevated Surface: #10182B
* Border: rgba(255,255,255,0.08)
* Primary Accent: Neon Lime / Electric Yellow-Green
* Secondary Accent: Cool Blue or Purple for contrast if needed
* Text Primary: #F5F7FA
* Text Secondary: rgba(245,247,250,0.72)
* Text Muted: rgba(245,247,250,0.45)
* Success: Green
* Warning: Amber
* Error: Red

Avoid using too many accent colors at once. Lime should be the dominant brand accent.

### Typography

Use a bold, modern sans-serif with strong hierarchy.

Recommended hierarchy:

* Hero title: extra bold, large, uppercase or semi-uppercase
* Section title: bold, medium-large
* Body text: clean and readable
* Labels: small, semi-bold, uppercase or compact style

The typography should feel sporty and premium, not corporate.

### Spacing

Use generous spacing.

* Outer padding: 20–24 px
* Card padding: 16–20 px
* Section spacing: 16–24 px
* Avoid crowded layouts

### Corners & Shadows

* Main cards: 20–28 px radius
* Buttons: 18–24 px radius
* Inputs: 14–18 px radius
* Shadows: soft, subtle, premium
* Glow effects only for important hero elements and CTAs

### Background Treatment

Use a dark atmospheric background with:

* subtle stadium lights
* soft fog
* vignette
* minimal texture
* very light particle / glow treatment

Do not make the background noisy.

---

## Layout System

### Mobile Frame

* Design for 9:16 portrait
* All key home screens should fit in one screen without scrolling when possible
* Vertical rhythm should be balanced and clear

### Grid

Use a simple responsive 4-column mental grid for mobile.

* Use asymmetric layouts when needed for game-like feel
* Avoid rigid enterprise grid patterns

### Composition Rules

* Hero content near top-center
* Secondary panels around sides
* Primary CTA near bottom-center or bottom-right depending on context
* Do not stack too many cards vertically on the landing/home screen

---

## Brand Personality

STRYK should feel:

* confident
* competitive
* stylish
* modern
* youthful
* premium
* elite
* social
* community-driven

The tone is not childish.
The tone is not corporate.
The tone is not playful in a cheap way.
It should feel like a serious football identity ecosystem.

---

# SCREEN SYSTEM

## Screen 1: Landing / Home Lobby

### Purpose

The main landing screen after login. This should feel like a game lobby, not a normal app home.

### Layout Concept

Use a central standing player / avatar as the hero. Around the hero place key actions in floating panels.

### Key Elements

* Top-left: STRYK logo or small brand mark
* Top-right: notifications / settings
* Center: full-body avatar or stylized player standing on a subtle glowing platform
* Left panel: player identity / profile quick access
* Right panel: friends / online status quick access
* Bottom-left: Lobby action card
* Bottom-right: Friends or Collection action card
* Bottom-center: large primary CTA such as “Play Football” or “Enter Lobby”

### Interaction Style

* Clicking name or avatar should open player card with a spin / card flip animation
* Lobby action should open match list
* Friends action should open friends list

### Visual Tone

* Minimal
* Premium
* Game-like
* No scroll
* No bottom navigation if possible

---

## Screen 2: Sign Up / Login

### Purpose

Simple entry into the ecosystem.

### Layout Concept

A single clean auth screen with a strong football identity feel.

### Required Fields

* Email or phone
* Password or OTP later
* Continue with Google option
* Create account link

### Design Notes

* Keep the layout compact
* Make CTA prominent
* Avoid clutter
* Use a background that feels like a game intro screen

---

## Screen 3: Profile Creation — Basic Info

### Purpose

The first step of character creation.

### Layout Concept

Feels like creating a player in a football game.

### Required Fields

* Avatar upload or capture
* Name
* Username / handler
* Username availability check

### Design Notes

* Avatar should be prominent
* Use a placeholder silhouette if no photo exists
* Username availability should be shown in a clean status line
* The screen should feel exciting, not like a form

---

## Screen 4: Profile Creation — Position & Foot

### Purpose

Define the player’s football role.

### Required Fields

* Preferred position
* Secondary position
* Strong foot

### Design Notes

* Use a football pitch map or position layout
* Positions should be visually selectable
* Strong foot should use a clean left/right toggle
* This screen should feel tactical and sporty

---

## Screen 5: Profile Creation — Play Style & Bio

### Purpose

Define the personality of the player card.

### Required Fields

* Play style carousel
* Bio text field

### Play Style Examples

* Playmaker
* Poacher
* Speedster
* Box-to-Box
* Wall Defender
* Target Man
* Creative Mid

### Design Notes

* Each style should feel like a collectible archetype
* Use icons or illustrated character cards
* Bio field should feel like “write the back of your card”

---

## Screen 6: Player Card Detail View

### Purpose

A premium collectible view of the card.

### Layout Concept

Large centered card with clean dark background.

### Required Elements

* Back button
* Share icon
* Large player card centered
* OVR, position, stats, play style icon
* Subtle shimmer or glow effect
* Tap to flip card

### Card Back Content

* History
* recent match stats
* trust score
* progression
* earned badges

### Design Notes

* This screen should feel like the most premium part of STRYK
* The card should look collectible and rare
* Different border styles can indicate progress level

---

## Screen 7: Friends System / Search

### Purpose

Connect with other players.

### Required Elements

* Search bar by username or name
* Suggested friends
* Pending requests
* Friends list
* Online / offline status
* Optional OVR / position labels

### Design Notes

* Keep lists clean and scannable
* Suggested friends should appear as compact cards
* Requests should have clear accept/reject actions

---

## Screen 8: Public Player Profile

### Purpose

View another player’s profile.

### Required Elements

* Large avatar
* Name and username
* Position / play style
* Add Friend button
* Message button
* Player card
* Badges
* Recent matches

### Design Notes

* Similar to personal profile but without management tools
* Should feel social and trustworthy
* Very clean and premium

---

## Screen 9: Match Lobbies Dashboard

### Purpose

Discover and create matches.

### Required Elements

* Tabs: All Lobbies, My Lobbies, Friends’ Lobbies
* Filters: date, venue
* Lobby list with match name, venue, date, time, host, player count
* Primary CTA: Create Match
* Join Match buttons on each lobby card

### Design Notes

* Use strong card hierarchy
* Make player counts visible
* Keep join CTA prominent
* Cards should feel like game session invitations

---

## Screen 10: Match Lobby Detail

### Purpose

Pre-game match hub.

### Required Elements

* Match name
* Venue
* Date and time
* Host info
* Participants list
* Invite Friends button
* Start Match button for host
* Leave Match button
* Build Teams section

### Design Notes

* Use tabs such as Lobby / Teams / Match Info if helpful
* Participants should be visually organized
* Build Teams should feel like an important tactical step

---

## Screen 11: Team Builder

### Purpose

Assign positions and create balanced teams.

### Required Elements

* Split view of Team A and Team B
* Bench / unassigned section
* Football pitch in the center
* Drag-and-drop player assignment
* Position markers on pitch
* Host controls only

### Design Notes

* This should feel like a tactical squad management screen from a sports game
* Use position chips, team color coding, and drag indicators
* Keep everything highly legible

---

## Screen 12: Match Performance Submission

### Purpose

Submit post-game stats.

### Required Elements

* Match context header
* Goals, Assists, Saves, Tackles, Interceptions
* Clean Sheet yes/no
* MVP selection dropdown
* Match notes text area
* Submit Performance button

### Design Notes

* The form should be fast to fill
* Use steppers for numeric stats
* Use simple yes/no toggles where possible
* Keep this screen efficient and easy to use after a match

---

## Screen 13: Match History Detail

### Purpose

Show the final verified record of the match.

### Required Elements

* Match details
* Final score
* Match timeline
* Key events
* Consolidated player notes and stats
* Share Match button

### Design Notes

* Make the timeline structured and easy to read
* Use color-coded event markers for goals, assists, MVP, clean sheets
* This screen should feel like the official record of the game

---

## Screen 14: Verification Dashboard

### Purpose

Peer verification of submitted performance.

### Required Elements

* Pending requests list
* Player avatar and name
* Match context
* Submitted stats summary
* Verify button
* Reject button

### Design Notes

* Make trust and fairness feel central
* Keep actions clear and fast
* Each request card should be compact but detailed enough to understand quickly

---

# COMPONENT SYSTEM

## Core Components

* Player Card
* Mini Player Card
* Friend Card
* Lobby Card
* Match Summary Card
* Stat Row
* Badge Chip
* Position Chip
* Profile Header
* Floating CTA Button
* Verification Action Buttons
* Team Slot / Position Marker
* Timeline Event Row

---

## Button System

Use a consistent hierarchy.

### Primary Button

* Neon lime fill
* dark text
* large radius
* strong presence

### Secondary Button

* Dark surface
* neon outline or subtle border

### Destructive Button

* Red outline or fill
* used sparingly

---

## Card System

Cards are central to STRYK.

### Standard Card

* dark surface
* soft border
* rounded corners
* subtle shadow

### Hero Card

* larger
* glow accent
* stronger border
* more visual drama

### Collectible Card

* premium border
* gradient glow
* special stat treatment
* strong focal image

---

# ANIMATION GUIDELINES

## Recommended Motion

* Card flip for player card detail
* Smooth fade and slide transitions between screens
* Subtle shimmer on collectible cards
* Soft glow pulse on active CTAs
* Slide-in panels for friends / lobby / profile drawer
* Drag-and-drop motion for team builder

## Motion Principles

* Motion should feel premium, not flashy
* Use motion to guide attention
* Keep animations short and elegant
* No overused bouncy effects

---

# ICONOGRAPHY

Use a clean, minimal line icon style.

Rules:

* Icons should be consistent
* Icons should be simple and strong
* Use outline icons for inactive states
* Use filled or glowing variants for active states
* Avoid overdecorated icons

---

# IMAGE / AVATAR GUIDELINES

## Avatar Types

* Real uploaded photo
* AI-generated football avatar
* Blue Lock inspired stylized portrait
* Card art version

## Avatar Display Rules

* Avatar must always look premium and centered
* Use circular crop for profile areas
* Use full-card illustration for player card
* Keep edges clean and high contrast

---

# CONTENT TONE

Microcopy should sound:

* confident
* football-first
* premium
* short
* modern
* motivating

Example tone:

* Enter Lobby
* Create Match
* Share Card
* Verify Stats
* Build Teams
* Join Friends
* Unlock Badge

Avoid long, corporate explanations.

---

# RESPONSIVE BEHAVIOR

### Mobile

Primary design target.

### Tablet

Can expand spacing and show more columns.

### Desktop

Should still feel like a game lobby, but mobile remains the reference.

Important:

* Mobile screens should not feel like shrunken desktop screens
* Do not stack too many elements vertically
* Avoid long scrolls on the main home screen

---

# HOMEPAGE RULES

The home screen should:

* show the player identity first
* show the player card prominently
* show only a few key actions
* avoid a traditional app dashboard look
* avoid bottom navigation if possible
* feel like a game lobby or game hub

If navigation is needed, prefer:

* side rail
* floating action cards
* compact top icons
* swipe-based panels

---

# DO NOT USE

* cluttered dashboards
* heavy card stacking
* too many menus
* long onboarding walls
* generic social app patterns
* outdated sports booking layouts
* childish gamification
* excessive gradients
* overuse of neon everywhere
* dense text blocks

---

# FINAL PRODUCT FEEL

When users see STRYK, they should feel:

* This is my football identity.
* This is my player card.
* This is where my football journey lives.
* This is where my squad organizes.
* This is where my match history becomes real.
* This is where my reputation grows.

STRYK should feel like a premium football universe, not a utility app.

---

# BUILDING PRIORITY

Focus in this order:

1. Login / Auth
2. Profile creation
3. Player card
4. Friends system
5. Lobby dashboard
6. Lobby detail
7. Team builder
8. Post-game stats
9. Verification
10. Match history

End of design spec.
