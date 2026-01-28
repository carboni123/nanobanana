"""Pydantic schemas for API key management."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreateKeyRequest(BaseModel):
    """Request to create a new API key."""

    name: str | None = Field(default=None, max_length=100)


class CreateKeyResponse(BaseModel):
    """Response when creating an API key - includes full key (shown only once)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str  # Full key - only returned on creation
    name: str
    prefix: str
    created_at: datetime


class KeyResponse(BaseModel):
    """Response for a single API key - does NOT include full key."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    prefix: str
    is_active: bool
    last_used_at: datetime | None
    created_at: datetime


class KeyListResponse(BaseModel):
    """Response for listing all user's API keys."""

    keys: list[KeyResponse]
