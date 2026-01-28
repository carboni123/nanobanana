"""Pydantic schemas for image generation."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class StyleEnum(str, Enum):
    """Image style options."""

    NATURAL = "natural"
    ARTISTIC = "artistic"


class GenerateRequest(BaseModel):
    """Request to generate an image."""

    prompt: str = Field(..., min_length=1, max_length=2000)
    size: str = Field(default="1024x1024")
    style: StyleEnum = Field(default=StyleEnum.NATURAL)


class GenerateResponse(BaseModel):
    """Response from image generation."""

    id: str  # format: gen_<uuid>
    url: str  # R2 CDN URL or base64 data URL
    prompt: str
    created_at: datetime
