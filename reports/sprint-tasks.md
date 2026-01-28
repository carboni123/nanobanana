# Sprint Tasks - End-to-End MVP

**Assigned By:** CTO Agent
**Date:** 2026-01-28
**Objective:** Complete NanoBanana end-to-end flow

---

## Priority 1A: API Key Management

**Assignee:** Tech Lead
**Status:** NOT STARTED
**Commit after completion for QA review**

### Deliverables

Create the following files in `backend/app/features/keys/`:

#### 1. `__init__.py`
Empty package marker.

#### 2. `schemas.py`
```python
# Pydantic models needed:
# - CreateKeyRequest: name (str, optional)
# - CreateKeyResponse: id, key (full key - only shown once!), name, prefix, created_at
# - KeyResponse: id, name, prefix, is_active, last_used_at, created_at (NO full key)
# - KeyListResponse: list of KeyResponse
```

#### 3. `service.py`
```python
# Functions needed:
# - generate_api_key() -> tuple[str, str, str]
#   Returns: (full_key, key_hash, prefix)
#   Format: nb_live_<32 random hex chars>
#   Prefix: first 8 chars of full key (nb_live_)
#   Hash: SHA-256 of full key

# - create_api_key(db, user_id, name) -> ApiKey model
#   Creates new API key record in database

# - get_user_keys(db, user_id) -> list[ApiKey]
#   Returns all keys for a user

# - get_key_by_hash(db, key_hash) -> ApiKey | None
#   For validating incoming API keys

# - revoke_key(db, key_id, user_id) -> bool
#   Soft delete (set is_active=False)
```

#### 4. `dependencies.py`
```python
# - get_api_key_from_header(request) -> ApiKey
#   Extracts Bearer token from Authorization header
#   Hashes it and looks up in database
#   Returns ApiKey model or raises 401
#   Updates last_used_at on valid key
```

#### 5. `api.py`
```python
# Endpoints (all require JWT auth via get_current_user dependency):
# - POST /v1/keys -> CreateKeyResponse
#   Creates new API key for authenticated user
#   Returns FULL key (only time it's shown)

# - GET /v1/keys -> KeyListResponse
#   Lists all keys for authenticated user

# - DELETE /v1/keys/{key_id} -> 204 No Content
#   Revokes key (set is_active=False)
#   Only owner can revoke their keys
```

#### 6. Register router in `main.py`
Uncomment and fix the keys router import.

### Acceptance Criteria

- [ ] `POST /v1/keys` with valid JWT creates key and returns full key string
- [ ] Full key is ONLY returned on creation (never again)
- [ ] `GET /v1/keys` returns list of keys (prefix only, not full key)
- [ ] `DELETE /v1/keys/{id}` sets is_active=False
- [ ] Key format: `nb_live_<32 hex chars>` (40 chars total)
- [ ] Key hash is SHA-256, stored in database
- [ ] Invalid JWT returns 401
- [ ] Revoking another user's key returns 404

---

## Priority 1B: Image Generation Endpoint

**Assignee:** Tech Lead
**Status:** BLOCKED (needs Priority 1A)
**Commit after completion for QA review**

### Deliverables

Create the following files in `backend/app/features/generate/`:

#### 1. `__init__.py`
Empty package marker.

#### 2. `schemas.py`
```python
# Pydantic models (per PRD spec):
# - GenerateRequest:
#   prompt: str (required)
#   size: str = "1024x1024" (optional)
#   style: str = "natural" (optional, enum: natural, artistic)

# - GenerateResponse:
#   id: str (format: gen_<uuid>)
#   url: str (R2 CDN URL or fallback)
#   prompt: str
#   created_at: datetime
```

#### 3. `service.py`
```python
# Core functions:

# - generate_image(prompt, size, style) -> bytes
#   Calls Google Gemini API (google.genai)
#   Returns raw image bytes
#   Raises HTTPException 503 if GOOGLE_API_KEY not configured
#   Raises HTTPException 502 if Gemini API fails

# - upload_to_r2(image_bytes, filename) -> str
#   Uploads to Cloudflare R2 using boto3 (S3-compatible)
#   Returns public URL
#   If R2 not configured, return None (fallback to base64)

# - record_usage(db, api_key_id) -> None
#   Increment usage count for today
#   Use UPSERT pattern (insert or update existing record)
```

#### 4. `api.py`
```python
# Endpoint:
# - POST /v1/generate
#   Requires API key auth (via keys/dependencies.py)
#   Validates request body
#   Calls generate_image()
#   Uploads to R2 (or returns base64 as fallback)
#   Records usage
#   Returns GenerateResponse
```

#### 5. Register router in `main.py`
Uncomment and fix the generate router import.

### Gemini Integration Notes

Use the `google-genai` package (already installed):

```python
from google import genai

client = genai.Client(api_key=settings.GOOGLE_API_KEY)

# For image generation, use Imagen model
response = client.models.generate_images(
    model="imagen-3.0-generate-002",
    prompt=prompt,
    config=genai.types.GenerateImagesConfig(
        number_of_images=1,
        output_mime_type="image/png",
    ),
)

# Response contains image bytes in response.generated_images[0].image.image_bytes
```

### R2 Integration Notes

Use boto3 with S3-compatible endpoint:

```python
import boto3

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=settings.R2_ACCESS_KEY,
    aws_secret_access_key=settings.R2_SECRET_KEY,
)

s3.put_object(
    Bucket=settings.R2_BUCKET,
    Key=f"images/{filename}",
    Body=image_bytes,
    ContentType="image/png",
)

# Public URL (requires R2 bucket to have public access)
url = f"https://{settings.R2_BUCKET}.{settings.R2_ACCOUNT_ID}.r2.dev/images/{filename}"
```

### Acceptance Criteria

- [ ] `POST /v1/generate` with valid API key returns image URL
- [ ] Invalid API key returns 401
- [ ] Revoked (is_active=False) API key returns 401
- [ ] Missing prompt returns 422
- [ ] Usage record created/updated for the API key
- [ ] If GOOGLE_API_KEY missing, returns 503 with clear message
- [ ] If R2 not configured, endpoint still works (base64 fallback acceptable)

---

## Priority 1C: Tests

**Assignee:** Tech Lead
**Status:** BLOCKED (needs P1A and P1B)
**Commit with previous priorities or separately**

### Test Files to Create

#### `backend/tests/test_keys.py`
```python
# Test cases:
# - test_create_key_success
# - test_create_key_unauthorized (no JWT)
# - test_list_keys_empty
# - test_list_keys_returns_prefix_not_full_key
# - test_delete_key_success
# - test_delete_key_not_owner (404)
# - test_key_format (starts with nb_live_)
```

#### `backend/tests/test_generate.py`
```python
# Test cases (mock Gemini API):
# - test_generate_success (mock Gemini response)
# - test_generate_invalid_api_key
# - test_generate_missing_prompt
# - test_generate_usage_recorded
# - test_generate_revoked_key_rejected
```

### Acceptance Criteria

- [ ] All new tests pass
- [ ] Existing auth tests still pass
- [ ] `pytest tests/` exits with code 0

---

## QA Review Checkpoints

### After Priority 1A Commit

**Assignee:** QA Engineer
**Focus:** API Key Security

- [ ] Keys are properly hashed (SHA-256)
- [ ] Full key only returned on creation
- [ ] Prefix stored separately for display
- [ ] No key leakage in logs or error messages
- [ ] `ruff check app --fix` passes
- [ ] `mypy app` passes

### After Priority 1B Commit

**Assignee:** QA Engineer
**Focus:** End-to-End Flow

Manual test sequence:
```bash
# 1. Register
curl -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'

# 2. Login (or use token from register)
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
# Save the token

# 3. Create API key
curl -X POST http://localhost:8000/v1/keys \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Test Key"}'
# Save the full API key (nb_live_xxx)

# 4. Generate image
curl -X POST http://localhost:8000/v1/generate \
  -H "Authorization: Bearer <api_key>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cute banana wearing sunglasses"}'
# Should return image URL
```

- [ ] Complete flow works
- [ ] Error messages are helpful (not stack traces)
- [ ] `pytest tests/` all pass
- [ ] Quality gates pass (ruff, mypy)

---

## Workflow Summary

```
Tech Lead                          QA Engineer
    │                                   │
    ├── Implement P1A ──────────────────┼── Review P1A commit
    │                                   │
    ├── Implement P1B ──────────────────┼── Review P1B commit
    │                                   │
    ├── Implement P1C (tests) ──────────┼── Final E2E test
    │                                   │
    └── Done ───────────────────────────┴── Approve release
```

---

**CTO Agent**
**Last Updated:** 2026-01-28
