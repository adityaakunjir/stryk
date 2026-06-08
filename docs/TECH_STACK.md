# STRYK Tech Stack V1

## Product

STRYK is a football identity platform inspired by FIFA Ultimate Team and eFootball for real football players.

Core features:

- Authentication
- Player profiles
- FIFA-style player cards
- Friends system
- Match lobbies
- Team builder
- Match statistics
- Community verification
- Rating engine
- AI scout reports
- AI match summaries

## Frontend

- Framework: Next.js
- Language: TypeScript
- Styling: Tailwind CSS
- UI components: shadcn/ui
- Animations: Framer Motion
- Icons: Lucide React
- State management: Zustand
- Forms: React Hook Form
- Validation: Zod

## Backend

- Framework: FastAPI
- Language: Python 3.12+
- Server: Uvicorn
- Data validation: Pydantic
- API docs: Swagger
- Authentication: Clerk
- Password hashing: Passlib + BCrypt

## Database

- Database: PostgreSQL
- ORM: SQLAlchemy / SQLModel
- Migrations: Alembic
- Hosting: Azure Database for PostgreSQL

## Authentication

Provider:

- Clerk

Features:

- Email login
- Password login
- Google login
- Session management
- User management

Data ownership:

- Clerk stores authentication identities.
- PostgreSQL stores football profile data.

## Cloud Infrastructure

- Frontend hosting: Vercel (or Railway)
- Backend hosting: Railway
- Database: Railway PostgreSQL
- Storage: Amazon S3 / R2
- Monitoring: Sentry
- CI/CD: GitHub Actions
- Version control: GitHub

## Storage

Azure Blob Storage is used for:

- User profile pictures
- Player card images
- Generated AI avatars
- Future match media

## AI Stack

Primary:

- Azure OpenAI

Secondary:

- Gemini

Uses:

- AI scout reports
- AI match summaries
- AI position recommendations
- AI archetype detection
- AI football insights

## Future AI Image Generation

Phase 1:

- Normal user profile pictures

Phase 2:

- Anime football avatar generation

Possible future providers:

- Replicate
- Fal AI
- Open-source Stable Diffusion models

This is not part of the MVP.

## Core Database Tables

- Users
- PlayerProfiles
- PlayerCards
- Friends
- FriendRequests
- Matches
- MatchPlayers
- Teams
- MatchStats
- StatClaims
- StatVotes
- Achievements
- Notifications
- AIReports

## Core Modules

- Authentication module
- Player profile module
- Player card module
- Friends module
- Match lobby module
- Team builder module
- Stats submission module
- Verification module
- Rating engine module
- AI insights module
- Notification module

## Rating Engine

Users do not manually assign:

- Pace
- Shooting
- Passing
- Dribbling
- Defending
- Physical
- OVR

The system automatically calculates ratings based on:

- Verified goals
- Verified assists
- Verified saves
- Verified tackles
- MVP awards
- Consistency
- Reliability

## Verification System

Purpose: prevent fake statistics.

Flow:

1. Player submits performance.
2. Match participants vote correct or incorrect.
3. A minimum 60% positive vote rate is required.
4. Only verified stats affect player ratings.
