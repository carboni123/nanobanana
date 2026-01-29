"""Pydantic schemas for authentication."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Request schema for user registration."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class UserLoginRequest(BaseModel):
    """Request schema for user login."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Response schema for authentication tokens."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Response schema for user data."""

    model_config = {"from_attributes": True}

    id: str
    email: str
    created_at: datetime


class RegisterResponse(BaseModel):
    """Response schema for registration."""

    user: UserResponse
    access_token: str
    token_type: str = "bearer"


class UpdateProfileRequest(BaseModel):
    """Request schema for updating user profile."""

    email: EmailStr


class ChangePasswordRequest(BaseModel):
    """Request schema for changing password."""

    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
