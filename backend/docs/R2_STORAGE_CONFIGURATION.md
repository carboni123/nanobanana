# R2 Storage Configuration Guide

## Overview

NanoBanana supports **optional** Cloudflare R2 storage for persistent image hosting. If R2 is not configured, the system automatically falls back to base64-encoded data URLs.

## Configuration Status

### Current Configuration: ⚠️ Not Configured (Using Base64 Fallback)

The system is currently configured to use **base64 fallback** for image delivery. This is a valid configuration for development and testing.

## Storage Options

### Option 1: Base64 Data URLs (Current - Default)

**Status**: ✅ Fully Working

**Pros**:
- No external dependencies
- No additional costs
- Works immediately without setup
- Simple for testing and development

**Cons**:
- Images not persistently stored
- Larger response payload sizes
- Not suitable for production at scale

**Use Cases**:
- Development and testing
- Proof of concept
- Low-volume applications

### Option 2: Cloudflare R2 Storage (Optional)

**Status**: ⚠️ Not Configured

**Pros**:
- Persistent image storage
- Public URLs for images
- Cloudflare CDN for fast delivery
- Cost-effective (no egress fees)
- Production-ready

**Cons**:
- Requires Cloudflare account
- Requires R2 bucket setup
- Additional configuration needed

**Use Cases**:
- Production deployments
- Applications requiring persistent URLs
- High-volume image generation

## How to Configure R2 (Optional)

### Prerequisites

1. Cloudflare account
2. R2 subscription enabled
3. R2 bucket created

### Step 1: Create R2 Bucket

1. Log into Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket named `nanobanana-images` (or your preferred name)
4. Configure public access if needed

### Step 2: Generate API Tokens

1. In R2 dashboard, go to "Manage R2 API Tokens"
2. Create a new API token with:
   - Read & Write permissions
   - Access to your bucket
3. Save the Access Key ID and Secret Access Key

### Step 3: Update Environment Variables

Edit `/home/pi/nanobanana/backend/.env`:

```bash
# Replace with your actual R2 credentials
R2_ACCESS_KEY=your_actual_access_key_here
R2_SECRET_KEY=your_actual_secret_key_here
R2_BUCKET=nanobanana-images
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

**Important**: Replace `your-account-id` with your actual Cloudflare account ID.

### Step 4: Verify Configuration

Run the verification script:

```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python verify_r2_config.py
```

Expected output when configured:
```
✅ All R2 credentials are configured
✅ Successfully connected to R2 bucket
✅ Overall: System is ready for image generation
```

## How the Fallback System Works

The image generation endpoint (`/generate`) implements automatic fallback:

1. **Generate Image**: Call Google Gemini Imagen API
2. **Try R2 Upload**: Attempt to upload to R2 if configured
3. **Fallback**: If R2 is not configured or upload fails, return base64 data URL
4. **Return URL**: Always returns a valid image URL to the client

```python
# Code flow in service.py
image_bytes = await generate_image(prompt, size, style)

# Try R2 first
url = upload_to_r2(image_bytes, filename)

# Fallback to base64 if R2 not available
if url is None:
    url = create_base64_url(image_bytes)

return GenerateResponse(url=url, ...)
```

## Testing

### Test Base64 Fallback

```bash
cd /home/pi/nanobanana/backend
source .venv/bin/activate
python -m pytest tests/test_r2_storage.py::TestBase64Fallback -v
```

### Test R2 Configuration

```bash
python -m pytest tests/test_r2_storage.py::TestR2Configuration -v
```

### Test Full Integration

```bash
python -m pytest tests/test_r2_storage.py -v
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `R2_ACCESS_KEY` | No | `""` | R2 API access key |
| `R2_SECRET_KEY` | No | `""` | R2 API secret key |
| `R2_BUCKET` | No | `nanobanana-images` | R2 bucket name |
| `R2_ENDPOINT` | No | `""` | R2 endpoint URL |

## Validation Checklist

- [x] Base64 fallback implemented
- [x] Base64 fallback tested
- [x] R2 upload function handles missing credentials gracefully
- [x] R2 upload function handles connection errors gracefully
- [x] Environment variables documented
- [x] Configuration verification script created
- [x] Comprehensive unit tests added
- [x] Integration tests cover fallback scenarios

## Current Status Summary

✅ **Base64 Fallback**: Fully functional and tested
⚠️ **R2 Storage**: Not configured (optional)
✅ **System Ready**: Can generate images using base64 URLs
✅ **Production Ready**: With either storage option

## Next Steps

### For Development (Current Setup)
- ✅ No action needed
- System works with base64 fallback

### For Production Deployment
1. Follow "How to Configure R2" guide above
2. Run verification script
3. Update deployment configuration
4. Test image generation endpoint

## Support

For issues or questions:
1. Check verification script output: `python verify_r2_config.py`
2. Review logs in FastAPI application
3. Run tests: `pytest tests/test_r2_storage.py -v`
