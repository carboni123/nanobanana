"""Tests for rate limiting utilities."""

from datetime import date, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.keys.rate_limit import check_daily_limit, increment_usage
from app.models.api_key import ApiKey
from app.models.usage import Usage


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient, test_user_data: dict) -> str:
    """Create a user and return their auth token."""
    response = await client.post("/v1/auth/register", json=test_user_data)
    assert response.status_code == 201
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def api_key(
    client: AsyncClient, auth_token: str, db_session: AsyncSession
) -> ApiKey:
    """Create an API key and return the model."""
    auth_headers = {"Authorization": f"Bearer {auth_token}"}
    response = await client.post(
        "/v1/keys",
        json={"name": "Test Key"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    key_id = response.json()["id"]

    # Fetch the API key model
    result = await db_session.execute(select(ApiKey).where(ApiKey.id == key_id))
    return result.scalar_one()


class TestCheckDailyLimit:
    """Tests for check_daily_limit function."""

    @pytest.mark.asyncio
    async def test_no_usage_within_limit(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Key with no usage is within any limit."""
        is_within_limit, current_usage = await check_daily_limit(
            db_session, api_key, daily_limit=100
        )

        assert is_within_limit is True
        assert current_usage == 0

    @pytest.mark.asyncio
    async def test_usage_within_limit(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Key with usage below limit is within limit."""
        # Create usage for today
        today = date.today()
        usage = Usage(api_key_id=api_key.id, usage_date=today, image_count=50)
        db_session.add(usage)
        await db_session.commit()

        is_within_limit, current_usage = await check_daily_limit(
            db_session, api_key, daily_limit=100
        )

        assert is_within_limit is True
        assert current_usage == 50

    @pytest.mark.asyncio
    async def test_usage_at_limit(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Key with usage at limit is NOT within limit."""
        today = date.today()
        usage = Usage(api_key_id=api_key.id, usage_date=today, image_count=100)
        db_session.add(usage)
        await db_session.commit()

        is_within_limit, current_usage = await check_daily_limit(
            db_session, api_key, daily_limit=100
        )

        assert is_within_limit is False
        assert current_usage == 100

    @pytest.mark.asyncio
    async def test_usage_over_limit(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Key with usage over limit is NOT within limit."""
        today = date.today()
        usage = Usage(api_key_id=api_key.id, usage_date=today, image_count=150)
        db_session.add(usage)
        await db_session.commit()

        is_within_limit, current_usage = await check_daily_limit(
            db_session, api_key, daily_limit=100
        )

        assert is_within_limit is False
        assert current_usage == 150

    @pytest.mark.asyncio
    async def test_only_counts_today(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Only today's usage counts toward the limit."""
        today = date.today()
        yesterday = today - timedelta(days=1)

        # Create usage for yesterday (should not count)
        usage_yesterday = Usage(
            api_key_id=api_key.id, usage_date=yesterday, image_count=80
        )
        db_session.add(usage_yesterday)

        # Create usage for today
        usage_today = Usage(api_key_id=api_key.id, usage_date=today, image_count=10)
        db_session.add(usage_today)

        await db_session.commit()

        is_within_limit, current_usage = await check_daily_limit(
            db_session, api_key, daily_limit=50
        )

        # Should only count today's 10, not yesterday's 80
        assert is_within_limit is True
        assert current_usage == 10


class TestIncrementUsage:
    """Tests for increment_usage function."""

    @pytest.mark.asyncio
    async def test_create_new_usage_record(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Creates new usage record if none exists for today."""
        await increment_usage(db_session, api_key.id, count=5)
        await db_session.commit()

        # Verify usage record was created
        today = date.today()
        result = await db_session.execute(
            select(Usage).where(
                Usage.api_key_id == api_key.id, Usage.usage_date == today
            )
        )
        usage = result.scalar_one()

        assert usage.image_count == 5

    @pytest.mark.asyncio
    async def test_increment_existing_usage(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Increments existing usage record for today."""
        today = date.today()

        # Create initial usage
        usage = Usage(api_key_id=api_key.id, usage_date=today, image_count=10)
        db_session.add(usage)
        await db_session.commit()

        # Increment usage
        await increment_usage(db_session, api_key.id, count=5)
        await db_session.commit()

        # Verify usage was incremented
        result = await db_session.execute(
            select(Usage).where(
                Usage.api_key_id == api_key.id, Usage.usage_date == today
            )
        )
        usage = result.scalar_one()

        assert usage.image_count == 15

    @pytest.mark.asyncio
    async def test_default_count(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Default count is 1 if not specified."""
        await increment_usage(db_session, api_key.id)
        await db_session.commit()

        today = date.today()
        result = await db_session.execute(
            select(Usage).where(
                Usage.api_key_id == api_key.id, Usage.usage_date == today
            )
        )
        usage = result.scalar_one()

        assert usage.image_count == 1

    @pytest.mark.asyncio
    async def test_multiple_increments(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Multiple increments accumulate correctly."""
        await increment_usage(db_session, api_key.id, count=3)
        await increment_usage(db_session, api_key.id, count=7)
        await increment_usage(db_session, api_key.id, count=2)
        await db_session.commit()

        today = date.today()
        result = await db_session.execute(
            select(Usage).where(
                Usage.api_key_id == api_key.id, Usage.usage_date == today
            )
        )
        usage = result.scalar_one()

        assert usage.image_count == 12

    @pytest.mark.asyncio
    async def test_does_not_affect_other_days(
        self, db_session: AsyncSession, api_key: ApiKey
    ) -> None:
        """Incrementing today doesn't affect other days."""
        yesterday = date.today() - timedelta(days=1)

        # Create usage for yesterday
        usage_yesterday = Usage(
            api_key_id=api_key.id, usage_date=yesterday, image_count=50
        )
        db_session.add(usage_yesterday)
        await db_session.commit()

        # Increment today's usage
        await increment_usage(db_session, api_key.id, count=10)
        await db_session.commit()

        # Verify yesterday's usage unchanged
        result = await db_session.execute(
            select(Usage).where(
                Usage.api_key_id == api_key.id, Usage.usage_date == yesterday
            )
        )
        usage = result.scalar_one()

        assert usage.image_count == 50
