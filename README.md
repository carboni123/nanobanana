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
- **Robust Error Handling**: Comprehensive handling of rate limits, quota exceeded, and API errors
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

**Infrastructure**: NanoBanana uses a PostgreSQL 18 database running in Docker on the `shared_infra` network. See [docs/task1_postgres_verification.md](docs/task1_postgres_verification.md) for infrastructure verification and health check details.

**Docker Compose Setup**:
```bash
# PostgreSQL is configured via docker-compose
cd infra
docker-compose -f docker-compose-postgres.yml up -d

# Verify database is running
docker ps --filter name=pg_server
```

**Run Migrations**:
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
| `size` | string | No | Image dimensions (default: `1024x1024`). Supported: `1024x1024` (1:1), `1280x896` (4:3 landscape), `896x1280` (3:4 portrait), `1408x768` (16:9 landscape), `768x1408` (9:16 portrait) |
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

**Error Responses:**

| Status Code | Description | When It Occurs |
|-------------|-------------|----------------|
| `400` | Bad Request | Invalid prompt, size, or style parameters |
| `401` | Unauthorized | Invalid or missing API key |
| `429` | Too Many Requests | Rate limit exceeded or quota exhausted |
| `502` | Bad Gateway | Upstream Gemini API error or service unavailable |
| `503` | Service Unavailable | Image generation service not configured |

**Example Error Response:**
```json
{
  "detail": "Rate limit exceeded. Please try again later. Details: Quota exceeded"
}
```

**Rate Limiting:**
- When you receive a `429` error, implement exponential backoff before retrying
- Rate limits are enforced per API key
- Check your usage dashboard to monitor quota consumption

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

## Error Handling

NanoBanana implements comprehensive error handling for all Gemini API scenarios:

### Error Types

| Error Category | HTTP Status | Description | Recommended Action |
|----------------|-------------|-------------|-------------------|
| **Rate Limit** | 429 | API rate limit exceeded or quota exhausted | Implement exponential backoff, retry after delay |
| **Client Error** | 400 | Invalid request parameters (prompt, size, style) | Fix request parameters and retry |
| **Authentication** | 401 | Invalid or revoked API key | Check API key validity |
| **Server Error** | 502 | Gemini API temporarily unavailable | Retry with exponential backoff |
| **Not Configured** | 503 | Service not properly configured | Contact support |

### Retry Strategy

When encountering errors, implement the following retry strategy:

```python
import time
import requests

def generate_with_retry(api_key, prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.post(
                "https://api.nanobanana.ai/v1/generate",
                headers={"Authorization": f"Bearer {api_key}"},
                json={"prompt": prompt}
            )

            if response.status_code == 429:
                # Rate limit - exponential backoff
                wait_time = (2 ** attempt) * 1  # 1s, 2s, 4s
                time.sleep(wait_time)
                continue
            elif response.status_code == 502:
                # Server error - retry with backoff
                wait_time = (2 ** attempt) * 2  # 2s, 4s, 8s
                time.sleep(wait_time)
                continue
            elif response.status_code >= 400:
                # Client error - don't retry
                response.raise_for_status()

            return response.json()

        except requests.exceptions.RequestException as e:
            if attempt == max_retries - 1:
                raise
            time.sleep(2 ** attempt)

    raise Exception("Max retries exceeded")
```

### Error Response Format

All errors return a consistent JSON format:

```json
{
  "detail": "Human-readable error message with context"
}
```

### Logging

All API errors are logged server-side with appropriate severity:
- **Warning**: Rate limit errors (transient, expected)
- **Error**: API errors (requires investigation)
- **Exception**: Unexpected errors (full stack trace captured)

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
├── infra/                    # Infrastructure configuration
│   ├── docker-compose-postgres.yml  # PostgreSQL setup
│   └── create_network.sh     # Network initialization
└── docs/
    ├── PRD.md               # Product requirements
    ├── infrastructure-status.md      # Infrastructure assessment
    └── task1_postgres_verification.md # Database health check
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
