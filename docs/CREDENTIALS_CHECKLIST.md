# API Credentials Configuration Checklist

**Quick Reference Guide for Setting Up NanoBanana API Credentials**

---

## ✅ Checklist

### Google Gemini API Key (REQUIRED)

- [ ] Visit https://makersuite.google.com/app/apikey
- [ ] Create Google Cloud project (if needed)
- [ ] Generate API key
- [ ] Verify key starts with `AIza` and is ~39 characters
- [ ] Update `/home/pi/nanobanana/.env`:
  ```bash
  GOOGLE_API_KEY=AIzaSy_your_actual_key_here
  ```
- [ ] Run verification:
  ```bash
  cd /home/pi/nanobanana/backend
  source .venv/bin/activate
  python verify_gemini_api.py
  ```
- [ ] All checks should pass (4/4)
- [ ] Restart backend:
  ```bash
  docker compose -f docker-compose.prod.yml restart backend
  ```
- [ ] Test image generation endpoint

### Cloudflare R2 Storage (OPTIONAL)

- [ ] Visit https://dash.cloudflare.com/?to=/:account/r2
- [ ] Create bucket named `nanobanana-images` (if not exists)
- [ ] Create R2 API Token with "Object Read & Write" permissions
- [ ] Copy Access Key ID (32 chars)
- [ ] Copy Secret Access Key (64 chars) - save immediately!
- [ ] Note your Cloudflare Account ID from dashboard
- [ ] Update `/home/pi/nanobanana/.env`:
  ```bash
  R2_ACCESS_KEY=your_access_key_here
  R2_SECRET_KEY=your_secret_key_here
  R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
  ```
- [ ] Run verification:
  ```bash
  cd /home/pi/nanobanana/backend
  source .venv/bin/activate
  python verify_r2_config.py
  ```
- [ ] All checks should pass (4/4)
- [ ] Restart backend:
  ```bash
  docker compose -f docker-compose.prod.yml restart backend
  ```

---

## 📋 Quick Status Check

Run these commands to check current status:

```bash
# Check environment variables
cd /home/pi/nanobanana
grep -E "GOOGLE_API_KEY|R2_" .env

# Verify Google Gemini
cd backend && source .venv/bin/activate && python verify_gemini_api.py

# Verify R2 Storage
cd backend && source .venv/bin/activate && python verify_r2_config.py
```

---

## 🎯 Priority

1. **P0 - CRITICAL:** Google Gemini API Key
   - Required for core functionality
   - Application unusable without this

2. **P1 - RECOMMENDED:** Cloudflare R2 Storage
   - Optional - has base64 fallback
   - Improves performance and UX

---

## 📚 Full Documentation

For detailed information, see: [API_CREDENTIALS_REQUIREMENTS.md](./API_CREDENTIALS_REQUIREMENTS.md)
