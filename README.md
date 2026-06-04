# ⚡ STRYK

> The ultimate football social platform — build your player identity, find matches, and compete.

## 🏗️ Monorepo Structure

```
stryk/
├── frontend/          # Next.js 15 + TypeScript + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   └── components/# UI components & context
│   ├── public/        # Static assets
│   └── package.json
│
├── backend/           # Python FastAPI
│   ├── app/
│   │   ├── api/       # Route handlers
│   │   ├── core/      # Config, auth, database
│   │   ├── models/    # SQLModel schemas
│   │   └── services/  # Business logic (AI, etc.)
│   ├── requirements.txt
│   └── .env.example
│
└── .gitignore
```

## 🚀 Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev          # → http://localhost:3000
```

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env      # Fill in your keys
uvicorn app.main:app --reload  # → http://localhost:8000
```

## 🔧 Tech Stack

| Layer        | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js, TypeScript, Tailwind, shadcn/ui, Framer Motion |
| Backend     | Python FastAPI                    |
| Database    | PostgreSQL (Supabase)             |
| Auth        | Clerk                             |
| AI          | OpenAI, Gemini, Replicate, LangGraph |
| Storage     | Cloudinary                        |
| Hosting     | Vercel (FE) + Railway (BE)        |
| Monitoring  | Sentry                            |
| Analytics   | PostHog                           |

## 📄 License

Private — All rights reserved.
