"""API endpoints for image generation."""

from datetime import datetime, timezone
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.features.generate.schemas import GenerateRequest, GenerateResponse
from app.features.generate.service import (
    create_base64_url,
    generate_image,
    record_usage,
    upload_to_r2,
)
from app.features.keys.dependencies import CurrentApiKey

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate(
    request: GenerateRequest,
    api_key: CurrentApiKey,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> GenerateResponse:
    """Generate an image from a text prompt.

    Requires a valid API key in the Authorization header.
    The image is stored in R2 and the URL is returned.
    If R2 is not configured, a base64 data URL is returned instead.
    """
    # Generate the image
    image_bytes = await generate_image(
        prompt=request.prompt,
        size=request.size,
        style=request.style.value,
    )

    # Generate unique ID and filename
    gen_id = f"gen_{uuid4()}"
    filename = f"{gen_id}.png"

    # Try to upload to R2
    url = upload_to_r2(image_bytes, filename)

    # Fallback to base64 if R2 upload failed or not configured
    if url is None:
        url = create_base64_url(image_bytes)

    # Record usage
    await record_usage(db, api_key.id)

    return GenerateResponse(
        id=gen_id,
        url=url,
        prompt=request.prompt,
        created_at=datetime.now(timezone.utc),
    )
