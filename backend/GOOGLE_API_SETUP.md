# Google Gemini API Setup Guide

## Current Status
❌ **GOOGLE_API_KEY is NOT configured**

## Required Actions

### 1. Obtain a Google Gemini API Key

To use NanoBanana's image generation features, you need a Google AI API key with access to the Imagen model.

**Steps to get your API key:**

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key" or "Get API Key"
4. Copy the generated API key (format: `AIzaSy...`)

**Important Notes:**
- The API key starts with `AIza`
- Keep this key secret - never commit it to version control
- Google AI Studio may have usage limits on the free tier
- For Imagen 3 access, you may need to enable it in your Google Cloud project

### 2. Configure the API Key in NanoBanana

**Option A: Backend .env file (Recommended for local development)**

1. Navigate to the backend directory:
   ```bash
   cd /home/pi/nanobanana/backend
   ```

2. Create a `.env` file if it doesn't exist:
   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and set your API key:
   ```env
   GOOGLE_API_KEY=AIzaSy_your_actual_api_key_here
   ```

**Option B: Root .env file (Production deployment)**

1. Edit `/home/pi/nanobanana/.env`
2. Set the GOOGLE_API_KEY:
   ```env
   GOOGLE_API_KEY=AIzaSy_your_actual_api_key_here
   ```

### 3. Verify the Configuration

After setting the API key, run the verification script:

```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python verify_gemini_api.py
```

The script will check:
- ✓ API key is configured
- ✓ google-genai package is installed
- ✓ API key is valid and can authenticate
- ✓ Imagen model access is available

### Expected Output (Success)

```
======================================================================
Google Gemini API Credentials Verification
======================================================================

Running: Configuration Check...
  ✓ PASS: GOOGLE_API_KEY is configured (AIzaSy...)

Running: Package Installation...
  ✓ PASS: google-genai package is installed (version: 1.x.x)

Running: API Key Validation...
  ✓ PASS: API key is valid. Found XX available models

Running: Imagen Model Access...
  ✓ PASS: ✓ Imagen 3 model access confirmed. Available: imagen-3.0-generate-001

======================================================================
SUMMARY
======================================================================
  ✓ Configuration Check: GOOGLE_API_KEY is configured (AIzaSy...)
  ✓ Package Installation: google-genai package is installed
  ✓ API Key Validation: API key is valid
  ✓ Imagen Model Access: Imagen 3 model access confirmed

Result: 4/4 checks passed
======================================================================

✓ All checks passed! Google Gemini API is properly configured.
```

## Troubleshooting

### Error: "API key authentication failed"
- Verify the API key is correct (no extra spaces or characters)
- Check if the API key is active in Google AI Studio
- Ensure you haven't exceeded usage quotas

### Error: "No Imagen models found"
- You may need to enable Imagen API in Google Cloud Console
- Check if your account has access to Imagen 3
- Try using the Google AI Studio web interface to verify access

### Error: "google-genai package is not installed"
```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
pip install -r requirements.txt
```

## Security Best Practices

1. **Never commit API keys to version control**
   - The `.env` file is already in `.gitignore`
   - Double-check before committing

2. **Rotate keys regularly**
   - Consider rotating API keys every 90 days
   - Use Google Cloud IAM for production deployments

3. **Use environment-specific keys**
   - Separate keys for development, staging, and production
   - Monitor usage through Google Cloud Console

## References

- [Google AI Studio](https://makersuite.google.com/)
- [Google Generative AI Python SDK](https://github.com/google/generative-ai-python)
- [Imagen 3 Documentation](https://ai.google.dev/gemini-api/docs/imagen)
