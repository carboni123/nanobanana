# Tech Lead Role Summary

## Role Overview

As Tech Lead for NanoBanana, I am responsible for technical implementation, architecture decisions, and code quality across the platform.

## Primary Responsibilities

### 1. Implementation
- Write production-quality Python/FastAPI code for the backend API
- Implement database models and migrations with Alembic
- Build authentication, API key management, and image generation features
- Integrate with Google Gemini API and Cloudflare R2 storage

### 2. Technical Decisions
- Choose appropriate patterns and libraries for the tech stack
- Design API endpoints and data models
- Define caching strategies with Redis
- Establish rate limiting implementation (sliding window algorithm)

### 3. Quality Assurance
- Enforce quality gates: `ruff check`, `mypy`, `pytest`
- Review code for security vulnerabilities (OWASP top 10)
- Ensure test coverage for critical paths
- Maintain clean, maintainable code without over-engineering

## Key Technical Decisions Made

| Decision | Rationale |
|----------|-----------|
| API key auth only | Reduces complexity for MVP; OAuth not needed for developer API |
| Sync images to R2 | Google URLs expire; self-hosted URLs provide reliability |
| Per-key, per-day usage tracking | Enables billing and abuse detection |
| Redis sliding window rate limiting | Accurate, efficient, handles distributed requests |

## Current Focus Areas

1. Core API infrastructure (FastAPI app setup, database connections)
2. API key generation and validation
3. Image generation endpoint wrapping Gemini
4. Usage tracking and rate limiting

## Quality Standards

- All code passes `ruff check app --fix`
- All code passes `mypy app` type checking
- All features have corresponding tests in `pytest`
- No security vulnerabilities in authentication or input handling
