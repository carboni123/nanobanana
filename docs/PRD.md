# NanoBanana - Product Requirements Document

## Vision

Make AI image generation accessible to everyone through a dead-simple API, without requiring Google Cloud accounts or complex billing setups.

## Problem Statement

Google's Gemini API offers powerful image generation (Imagen), but:
- Requires Google Cloud account setup
- Complex billing configuration
- OAuth/service account authentication
- Overwhelming documentation for simple use cases

**Target Users:**
- Indie developers building side projects
- Small startups needing quick image generation
- Hobbyists experimenting with AI
- Agencies needing simple API access for clients

## Solution

**NanoBanana API** - A proxy service that:
1. Provides simple API key authentication
2. Wraps Google Gemini's image generation
3. Handles all Google Cloud complexity internally
4. Offers pay-as-you-go pricing (simpler than Google's)

## MVP Features (v0.1)

### Core
- [x] User registration (email/password)
- [x] API key generation and management
- [x] Image generation endpoint (`POST /v1/generate`)
- [x] Usage tracking per API key
- [x] Rate limiting
- [x] Error handling for Gemini API (rate limits, quota exceeded, server errors)

### API Specification

```
POST /v1/generate
Headers:
  Authorization: Bearer <api_key>
Body:
  {
    "prompt": "A cute banana wearing sunglasses",
    "size": "1024x1024",  // optional - supported: 1024x1024, 1280x896, 896x1280, 1408x768, 768x1408
    "style": "natural"     // optional: natural, artistic
  }
Response:
  {
    "id": "gen_abc123",
    "url": "https://cdn.nanobanana.ai/images/abc123.png",
    "prompt": "A cute banana wearing sunglasses",
    "created_at": "2025-01-27T12:00:00Z"
  }
```

### Dashboard (v0.2)
- View usage statistics
- Manage API keys
- Billing history

## Technical Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Client    │────▶│  NanoBanana API │────▶│ Google Gemini│
│  (API Key)  │     │   (FastAPI)     │     │     API      │
└─────────────┘     └─────────────────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │  PostgreSQL │
                    │  (users,    │
                    │   keys,     │
                    │   usage)    │
                    └─────────────┘
```

### Stack
- **Backend**: Python + FastAPI
- **Database**: PostgreSQL
- **Cache**: Redis (rate limiting)
- **Storage**: Cloudflare R2 (generated images)
- **Deployment**: Raspberry Pi 4 (self-hosted) / Railway / Fly.io
- **AI Provider**: Google Gemini API (Imagen 3.0)

**Infrastructure Status**: See [infrastructure-status.md](infrastructure-status.md) for production environment verification and system capacity assessment.

**API Credentials**: See [API_CREDENTIALS_REQUIREMENTS.md](API_CREDENTIALS_REQUIREMENTS.md) for required credentials setup and configuration.

## Business Model

### Pricing (Draft)
| Tier | Price | Images/month | Rate Limit |
|------|-------|--------------|------------|
| Free | $0 | 50 | 10/hour |
| Hobby | $9/mo | 500 | 100/hour |
| Pro | $29/mo | 2000 | 500/hour |
| Pay-as-you-go | $0.02/image | Unlimited | 1000/hour |

### Margins
- Google Gemini cost: ~$0.01-0.02/image
- Our markup: 50-100%
- Volume discounts from Google improve margins at scale

## Success Metrics

- **North Star**: Monthly Active API Keys
- **Leading**: Signups, first API call within 24h
- **Lagging**: MRR, churn rate

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1. Foundation | Week 1 | Auth, API key management, basic endpoint |
| 2. Integration | Week 2 | Gemini integration, image storage |
| 3. Polish | Week 3 | Rate limiting, usage tracking, docs |
| 4. Launch | Week 4 | Landing page, beta launch |

## Open Questions

1. How do we handle Google API outages? (Queue + retry?)
2. Image storage: CDN cache duration? Permanent storage?
3. Content moderation: Use Google's built-in or add our own layer?

## Resolved Questions

1. **API Credentials Setup**: Documented in [API_CREDENTIALS_REQUIREMENTS.md](API_CREDENTIALS_REQUIREMENTS.md)
   - Google Gemini API key (REQUIRED) - Blocks core functionality if missing
   - Cloudflare R2 storage (OPTIONAL) - Base64 fallback available

## Out of Scope (v1)

- Image editing/inpainting
- Video generation
- Multiple AI providers
- Team accounts
- Self-hosted option

## CTO Assessment

- **Scope is appropriately minimal**: The MVP correctly focuses on the core value prop (simple API keys → image generation). Deferring dashboard to v0.2 is the right call—API-first users won't need it immediately.

- **Critical missing piece: Billing integration**: Payment processing (Stripe) isn't mentioned in MVP features but is implicit in the pricing tiers. Clarify: is v0.1 free-only, or do we need Stripe integration before launch? Recommend launching with free tier only to reduce Week 1-3 scope.

- **Risk: Google API dependency**: The "Open Questions" section flags outages but doesn't address API quota limits or account suspension risk. We should have a second Google Cloud project as failover, and implement circuit breaker pattern in the Gemini integration layer.

- **Image storage policy needs decision now**: R2 storage costs scale linearly with usage. Recommend 30-day retention for free tier, permanent for paid. This affects database schema (need `expires_at` field) and should be decided before Week 2 integration work.

- **Rate limiting before auth is a security gap**: The PRD lists rate limiting as Week 3, but we need IP-based rate limiting on registration/login endpoints from Day 1 to prevent credential stuffing and abuse. Move basic IP throttling to Week 1.
