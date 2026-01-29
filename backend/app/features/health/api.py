"""Health check API endpoints."""

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app import VERSION
from app.database import get_db
from app.features.health.schemas import HealthCheckResponse
from app.features.health.service import check_database_connectivity, get_uptime

router = APIRouter()


@router.get("/api/v1/health", response_model=HealthCheckResponse)
async def health_check(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> HealthCheckResponse:
    """Health check endpoint.

    Returns comprehensive health status including server uptime, version,
    database connectivity, and timestamp.
    """
    # Get uptime from service
    uptime_seconds = get_uptime()

    # Check database connectivity
    database_status = await check_database_connectivity(db)

    # Determine overall status based on database connectivity
    overall_status = "healthy" if database_status == "connected" else "unhealthy"

    return HealthCheckResponse(
        status=overall_status,
        version=VERSION,
        uptime_seconds=uptime_seconds,
        database_status=database_status,
        timestamp=datetime.now(timezone.utc),
    )
