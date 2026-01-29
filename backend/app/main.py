"""FastAPI application entry point."""

from fastapi import FastAPI

from app.features.auth.api import router as auth_router
from app.features.keys.api import router as keys_router
from app.features.generate.api import router as generate_router
from app.features.health.api import router as health_router
from app.features.hello.api import router as hello_router
from app.features.usage.api import router as usage_router

app = FastAPI(
    title="NanoBanana API",
    description="Simple image generation API powered by Google Gemini",
    version="0.1.0",
)


# Health routes
app.include_router(health_router, tags=["health"])

# Hello routes
app.include_router(hello_router, prefix="/v1", tags=["hello"])

# Auth routes
app.include_router(auth_router, prefix="/v1/auth", tags=["auth"])

# Keys routes
app.include_router(keys_router, prefix="/v1/keys", tags=["keys"])

# Generate routes
app.include_router(generate_router, prefix="/v1", tags=["generate"])

# Usage routes
app.include_router(usage_router, prefix="/v1/usage", tags=["usage"])
