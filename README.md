# STRYK

STRYK is a football identity platform for real football players. It combines FIFA-style player cards, verified match stats, match lobbies, team building, and AI football insights.

## Repository Layout

```text
stryk/
|-- frontend/          Next.js app, UI, static assets
|-- backend/           FastAPI app, API routes, models, services
|-- docs/              Product, design, and architecture references
|-- .github/           GitHub Actions workflows
|-- CNAME              GitHub Pages custom domain
|-- README.md          Project overview
`-- LICENSE
```

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

Local app: `http://localhost:3000`

Useful commands:

```powershell
npm run build
npm run lint
```

## Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload
```

Local API: `http://localhost:8000`

Useful endpoints:

```text
GET /health
GET /docs
GET /api/v1/players/me
POST /api/v1/players/
PATCH /api/v1/players/me
```

## Current Stack

See [docs/TECH_STACK.md](docs/TECH_STACK.md) for the official V1 stack and module plan.

Short version:

```text
Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
Backend: FastAPI, Python, SQLModel/SQLAlchemy
Auth: Clerk for identities, sessions, email/password, and Google login
Database: PostgreSQL for football profile data, SQLite local fallback
Cloud: Azure Static Web Apps, Azure App Service, Azure PostgreSQL
AI: Azure OpenAI primary, Gemini secondary
```

## Notes

- `docs/figma-export/` contains the original Figma-generated reference project. It is kept as design/source reference, not as the active frontend app.
- `backend/stryk.db` is a local development database and should not be committed.
- GitHub Pages currently deploys the static frontend export for `stryk.games`.
