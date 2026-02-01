# Task 1: Verify Google Gemini API Credentials Configuration

## Acceptance Criteria Checklist

### ✅ AC1: Environment Variable Structure
**Requirement**: `GOOGLE_API_KEY` environment variable is defined in configuration

**Evidence**:
```python
# File: backend/app/config.py (line 18)
google_api_key: str = ""
```

**Verification**:
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python -c "from app.config import settings; print(f'google_api_key attribute exists: {hasattr(settings, \"google_api_key\")}')"
```

**Status**: ✅ PASS - Configuration attribute exists

---

### ✅ AC2: Environment File Templates
**Requirement**: `.env.example` files document the GOOGLE_API_KEY requirement

**Evidence**:
- `/home/pi/nanobanana/.env.example` (line 50)
- `/home/pi/nanobanana/backend/.env.example` (line 8)

Both files contain:
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**Status**: ✅ PASS - Templates document the requirement

---

### ✅ AC3: Google GenAI Package
**Requirement**: `google-genai` package is installed and available

**Evidence**:
```bash
# File: backend/requirements.txt (line 17)
google-genai>=1.0.0
```

**Verification**:
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python -c "import google.genai; print(f'google-genai version: {google.genai.__version__}')"
```

**Status**: ✅ PASS - Package is installed

---

### ⚠️ AC4: API Key Configuration
**Requirement**: GOOGLE_API_KEY is set to a valid Google Gemini API key

**Current Status**: ⚠️ NOT CONFIGURED
- Backend `.env`: Not created yet (needs to be copied from `.env.example`)
- Root `.env`: Empty value (`GOOGLE_API_KEY=`)

**Required Action**: User must obtain and configure a valid Google Gemini API key

**Instructions**: See `backend/GOOGLE_API_SETUP.md`

---

### ⚠️ AC5: Imagen Model Access
**Requirement**: API key has access to Imagen 3 model for image generation

**Current Status**: ⚠️ CANNOT VERIFY (no API key configured)

**Verification Command** (after API key is set):
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python verify_gemini_api.py
```

---

## Summary

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC1: Config Structure | ✅ PASS | `google_api_key` attribute exists in Settings |
| AC2: Documentation | ✅ PASS | `.env.example` files document requirement |
| AC3: Package Installation | ✅ PASS | `google-genai>=1.0.0` installed |
| AC4: API Key Set | ⚠️ PENDING | Requires valid API key from Google AI Studio |
| AC5: Imagen Access | ⚠️ PENDING | Cannot verify until AC4 is complete |

## Next Steps

To complete this task, the user must:

1. **Obtain a Google Gemini API Key**:
   - Visit https://makersuite.google.com/app/apikey
   - Create an API key (format: `AIzaSy...`)
   - Ensure Imagen model access is enabled

2. **Configure the API Key**:
   ```bash
   cd /home/pi/nanobanana/backend
   cp .env.example .env
   # Edit .env and set: GOOGLE_API_KEY=AIzaSy_your_actual_key
   ```

3. **Verify the Configuration**:
   ```bash
   cd /home/pi/nanobanana/backend
   source .venv/bin/activate
   python verify_gemini_api.py
   ```

4. **Run Tests**:
   ```bash
   pytest tests/test_google_api_config.py -v
   ```

## Files Created

1. **`backend/verify_gemini_api.py`**: Automated verification script
2. **`backend/GOOGLE_API_SETUP.md`**: Detailed setup guide
3. **`backend/tests/test_google_api_config.py`**: Automated tests for configuration
4. **`backend/ACCEPTANCE_CRITERIA.md`**: This file

## Quality Gates

### Code Quality
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate

# Linting
ruff check app tests --fix

# Type checking
mypy app
```

### Tests
```bash
# Configuration tests (can run without API key)
pytest tests/test_google_api_config.py -v -k "not authentication and not imagen"

# Full tests (requires API key)
pytest tests/test_google_api_config.py -v
```
