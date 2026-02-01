"""Tests for image generation endpoints."""

from datetime import date
from unittest.mock import MagicMock, patch

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage import Usage


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient, test_user_data: dict) -> str:
    """Create a user and return their auth token."""
    response = await client.post("/v1/auth/register", json=test_user_data)
    assert response.status_code == 201
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def api_key(client: AsyncClient, auth_token: str) -> str:
    """Create an API key and return the full key string."""
    response = await client.post(
        "/v1/keys",
        json={"name": "Test Key"},
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 201
    return response.json()["key"]


@pytest.fixture
def api_key_headers(api_key: str) -> dict:
    """Return headers with API key."""
    return {"Authorization": f"Bearer {api_key}"}


@pytest.fixture
def mock_gemini_response():
    """Create a mock Gemini API response."""
    mock_image = MagicMock()
    mock_image.image_bytes = b"fake_image_bytes"

    mock_generated_image = MagicMock()
    mock_generated_image.image = mock_image

    mock_response = MagicMock()
    mock_response.generated_images = [mock_generated_image]

    return mock_response


class TestGenerateSuccess:
    """Tests for successful image generation."""

    @pytest.mark.asyncio
    async def test_generate_success(
        self, client: AsyncClient, api_key_headers: dict, mock_gemini_response
    ) -> None:
        """Generating an image with valid API key returns image URL."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    response = await client.post(
                        "/v1/generate",
                        json={"prompt": "A cute banana"},
                        headers=api_key_headers,
                    )

        assert response.status_code == 201
        data = response.json()

        assert "id" in data
        assert data["id"].startswith("gen_")
        assert "url" in data
        assert data["url"].startswith("data:image/png;base64,")
        assert data["prompt"] == "A cute banana"
        assert "created_at" in data


class TestGenerateAuth:
    """Tests for authentication on generate endpoint."""

    @pytest.mark.asyncio
    async def test_generate_invalid_api_key(self, client: AsyncClient) -> None:
        """Generating with invalid API key returns 401."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A banana"},
            headers={"Authorization": "Bearer nb_live_invalid00000000000000000000"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_generate_missing_api_key(self, client: AsyncClient) -> None:
        """Generating without API key returns 401."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A banana"},
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_generate_revoked_key_rejected(
        self, client: AsyncClient, auth_token: str, api_key: str, mock_gemini_response
    ) -> None:
        """Generating with revoked API key returns 401."""
        # Get the key ID by listing keys
        list_response = await client.get(
            "/v1/keys",
            headers={"Authorization": f"Bearer {auth_token}"},
        )
        key_id = list_response.json()["keys"][0]["id"]

        # Revoke the key
        await client.delete(
            f"/v1/keys/{key_id}",
            headers={"Authorization": f"Bearer {auth_token}"},
        )

        # Try to use revoked key
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A banana"},
            headers={"Authorization": f"Bearer {api_key}"},
        )

        assert response.status_code == 401
        assert "revoked" in response.json()["detail"].lower()


class TestGenerateValidation:
    """Tests for request validation."""

    @pytest.mark.asyncio
    async def test_generate_missing_prompt(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating without prompt returns 422."""
        response = await client.post(
            "/v1/generate",
            json={},
            headers=api_key_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_empty_prompt(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating with empty prompt returns 422."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": ""},
            headers=api_key_headers,
        )

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_generate_invalid_size(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating with invalid size returns 422."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A cute banana", "size": "invalid"},
            headers=api_key_headers,
        )

        assert response.status_code == 422
        assert "size" in response.json()["detail"][0]["loc"]

    @pytest.mark.asyncio
    async def test_generate_valid_size_1024x1024(
        self, client: AsyncClient, api_key_headers: dict, mock_gemini_response
    ) -> None:
        """Generating with 1024x1024 size succeeds."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    response = await client.post(
                        "/v1/generate",
                        json={"prompt": "A cute banana", "size": "1024x1024"},
                        headers=api_key_headers,
                    )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_generate_valid_size_1280x896(
        self, client: AsyncClient, api_key_headers: dict, mock_gemini_response
    ) -> None:
        """Generating with 1280x896 (4:3 landscape) size succeeds."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    response = await client.post(
                        "/v1/generate",
                        json={"prompt": "A cute banana", "size": "1280x896"},
                        headers=api_key_headers,
                    )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_generate_valid_size_896x1280(
        self, client: AsyncClient, api_key_headers: dict, mock_gemini_response
    ) -> None:
        """Generating with 896x1280 (3:4 portrait) size succeeds."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    response = await client.post(
                        "/v1/generate",
                        json={"prompt": "A cute banana", "size": "896x1280"},
                        headers=api_key_headers,
                    )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_generate_valid_size_1408x768(
        self, client: AsyncClient, api_key_headers: dict, mock_gemini_response
    ) -> None:
        """Generating with 1408x768 (16:9 landscape) size succeeds."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    response = await client.post(
                        "/v1/generate",
                        json={"prompt": "A cute banana", "size": "1408x768"},
                        headers=api_key_headers,
                    )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_generate_valid_size_768x1408(
        self, client: AsyncClient, api_key_headers: dict, mock_gemini_response
    ) -> None:
        """Generating with 768x1408 (9:16 portrait) size succeeds."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    response = await client.post(
                        "/v1/generate",
                        json={"prompt": "A cute banana", "size": "768x1408"},
                        headers=api_key_headers,
                    )

        assert response.status_code == 201

    @pytest.mark.asyncio
    async def test_generate_invalid_size_512x512(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating with unsupported 512x512 size returns 422."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A cute banana", "size": "512x512"},
            headers=api_key_headers,
        )

        assert response.status_code == 422
        data = response.json()
        assert "size" in data["detail"][0]["loc"]
        assert "Size must be one of" in data["detail"][0]["msg"]

    @pytest.mark.asyncio
    async def test_generate_invalid_size_256x256(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating with unsupported 256x256 size returns 422."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A cute banana", "size": "256x256"},
            headers=api_key_headers,
        )

        assert response.status_code == 422
        data = response.json()
        assert "size" in data["detail"][0]["loc"]
        assert "Size must be one of" in data["detail"][0]["msg"]

    @pytest.mark.asyncio
    async def test_generate_invalid_size_2048x2048(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating with unsupported 2048x2048 size returns 422."""
        response = await client.post(
            "/v1/generate",
            json={"prompt": "A cute banana", "size": "2048x2048"},
            headers=api_key_headers,
        )

        assert response.status_code == 422
        data = response.json()
        assert "size" in data["detail"][0]["loc"]
        assert "Size must be one of" in data["detail"][0]["msg"]


class TestGenerateUsage:
    """Tests for usage tracking."""

    @pytest.mark.asyncio
    async def test_generate_usage_recorded(
        self,
        client: AsyncClient,
        api_key_headers: dict,
        db_session: AsyncSession,
        mock_gemini_response,
    ) -> None:
        """Generating an image increments usage count."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
                with patch("google.genai.Client") as mock_client_class:
                    mock_client = MagicMock()
                    mock_client.models.generate_images.return_value = mock_gemini_response
                    mock_client_class.return_value = mock_client

                    # Generate first image
                    response1 = await client.post(
                        "/v1/generate",
                        json={"prompt": "A banana 1"},
                        headers=api_key_headers,
                    )
                    assert response1.status_code == 201

                    # Generate second image
                    response2 = await client.post(
                        "/v1/generate",
                        json={"prompt": "A banana 2"},
                        headers=api_key_headers,
                    )
                    assert response2.status_code == 201

        # Check usage was recorded
        # Note: We use a fresh session read since the test client commits
        result = await db_session.execute(
            select(Usage).where(Usage.usage_date == date.today())
        )
        usage_records = list(result.scalars().all())

        # There should be usage recorded
        assert len(usage_records) >= 1
        total_count = sum(u.image_count for u in usage_records)
        assert total_count >= 2


class TestGenerateServiceErrors:
    """Tests for service configuration errors."""

    @pytest.mark.asyncio
    async def test_generate_no_google_api_key(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generating without GOOGLE_API_KEY returns 503."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = ""

            response = await client.post(
                "/v1/generate",
                json={"prompt": "A banana"},
                headers=api_key_headers,
            )

        assert response.status_code == 503
        assert "not configured" in response.json()["detail"].lower()


class TestGenerateGeminiAPIErrors:
    """Tests for Gemini API error handling."""

    @pytest.mark.asyncio
    async def test_generate_rate_limit_error(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Gemini API rate limit (429) is properly handled."""
        from google.genai import errors

        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            # Create a mock rate limit error
            rate_limit_error = errors.ClientError(429, {"error": {"message": "Quota exceeded"}})

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                mock_client.models.generate_images.side_effect = rate_limit_error
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_quota_exceeded_error(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Gemini API quota exceeded error is detected and returns 429."""
        from google.genai import errors

        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            # Create an error with "quota" in the message
            quota_error = errors.ClientError(400, {"error": {"message": "Resource exhausted: quota exceeded"}})

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                mock_client.models.generate_images.side_effect = quota_error
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_client_error_400(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Gemini API client errors (400) are properly handled."""
        from google.genai import errors

        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            # Create a client error
            client_error = errors.ClientError(400, {"error": {"message": "Invalid prompt format"}})

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                mock_client.models.generate_images.side_effect = client_error
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 400
        assert "invalid request" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_server_error_500(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Gemini API server errors (5xx) are properly handled."""
        from google.genai import errors

        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            # Create a server error
            server_error = errors.ServerError(500, {"error": {"message": "Internal server error"}})

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                mock_client.models.generate_images.side_effect = server_error
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 502
        assert "temporarily unavailable" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_server_error_503(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Gemini API server errors (503) are properly handled."""
        from google.genai import errors

        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            # Create a 503 server error
            server_error = errors.ServerError(503, {"error": {"message": "Service temporarily unavailable"}})

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                mock_client.models.generate_images.side_effect = server_error
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 502
        assert "temporarily unavailable" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_generic_api_error(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Generic Gemini API errors are properly handled."""
        from google.genai import errors

        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            # Create a generic API error
            api_error = errors.APIError(418, {"error": {"message": "I'm a teapot"}})

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                mock_client.models.generate_images.side_effect = api_error
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 502
        assert "generation failed" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_generate_unexpected_exception(
        self, client: AsyncClient, api_key_headers: dict
    ) -> None:
        """Unexpected exceptions during generation are handled gracefully."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.google_api_key = "fake-key"

            with patch("google.genai.Client") as mock_client_class:
                mock_client = MagicMock()
                # Simulate an unexpected error (e.g., network timeout)
                mock_client.models.generate_images.side_effect = ConnectionError("Network timeout")
                mock_client_class.return_value = mock_client

                response = await client.post(
                    "/v1/generate",
                    json={"prompt": "A banana"},
                    headers=api_key_headers,
                )

        assert response.status_code == 502
        assert "generation failed" in response.json()["detail"].lower()
