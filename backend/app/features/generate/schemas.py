"""Pydantic schemas for image generation."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class StyleEnum(str, Enum):
    """Image style options."""

    NATURAL = "natural"
    ARTISTIC = "artistic"


class GenerateRequest(BaseModel):
    """Request to generate an image."""

    prompt: str = Field(..., min_length=1, max_length=2000)
    size: str = Field(
        default="1024x1024",
        description="Image size in WxH format. Supported: 1024x1024, 512x512, 256x256",
    )
    style: StyleEnum = Field(default=StyleEnum.NATURAL)

    @field_validator("size")
    @classmethod
    def validate_size(cls, v: str) -> str:
        """Validate that size is in a supported format."""
        valid_sizes = {"1024x1024", "512x512", "256x256"}
        if v not in valid_sizes:
            raise ValueError(
                f"Size must be one of: {', '.join(sorted(valid_sizes))}"
            )
        return v


class GenerateResponse(BaseModel):
    """Response from image generation."""

    id: str  # format: gen_<uuid>
    url: str  # R2 CDN URL or base64 data URL
    prompt: str
    created_at: datetime
