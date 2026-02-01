"""Business logic for image generation."""

import base64
import logging
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.usage import Usage

logger = logging.getLogger(__name__)


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
        from google.genai import errors

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
        # Re-raise our own HTTPExceptions
        raise
    except errors.ClientError as e:
        # Handle 4xx client errors from Gemini API
        error_message = getattr(e, "message", str(e))

        # Check if this is a rate limit error (429)
        # The error object might have status or code attributes
        error_str = str(e).lower()
        if "429" in error_str or "quota" in error_str or "rate limit" in error_str:
            logger.warning(f"Gemini API rate limit exceeded: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Please try again later. Details: {error_message}",
            )
        else:
            # Other client errors (400, 401, 403, etc.)
            logger.error(f"Gemini API client error: {error_message}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request to image generation service: {error_message}",
            )
    except errors.ServerError as e:
        # Handle 5xx server errors from Gemini API
        error_message = getattr(e, "message", str(e))
        logger.error(f"Gemini API server error: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image generation service temporarily unavailable: {error_message}",
        )
    except errors.APIError as e:
        # Handle any other Gemini API errors
        error_message = getattr(e, "message", str(e))
        logger.error(f"Gemini API error: {error_message}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Image generation failed: {error_message}",
        )
    except Exception as e:
        # Catch-all for unexpected errors
        logger.exception(f"Unexpected error during image generation: {e}")
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
        str | None: Public URL if upload successful, None if R2 not configured or upload fails
    """
    if not settings.r2_access_key or not settings.r2_secret_key or not settings.r2_endpoint:
        logger.info("R2 storage not configured, will use base64 fallback")
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
        logger.info(f"Image successfully uploaded to R2: {key}")
        return url

    except Exception as e:
        logger.warning(f"R2 upload failed, falling back to base64: {e}")
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
