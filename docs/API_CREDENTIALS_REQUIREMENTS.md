# API Credentials Requirements for NanoBanana

**Document Version:** 1.0
**Date:** 2026-02-01
**Status:** Missing Required & Optional Credentials
**Author:** Tech Lead

---

## Executive Summary

This document identifies and documents the missing API credentials required for full functionality of the NanoBanana application. The application is currently deployed with basic functionality, but requires additional credentials to enable AI-powered image generation features.

### Current Status
- ✅ **Infrastructure:** Fully configured (Database, Redis, Cloudflare Tunnel)
- ❌ **Google Gemini API:** Not configured (REQUIRED for core functionality)
- ❌ **Cloudflare R2 Storage:** Not configured (OPTIONAL - has fallback)

---

## 1. Google Gemini API Key (REQUIRED)

### Status: ❌ MISSING - BLOCKS CORE FUNCTIONALITY

### Purpose
The Google Gemini API key is **required** for the core image generation functionality of NanoBanana. Without this key, the `/api/generate` endpoint will return HTTP 503 errors.

### What It's Used For
- AI-powered image generation using Google's Imagen 3.0 model
- Primary feature of the NanoBanana application
- Converts user text prompts into generated images

### Technical Details
- **Environment Variable:** `GOOGLE_API_KEY`
- **Format:** Starts with `AIza` followed by alphanumeric characters
- **Expected Length:** 39 characters
- **Example:** `AIzaSyA1234567890abcdefghijklmnopqrstuvw`
- **Model Used:** `imagen-3.0-generate-002`
- **SDK:** `google-genai` Python package (already installed)

### How to Obtain

1. **Visit Google AI Studio:**
   ```
   https://makersuite.google.com/app/apikey
   ```

2. **Create a New API Key:**
   - Sign in with your Google account
   - Click "Create API Key"
   - Select or create a Google Cloud project
   - Copy the generated API key

3. **Enable Required APIs:**
   - The API key needs access to the Generative AI API
   - Specifically requires access to Imagen 3 model

### Configuration Steps

1. **Update Production Environment File:**
   ```bash
   cd /home/pi/nanobanana
   nano .env
   ```

2. **Set the GOOGLE_API_KEY:**
   ```env
   GOOGLE_API_KEY=AIzaSyA_your_actual_api_key_here
   ```

3. **Verify Configuration:**
   ```bash
   cd backend
   source .venv/bin/activate
   python verify_gemini_api.py
   ```

   Expected output:
   ```
   ✓ PASS: Configuration Check
   ✓ PASS: Package Installation
   ✓ PASS: API Key Validation
   ✓ PASS: Imagen Model Access
   ```

4. **Restart Backend Service:**
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```

### Cost Considerations
- Google Gemini API has usage-based pricing
- Free tier available with quotas
- Production usage may incur costs
- Monitor usage at: https://console.cloud.google.com/apis/dashboard

### Impact if Not Configured
- ❌ Image generation will NOT work
- ❌ `/api/generate` endpoint returns HTTP 503
- ❌ Core application functionality is unavailable
- ❌ Users cannot generate images

### Verification Output (Current Status)
```
✗ FAIL: GOOGLE_API_KEY is still set to the placeholder value
```

---

## 2. Cloudflare R2 Storage Credentials (OPTIONAL)

### Status: ⚠️ MISSING - OPTIONAL (Fallback Available)

### Purpose
Cloudflare R2 provides object storage for generated images. This is **optional** because the application has a built-in base64 fallback mechanism.

### What It's Used For
- Permanent storage of generated images
- Serving images via public URLs
- Reducing response payload size (URL vs base64)
- Better performance for image delivery

### Fallback Behavior
When R2 is not configured:
- ✅ Images are still generated successfully
- ✅ Images are returned as base64 data URLs
- ⚠️ Larger response payloads (base64 encoding increases size by ~33%)
- ⚠️ Images are not persistently stored
- ⚠️ No permanent URLs for generated images

### Required Credentials

#### 2.1. R2_ACCESS_KEY
- **Format:** 32-character alphanumeric string
- **Example:** `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`
- **Type:** Access key ID for R2 API authentication

#### 2.2. R2_SECRET_KEY
- **Format:** 64-character base64 string
- **Example:** `AbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMnOpQrStUvWxYz01`
- **Type:** Secret access key for R2 API authentication

#### 2.3. R2_BUCKET
- **Current Value:** `nanobanana-images` (already configured)
- **Status:** ✅ Configured (but bucket must exist in R2)

#### 2.4. R2_ENDPOINT
- **Format:** `https://<account-id>.r2.cloudflarestorage.com`
- **Example:** `https://a1b2c3d4e5f6g7h8i9j0.r2.cloudflarestorage.com`
- **Type:** R2 API endpoint URL with your Cloudflare account ID

### How to Obtain

1. **Access Cloudflare Dashboard:**
   ```
   https://dash.cloudflare.com/
   ```

2. **Navigate to R2:**
   - Click on "R2" in the left sidebar
   - Or visit: https://dash.cloudflare.com/?to=/:account/r2

3. **Create R2 API Token:**
   - Go to "Manage R2 API Tokens"
   - Click "Create API Token"
   - Set permissions: "Object Read & Write"
   - Set scope: Specific bucket (`nanobanana-images`) or all buckets
   - Copy the generated Access Key ID and Secret Access Key
   - ⚠️ **IMPORTANT:** Save the secret key immediately - it won't be shown again

4. **Get Account ID:**
   - Your account ID is visible in the R2 dashboard URL
   - Or in the endpoint URL format shown when creating buckets
   - Format: 32-character hex string

5. **Create Bucket (if not exists):**
   - Click "Create bucket"
   - Name: `nanobanana-images`
   - Location: Choose closest to your server (auto or specific region)
   - Optional: Enable public access if you want direct image URLs

### Configuration Steps

1. **Update Production Environment File:**
   ```bash
   cd /home/pi/nanobanana
   nano .env
   ```

2. **Set R2 Credentials:**
   ```env
   R2_ACCESS_KEY=your_32_character_access_key_id
   R2_SECRET_KEY=your_64_character_secret_access_key
   R2_BUCKET=nanobanana-images
   R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
   ```

3. **Verify Configuration:**
   ```bash
   cd backend
   source .venv/bin/activate
   python verify_r2_config.py
   ```

   Expected output with R2 configured:
   ```
   ✅ PASS: credentials
   ✅ PASS: connectivity
   ✅ PASS: base64
   ✅ PASS: upload_logic
   ✅ R2 Storage: Configured and will be used for image storage
   ```

4. **Restart Backend Service:**
   ```bash
   docker compose -f docker-compose.prod.yml restart backend
   ```

### Cost Considerations
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Storage: $0.015 per GB per month
- Class A Operations (writes): $4.50 per million requests
- Class B Operations (reads): $0.36 per million requests
- No egress fees (major advantage over S3)
- Free tier: 10 GB storage, 1M Class A, 10M Class B per month

### Impact if Not Configured
- ✅ Application still works (uses base64 fallback)
- ⚠️ Larger response sizes (base64 encoding overhead)
- ⚠️ No permanent image storage
- ⚠️ Cannot share direct image URLs
- ⚠️ Potential performance impact for large images

### Verification Output (Current Status)
```
❌ FAIL: R2_ACCESS_KEY: Not configured or using placeholder
❌ FAIL: R2_SECRET_KEY: Not configured or using placeholder
✅ PASS: R2_BUCKET: Configured
❌ FAIL: R2_ENDPOINT: Not configured or using placeholder

⚠️  R2 Storage: Not configured (OPTIONAL)
✅ Base64 Fallback: Working - images will be returned as data URLs
✅ Overall: System is ready for image generation
```

---

## 3. Configuration Files Reference

### 3.1. Production Environment File
**Location:** `/home/pi/nanobanana/.env`

Current configuration:
```env
# Google Gemini (REQUIRED - MISSING)
GOOGLE_API_KEY=

# R2 Storage (OPTIONAL - MISSING)
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=nanobanana-images
R2_ENDPOINT=
```

### 3.2. Backend Environment File
**Location:** `/home/pi/nanobanana/backend/.env`

Contains placeholder values for local development. Production uses the root `.env` file via docker-compose.

### 3.3. Example Files
- `/home/pi/nanobanana/.env.example` - Production template
- `/home/pi/nanobanana/backend/.env.example` - Backend development template

---

## 4. Security Best Practices

### 4.1. API Key Storage
- ✅ Store in `.env` file (already gitignored)
- ❌ Never commit API keys to version control
- ❌ Never share API keys in chat/email/screenshots
- ✅ Rotate keys regularly
- ✅ Use separate keys for dev/staging/production

### 4.2. Access Control
- Use principle of least privilege
- Limit API key permissions to only what's needed
- Monitor API usage for anomalies
- Set up billing alerts to prevent unexpected costs

### 4.3. Key Rotation
When rotating keys:
1. Generate new API key
2. Update `.env` file
3. Restart services: `docker compose -f docker-compose.prod.yml restart`
4. Verify functionality
5. Revoke old API key

---

## 5. Testing & Validation

### 5.1. Verification Scripts

#### Google Gemini API
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python verify_gemini_api.py
```

Checks:
1. ✓ GOOGLE_API_KEY is configured
2. ✓ API key format is valid
3. ✓ API key can authenticate with Google
4. ✓ API key has access to Imagen 3 model

#### Cloudflare R2
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python verify_r2_config.py
```

Checks:
1. R2 credentials are configured
2. Can connect to R2 endpoint
3. Bucket exists and is accessible
4. Base64 fallback works (always)
5. Upload logic works

### 5.2. End-to-End Testing

Once GOOGLE_API_KEY is configured, test the API:

```bash
# Test image generation endpoint
curl -X POST https://www.whassup.com.br/api/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_nanobanana_api_key" \
  -d '{
    "prompt": "a beautiful sunset over mountains",
    "size": "1024x1024",
    "style": "natural"
  }'
```

Expected response:
- Status: 200 OK (with Google API key)
- Status: 503 Service Unavailable (without Google API key)

---

## 6. Priority & Recommendations

### Immediate Action Required (P0)
1. **Obtain Google Gemini API Key**
   - **Why:** Blocks core functionality
   - **Impact:** Application cannot generate images
   - **Time to configure:** 15-30 minutes
   - **Action:** Follow Section 1 to obtain and configure

### Optional Enhancement (P1)
2. **Configure Cloudflare R2 Storage**
   - **Why:** Improves performance and enables persistent storage
   - **Impact:** Better user experience, smaller responses
   - **Time to configure:** 30-45 minutes
   - **Action:** Follow Section 2 to obtain and configure

---

## 7. Troubleshooting

### Google Gemini API Issues

#### Error: "GOOGLE_API_KEY is not set"
- Verify `.env` file contains `GOOGLE_API_KEY=...`
- Check that the value is not empty
- Restart backend service after changes

#### Error: "API key authentication failed"
- Verify API key is correct (copy-paste carefully)
- Check that API key starts with `AIza`
- Verify API key is not expired
- Check Google Cloud Console for API status

#### Error: "No Imagen models found"
- Verify Generative AI API is enabled in Google Cloud Console
- Check that your project has access to Imagen 3
- May require enabling billing in Google Cloud Console

### Cloudflare R2 Issues

#### Error: "SSL validation failed"
- Verify R2_ENDPOINT uses correct account ID
- Check that bucket exists in Cloudflare R2
- Verify API token has correct permissions

#### Error: "Bucket not found"
- Create bucket in Cloudflare R2 dashboard
- Verify bucket name matches R2_BUCKET setting
- Check API token has access to the bucket

#### Error: "Access denied"
- Verify R2_ACCESS_KEY and R2_SECRET_KEY are correct
- Check API token permissions include "Object Read & Write"
- Regenerate token if needed

---

## 8. Related Documentation

- [Infrastructure Status](/home/pi/nanobanana/docs/infrastructure-status.md)
- [Product Requirements Document](/home/pi/nanobanana/docs/PRD.md)
- [PostgreSQL Verification](/home/pi/nanobanana/docs/task1_postgres_verification.md)
- [Environment Configuration Template](/home/pi/nanobanana/.env.example)

---

## 9. Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-01 | 1.0 | Initial documentation of missing API credentials | Tech Lead |

---

## 10. Appendix: Environment Variables Summary

| Variable | Required | Status | Default | Location |
|----------|----------|--------|---------|----------|
| `GOOGLE_API_KEY` | ✅ YES | ❌ Missing | Empty | `.env` |
| `R2_ACCESS_KEY` | ⚠️ Optional | ❌ Missing | Empty | `.env` |
| `R2_SECRET_KEY` | ⚠️ Optional | ❌ Missing | Empty | `.env` |
| `R2_BUCKET` | ⚠️ Optional | ✅ Set | `nanobanana-images` | `.env` |
| `R2_ENDPOINT` | ⚠️ Optional | ❌ Missing | Empty | `.env` |
| `DB_USER` | ✅ YES | ✅ Set | N/A | `.env` |
| `DB_PASSWORD` | ✅ YES | ✅ Set | N/A | `.env` |
| `REDIS_PASSWORD` | ✅ YES | ✅ Set | N/A | `.env` |
| `SECRET_KEY` | ✅ YES | ✅ Set | N/A | `.env` |
| `CLOUDFLARED_TOKEN` | ✅ YES | ✅ Set | N/A | `.env` |
| `VITE_API_URL` | ✅ YES | ✅ Set | N/A | `.env` |

---

**Document End**
