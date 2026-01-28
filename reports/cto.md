# CTO / Product Owner - Role Summary

## Role Definition

As CTO and Product Owner of NanoBanana, I am responsible for:

1. **Technical Architecture** - Designing and maintaining the system architecture that enables our simple API-first product
2. **Product Roadmap** - Defining what we build and when, balancing user needs with technical feasibility
3. **Feature Prioritization** - Making tradeoff decisions about scope, quality, and timeline

## Current Technical Architecture

```
Client (API Key) → NanoBanana API (FastAPI) → Google Gemini API
                         │
                   ┌─────┴─────┐
                   │           │
              PostgreSQL    Redis
              (persistence) (rate limiting)
                   │
              Cloudflare R2
              (image storage)
```

### Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Backend | Python 3.12 + FastAPI | Fast development, async support, excellent typing |
| Database | PostgreSQL | Reliability, JSON support for flexible schemas |
| Cache | Redis | Industry standard for rate limiting, session management |
| Storage | Cloudflare R2 | S3-compatible, no egress fees, global CDN |
| Deployment | Railway / Fly.io | Simple deployment, good free tiers for MVP |

## Product Roadmap

### Phase 1: MVP (v0.1) - Current Focus

**Goal**: Minimal viable product with core image generation capability

Features:
- User registration (email/password)
- API key generation and management
- Image generation endpoint (`POST /v1/generate`)
- Usage tracking per API key
- Rate limiting (Redis sliding window)
- IP-based rate limiting on auth endpoints (security baseline)

**Launch Configuration**: Free tier only (50 images/month) to validate product-market fit before adding payment complexity.

### Phase 2: Dashboard (v0.2)

- Web dashboard for usage statistics
- API key management UI
- Usage history and graphs

### Phase 3: Monetization (v0.3)

- Stripe integration
- Paid tiers (Hobby $9/mo, Pro $29/mo, Pay-as-you-go)
- Billing history and invoices

### Phase 4: Growth (v1.0+)

- Multiple AI provider support (fallback, choice)
- Image editing/inpainting
- Team accounts
- Webhook notifications

## Feature Prioritization Framework

Using RICE scoring (Reach × Impact × Confidence / Effort):

| Feature | Priority | Rationale |
|---------|----------|-----------|
| API key auth | P0 | Core value prop - must have |
| Image generation | P0 | Core value prop - must have |
| Rate limiting | P0 | Prevent abuse, protect costs |
| Usage tracking | P1 | Needed for billing, user trust |
| Dashboard | P2 | API-first users don't need immediately |
| Billing | P2 | Launch free-only to reduce scope |

## Key Technical Decisions

### 1. Image Storage Policy
- **Decision**: 30-day retention for free tier, permanent for paid
- **Rationale**: Balances R2 costs with user expectations
- **Implementation**: Add `expires_at` field to images table, background job for cleanup

### 2. Google API Resilience
- **Decision**: Circuit breaker pattern + secondary GCP project
- **Rationale**: Single point of failure is unacceptable for production API
- **Implementation**: Use `circuitbreaker` library, configure failover in config

### 3. Authentication Strategy
- **Decision**: API keys only (no OAuth) for MVP
- **Rationale**: Simplicity is our value prop; OAuth adds complexity users are trying to avoid
- **Future**: Consider OAuth for dashboard in v0.2 if needed

### 4. Content Moderation
- **Decision**: Rely on Google's built-in moderation for MVP
- **Rationale**: Google already filters prompts; adding our own layer is premature
- **Future**: Add custom filters if abuse patterns emerge

## Quality Gates

All code must pass before merging:
```bash
ruff check app --fix  # Linting
mypy app              # Type checking
pytest tests/         # Test suite
```

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google API outage | Medium | High | Circuit breaker, queue + retry |
| Google account suspension | Low | Critical | Secondary GCP project ready |
| Image storage costs spiral | Medium | Medium | Retention policy, usage alerts |
| Rate limit bypass | Medium | High | Multi-layer limiting (IP + key) |

## Communication

I report to the CEO on product direction and business priorities. I provide technical specs and architecture decisions to the Tech Lead for implementation. I work with QA Engineer to ensure quality gates are maintained.

---

*Last updated: 2026-01-28*
