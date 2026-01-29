"""FastAPI application entry point."""

from fastapi import FastAPI

from app.features.auth.api import router as auth_router
from app.features.keys.api import router as keys_router
from app.features.generate.api import router as generate_router
from app.features.health.api import router as health_router

app = FastAPI(
    title="NanoBanana API",
    description="Simple image generation API powered by Google Gemini",
    version="0.1.0",
)


# Health routes
app.include_router(health_router, tags=["health"])

# Auth routes
app.include_router(auth_router, prefix="/v1/auth", tags=["auth"])

# Keys routes
app.include_router(keys_router, prefix="/v1/keys", tags=["keys"])

# Generate routes
app.include_router(generate_router, prefix="/v1", tags=["generate"])
