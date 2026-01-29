"""Pydantic schemas for health check."""

from datetime import datetime

from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Response schema for health check endpoint.

    This schema provides comprehensive health status information including
    server status, version, uptime, database connectivity, and timestamp.
    """

    status: str = Field(
        ...,
        description="Overall health status of the API (e.g., 'healthy', 'unhealthy')",
        examples=["healthy", "unhealthy"]
    )
    version: str = Field(
        ...,
        description="Current version of the API",
        examples=["0.1.0"]
    )
    uptime_seconds: float = Field(
        ...,
        description="Number of seconds the server has been running",
        ge=0.0,
        examples=[3600.5]
    )
    database_status: str = Field(
        ...,
        description="Database connectivity status",
        examples=["connected", "disconnected"]
    )
    timestamp: datetime = Field(
        ...,
        description="ISO 8601 timestamp when the health check was performed"
    )
