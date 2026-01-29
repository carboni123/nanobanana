"""Health check feature module."""

from app.features.health.api import router
from app.features.health.schemas import HealthCheckResponse

__all__ = ["router", "HealthCheckResponse"]
