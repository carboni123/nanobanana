"""Tests for health check service functions."""

import asyncio

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.health.service import get_uptime, check_database_connectivity, startup_time


class TestHealthService:
    """Tests for health check service functions."""

    def test_startup_time_is_set(self):
        """Test that startup_time is initialized on module import."""
        assert startup_time > 0
        assert isinstance(startup_time, float)

    def test_get_uptime_returns_positive_value(self):
        """Test that get_uptime returns a positive number."""
        uptime = get_uptime()
        assert uptime >= 0
        assert isinstance(uptime, float)

    def test_get_uptime_increases_over_time(self):
        """Test that uptime increases as time passes."""
        uptime1 = get_uptime()
        asyncio.run(asyncio.sleep(0.1))  # Wait 100ms
        uptime2 = get_uptime()

        assert uptime2 > uptime1
        assert uptime2 - uptime1 >= 0.1

    @pytest.mark.asyncio
    async def test_check_database_connectivity_success(self, db_session: AsyncSession):
        """Test database connectivity check with valid session."""
        result = await check_database_connectivity(db_session)
        assert result == "connected"

    @pytest.mark.asyncio
    async def test_check_database_connectivity_handles_errors(self):
        """Test database connectivity check handles errors gracefully."""
        from unittest.mock import AsyncMock, Mock

        # Create a mock session that raises an exception when execute is called
        mock_session = Mock(spec=AsyncSession)
        mock_session.execute = AsyncMock(side_effect=Exception("Database connection failed"))

        result = await check_database_connectivity(mock_session)
        assert result == "disconnected"
