"""Health check service with uptime tracking and database connectivity checks."""

import time
from typing import Literal

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

# Startup time captured when this module is imported
startup_time = time.time()


def get_uptime() -> float:
    """Calculate the elapsed time in seconds since service startup.

    Returns:
        float: Number of seconds the service has been running.
    """
    return time.time() - startup_time


async def check_database_connectivity(db: AsyncSession) -> Literal["connected", "disconnected"]:
    """Test database connectivity by executing a simple query.

    Attempts to execute a SELECT 1 query to verify the database connection
    is active and responding. Handles connection failures gracefully.

    Args:
        db: AsyncSession database session to test.

    Returns:
        str: "connected" if database is reachable, "disconnected" if connection fails.
    """
    try:
        # Execute a simple query to test connectivity
        result = await db.execute(text("SELECT 1"))
        # Verify we got a result
        result.scalar_one()
        return "connected"
    except Exception:
        # Gracefully handle any database connection errors
        return "disconnected"
