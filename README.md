# NanoBanana

A simple SaaS API for AI image generation, powered by Google Gemini. NanoBanana handles the complexity of Google Cloud so developers can generate images with a single API call.

## Why NanoBanana?

Google Gemini offers powerful image generation, but integrating it requires:
- Setting up Google Cloud projects
- Managing service accounts and credentials
- Handling token refresh and authentication
- Dealing with expiring image URLs

NanoBanana wraps all of this into a simple REST API with straightforward API key authentication.

## Features

- **Simple Authentication**: Bearer token API keys (no OAuth complexity)
- **Flexible Image Storage**: Optional Cloudflare R2 storage for persistent URLs, with base64 fallback
- **Usage Tracking**: Per-key, per-day granularity for billing and analytics
- **Rate Limiting**: Redis-based sliding window rate limiting
- **Async Architecture**: Built on FastAPI with async PostgreSQL for high performance

## Quick Start

### Prerequisites

- Python 3.12+
- PostgreSQL
- Redis

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/nanobanana.git
cd nanobanana/backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nanobanana
REDIS_URL=redis://localhost:6379
GOOGLE_API_KEY=your-google-gemini-api-key
R2_ACCESS_KEY=your-cloudflare-r2-access-key
R2_SECRET_KEY=your-cloudflare-r2-secret-key
R2_BUCKET=nanobanana-images
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

**Google Gemini API Setup**: See [backend/GOOGLE_API_SETUP.md](backend/GOOGLE_API_SETUP.md) for detailed instructions on obtaining and configuring your Google Gemini API key.

**R2 Storage Setup**: See [backend/docs/R2_STORAGE_CONFIGURATION.md](backend/docs/R2_STORAGE_CONFIGURATION.md) for R2 configuration instructions. Note: R2 is optional - the system will use base64 fallback if not configured.

### Database Setup

```bash
# Run migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "description"
```

### Running the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for interactive API documentation.

## API Reference

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

### Generate Image

```http
POST /v1/generate
Authorization: Bearer <api_key>
Content-Type: application/json

{
  "prompt": "A cute banana wearing sunglasses",
  "size": "1024x1024",
  "style": "natural"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prompt` | string | Yes | Description of the image to generate |
| `size` | string | No | Image dimensions (default: `1024x1024`) |
| `style` | string | No | `natural` or `artistic` (default: `natural`) |

**Response:**
```json
{
  "id": "gen_abc123",
  "url": "https://cdn.nanobanana.ai/images/abc123.png",
  "prompt": "A cute banana wearing sunglasses",
  "created_at": "2025-01-27T12:00:00Z"
}
```

### Authentication Endpoints

```http
POST /v1/auth/register    # Create a new account
POST /v1/auth/login       # Get access token
```

### API Key Management

```http
POST   /v1/keys           # Create a new API key
GET    /v1/keys           # List all API keys
DELETE /v1/keys/{key_id}  # Revoke an API key
```

## Project Structure

```
nanobanana/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application entry point
│   │   ├── config.py         # Configuration and settings
│   │   ├── database.py       # SQLAlchemy setup
│   │   ├── models/           # Database models
│   │   │   ├── user.py       # User accounts
│   │   │   ├── api_key.py    # API key management
│   │   │   └── usage.py      # Usage tracking
│   │   ├── features/         # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── keys/         # API key management
│   │   │   └── generate/     # Image generation
│   │   └── core/             # Shared utilities
│   ├── tests/                # Test suite
│   ├── alembic/              # Database migrations
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Dashboard (v0.2)
└── docs/
    └── PRD.md               # Product requirements
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 (async) |
| Cache & Rate Limiting | Redis |
| Object Storage | Cloudflare R2 |
| Image Generation | Google Gemini |
| Type Checking | mypy |
| Linting | ruff |
| Testing | pytest |

## Development

### Running Tests

```bash
pytest tests/
```

### Code Quality

Run these before committing:

```bash
# Lint and auto-fix
ruff check app --fix

# Type checking
mypy app

# Run tests
pytest tests/
```

### Database Models

**User**: Account management with email/password authentication

**ApiKey**: Secure API keys with:
- Hashed storage (full key shown only once at creation)
- Public prefix for display (e.g., `nb_abc1...`)
- Optional expiration dates
- Active/revoked status

**Usage**: Daily usage tracking per API key for rate limiting and billing

## Pricing

| Tier | Price | Images/month | Rate Limit |
|------|-------|--------------|------------|
| Free | $0 | 50 | 10/hour |
| Hobby | $9/mo | 500 | 100/hour |
| Pro | $29/mo | 2,000 | 500/hour |
| Pay-as-you-go | $0.02/image | Unlimited | 1,000/hour |

## Security

- API keys are hashed before storage (never stored in plaintext)
- Passwords hashed with bcrypt
- Bearer token authentication
- Rate limiting prevents abuse
- Images stored on private R2 bucket with signed URLs

## Roadmap

### v0.1 (MVP)
- [x] Database models
- [ ] User registration and login
- [ ] API key generation
- [ ] Image generation endpoint
- [ ] Basic rate limiting

### v0.2
- [ ] Web dashboard
- [ ] Usage statistics
- [ ] Billing integration

### Future
- [ ] Multiple image generation
- [ ] Image editing/inpainting
- [ ] Webhook notifications
- [ ] Team accounts

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run quality gates (`ruff check app --fix && mypy app && pytest tests/`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and feature requests, please open a GitHub issue.
