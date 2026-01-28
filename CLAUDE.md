# CLAUDE.md - NanoBanana

## Project Overview

NanoBanana is a SaaS API that wraps Google Gemini's image generation, providing simple API key authentication for developers who don't want to deal with Google Cloud complexity.

## Tech Stack

- **Backend**: Python 3.12 + FastAPI
- **Database**: PostgreSQL
- **Cache**: Redis
- **Storage**: Cloudflare R2
- **Auth**: API keys (bearer tokens)

## Project Structure

```
nanobanana/
├── CLAUDE.md           # This file
├── COMPANY.md          # Company structure
├── docs/
│   └── PRD.md          # Product requirements
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── keys/
│   │   │   └── generate/
│   │   └── core/
│   ├── tests/
│   ├── alembic/
│   └── requirements.txt
└── frontend/           # Dashboard (v0.2)
```

## Development Commands

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Database
alembic upgrade head
alembic revision --autogenerate -m "description"

# Tests
pytest tests/
```

## Quality Gates

Before merging any code:
```bash
ruff check app --fix
mypy app
pytest tests/
```

## Key Decisions

1. **Simple auth**: API keys only (no OAuth complexity for MVP)
2. **Sync images to R2**: Don't proxy Google URLs (they expire)
3. **Usage tracking**: Per-key, per-day granularity
4. **Rate limiting**: Redis-based sliding window

## Environment Variables

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GOOGLE_API_KEY=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET=...
```
