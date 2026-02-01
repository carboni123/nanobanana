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
        description="Image size in WxH format. Supported: 1024x1024, 1280x896, 896x1280, 1408x768, 768x1408",
    )
    style: StyleEnum = Field(default=StyleEnum.NATURAL)

    @field_validator("size")
    @classmethod
    def validate_size(cls, v: str) -> str:
        """Validate that size matches Gemini's supported formats.

        Supported sizes (based on imagen-3.0-generate-002):
        - 1024x1024 (1:1 square)
        - 1280x896 (4:3 landscape)
        - 896x1280 (3:4 portrait)
        - 1408x768 (16:9 landscape)
        - 768x1408 (9:16 portrait)
        """
        valid_sizes = {
            "1024x1024",  # 1:1
            "1280x896",   # 4:3
            "896x1280",   # 3:4
            "1408x768",   # 16:9
            "768x1408",   # 9:16
        }
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
