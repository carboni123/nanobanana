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
- [ ] User registration (email/password)
- [ ] API key generation and management
- [ ] Image generation endpoint (`POST /v1/generate`)
- [ ] Usage tracking per API key
- [ ] Rate limiting

### API Specification

```
POST /v1/generate
Headers:
  Authorization: Bearer <api_key>
Body:
  {
    "prompt": "A cute banana wearing sunglasses",
    "size": "1024x1024",  // optional
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
- **Deployment**: Railway / Fly.io

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

## Out of Scope (v1)

- Image editing/inpainting
- Video generation
- Multiple AI providers
- Team accounts
- Self-hosted option
