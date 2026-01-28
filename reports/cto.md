# Tech Lead Priority Assessment - Sprint 1

**Date:** 2026-01-28
**Sprint Goal:** MVP Foundation
**Prepared by:** CTO Agent

---

## Current State

### ✅ Completed Infrastructure
- Database models fully defined (User, ApiKey, Usage)
- SQLAlchemy with async support configured
- Application config with environment variable support
- Basic FastAPI app structure with health endpoint
- Requirements.txt with all necessary dependencies

### ❌ Missing Core Features
The application has solid foundations but **zero functional endpoints**. All business logic must be implemented from scratch.

---

## Recommended Priority Order for Tech Lead

### **PRIORITY 1: Database Migration Setup** ⚡ START HERE
**Estimated Time:** 30 minutes
**Blocking:** Everything else depends on having a working database

**Why First:**
- Models exist but tables don't
- Can't test auth without database
- Alembic is installed but not initialized

**Tasks:**
1. Run `alembic init alembic` to create migration infrastructure
2. Configure `alembic.ini` with async database URL
3. Generate initial migration from existing models
4. Create `scripts/init-db.sh` for local development setup

**Acceptance Criteria:**
- Running `alembic upgrade head` creates all tables
- Database schema matches models (users, api_keys, usage)

---

### **PRIORITY 2: User Registration & Login** 🔐
**Estimated Time:** 2-3 hours
**Why Second:** Foundation for all API key operations

**Implementation Notes:**
- Create `backend/app/features/auth/` directory structure
- Files needed:
  - `api.py` - FastAPI router with `/register` and `/login` endpoints
  - `schemas.py` - Pydantic models for request/response
  - `service.py` - Business logic (password hashing, JWT creation)
  - `dependencies.py` - Auth middleware for protected routes

**Security Requirements:**
- Use `passlib[bcrypt]` for password hashing (already in requirements)
- JWT tokens via `python-jose` (already in requirements)
- Email validation via Pydantic
- **IP-based rate limiting on registration/login** (critical per CTO notes in PRD)

**Acceptance Criteria:**
- `POST /v1/auth/register` creates user with hashed password
- `POST /v1/auth/login` returns JWT token
- Invalid credentials return 401
- Duplicate email returns 409
- Passwords never logged or returned in responses

---

### **PRIORITY 3: API Key Generation & Management** 🔑
**Estimated Time:** 2-3 hours
**Why Third:** Core product value - developers need API keys to use the service

**Implementation Notes:**
- Create `backend/app/features/keys/` directory structure
- Files needed:
  - `api.py` - Routes for creating/listing/revoking keys
  - `schemas.py` - Request/response models
  - `service.py` - Key generation logic

**Key Format Specification:**
```
nb_live_1234567890abcdef1234567890abcdef  # Production
nb_test_1234567890abcdef1234567890abcdef  # Testing
```
- Prefix: `nb_` (NanoBanana)
- Environment: `live_` or `test_`
- Random: 32 hex characters
- Store: Only hash in database (like passwords)
- Display: Show prefix + first 8 chars (e.g., "nb_live_12345678...")

**Endpoints:**
- `POST /v1/keys` - Create new API key (protected)
- `GET /v1/keys` - List user's keys (protected)
- `DELETE /v1/keys/{key_id}` - Revoke key (protected)

**Acceptance Criteria:**
- User can create multiple named keys
- Raw key shown only once at creation
- Key hash stored securely
- Keys can be listed and revoked
- Prefix stored separately for display

---

### **PRIORITY 4: Generate Endpoint (Stub)** 🎨
**Estimated Time:** 1-2 hours
**Why Fourth:** Proves end-to-end flow without Gemini complexity

**Implementation Notes:**
- Create `backend/app/features/generate/` directory
- **Do NOT integrate Google Gemini yet** - that's Sprint 2
- Return mock image URL

**Stub Implementation:**
```python
POST /v1/generate
Headers: Authorization: Bearer <api_key>
Body: {"prompt": "A cute banana", "size": "1024x1024"}

Response: {
  "id": "gen_abc123",
  "url": "https://placekitten.com/1024/1024",  # Placeholder
  "prompt": "A cute banana",
  "created_at": "2026-01-28T12:00:00Z"
}
```

**Critical Requirements:**
- Validate API key from header
- Update `api_keys.last_used_at`
- Increment usage counter in `usage` table
- Rate limit enforcement (placeholder - just check, don't block yet)

**Acceptance Criteria:**
- Endpoint requires valid API key
- Invalid/missing key returns 401
- Updates usage tracking
- Returns consistent response format
- Ready for Gemini integration in Sprint 2

---

### **PRIORITY 5: Integration & Testing** ✅
**Estimated Time:** 1 hour
**Why Last:** Verify everything works together

**Tasks:**
1. Wire up all routers in `main.py`
2. Test full flow: register → login → create key → generate
3. Create `scripts/manual-test.sh` with curl commands
4. Document API in README

**Handoff to QA:**
Once this is complete, hand off to QA agent for:
- Edge case testing
- Security review
- Test coverage analysis
- Performance baseline

---

## Technical Guidance

### Project Structure Pattern
```
backend/app/features/
  auth/
    __init__.py
    api.py          # FastAPI router
    schemas.py      # Pydantic models
    service.py      # Business logic
    dependencies.py # Auth middleware
  keys/
    __init__.py
    api.py
    schemas.py
    service.py
  generate/
    __init__.py
    api.py
    schemas.py
    service.py
```

### Error Handling Standard
```python
from fastapi import HTTPException

# Use standard HTTP codes
raise HTTPException(status_code=401, detail="Invalid API key")
raise HTTPException(status_code=409, detail="Email already registered")
raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

### Testing Approach
- Unit tests for service layer logic
- Integration tests for database operations
- API tests for endpoint contracts
- Security tests for auth flows

---

## Blockers & Dependencies

### Before Starting:
- **Ensure PostgreSQL is running locally**
- **Set environment variables in `.env`**:
  ```
  DATABASE_URL=postgresql+asyncpg://localhost/nanobanana
  REDIS_URL=redis://localhost:6379
  SECRET_KEY=<generate-random-key>
  ```

### Out of Scope (Sprint 2):
- Google Gemini integration
- Cloudflare R2 storage
- Advanced rate limiting (Redis-based)
- Payment/billing (Stripe)

---

## Success Criteria

Sprint 1 is complete when:
- ✅ User can register and login
- ✅ User can create and manage API keys
- ✅ Generate endpoint accepts requests and tracks usage
- ✅ Database persists all data correctly
- ✅ All tests pass (per QA review)
- ✅ API documented with curl examples

---

## Estimated Timeline

| Task | Time | Cumulative |
|------|------|------------|
| Database migrations | 0.5h | 0.5h |
| Auth endpoints | 3h | 3.5h |
| API key management | 3h | 6.5h |
| Generate stub | 2h | 8.5h |
| Integration & docs | 1h | 9.5h |

**Total:** ~10 hours (1.5 days for focused work)

---

## Questions for Tech Lead

1. **Database setup:** Do you have PostgreSQL running locally? Need help with Docker setup?
2. **Environment:** Should we create a `.env.example` file for other developers?
3. **Testing:** Prefer pytest or manual testing first?

---

**Recommendation:** Start with Priority 1 (database migrations) immediately. This unblocks all other work and provides early validation that the data layer is correct.
