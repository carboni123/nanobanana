"""Business logic for image generation."""

import base64
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.usage import Usage


async def generate_image(prompt: str, size: str, style: str) -> bytes:
    """Generate an image using Google Gemini API.

    Args:
        prompt: The image generation prompt
        size: Image size (e.g., "1024x1024")
        style: Image style ("natural" or "artistic")

    Returns:
        bytes: Raw image bytes (PNG)

    Raises:
        HTTPException 503: If GOOGLE_API_KEY is not configured
        HTTPException 502: If Gemini API call fails
    """
    if not settings.google_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image generation service not configured",
        )

    try:
        from google import genai

        client = genai.Client(api_key=settings.google_api_key)

        # Prepend style to prompt if artistic
        full_prompt = prompt
        if style == "artistic":
            full_prompt = f"artistic style: {prompt}"

        response = client.models.generate_images(
            model="imagen-3.0-generate-002",
            prompt=full_prompt,
            config=genai.types.GenerateImagesConfig(
                number_of_images=1,
                output_mime_type="image/png",
            ),
        )

        if not response.generated_images:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Image generation failed: no images returned",
            )

        generated_image = response.generated_images[0]
        if generated_image.image is None or generated_image.image.image_bytes is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Image generation failed: no image data returned",
            )

        return bytes(generated_image.image.image_bytes)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image generation failed: {str(e)}",
        )


def upload_to_r2(image_bytes: bytes, filename: str) -> str | None:
    """Upload image to Cloudflare R2 storage.

    Args:
        image_bytes: Raw image bytes
        filename: Filename for the image

    Returns:
        str | None: Public URL if upload successful, None if R2 not configured
    """
    if not settings.r2_access_key or not settings.r2_secret_key or not settings.r2_endpoint:
        return None

    try:
        import boto3  # type: ignore[import-untyped]

        s3 = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint,
            aws_access_key_id=settings.r2_access_key,
            aws_secret_access_key=settings.r2_secret_key,
        )

        key = f"images/{filename}"
        s3.put_object(
            Bucket=settings.r2_bucket,
            Key=key,
            Body=image_bytes,
            ContentType="image/png",
        )

        # Construct public URL
        # R2 public URL format: https://<bucket>.<account-id>.r2.dev/<key>
        # Or custom domain if configured
        url = f"{settings.r2_endpoint.replace('.r2.cloudflarestorage.com', '.r2.dev')}/{key}"
        return url

    except Exception:
        return None


def create_base64_url(image_bytes: bytes) -> str:
    """Create a base64 data URL from image bytes.

    Args:
        image_bytes: Raw image bytes

    Returns:
        str: Base64 data URL
    """
    encoded = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


async def record_usage(db: AsyncSession, api_key_id: str) -> None:
    """Record usage for an API key.

    Uses UPSERT pattern: creates a new record for today if none exists,
    or increments the existing record's image_count.

    Args:
        db: Database session
        api_key_id: ID of the API key used
    """
    today = date.today()

    # Try to find existing usage record for today
    result = await db.execute(
        select(Usage).where(
            Usage.api_key_id == api_key_id,
            Usage.usage_date == today,
        )
    )
    usage = result.scalar_one_or_none()

    if usage:
        usage.image_count += 1
    else:
        usage = Usage(
            api_key_id=api_key_id,
            usage_date=today,
            image_count=1,
        )
        db.add(usage)

    await db.flush()
