"""Tests for Google Gemini API configuration."""

import os
import pytest
from unittest.mock import patch


def test_google_api_key_config_exists():
    """Test that google_api_key configuration exists in Settings."""
    from app.config import Settings

    settings = Settings()
    assert hasattr(settings, "google_api_key"), "Settings should have google_api_key attribute"


def test_google_api_key_is_string():
    """Test that google_api_key is a string type."""
    from app.config import Settings

    settings = Settings()
    assert isinstance(settings.google_api_key, str), "google_api_key should be a string"


def test_google_api_key_from_env():
    """Test that google_api_key can be loaded from environment."""
    from app.config import Settings

    test_key = "AIzaSyTestKey123456789"

    with patch.dict(os.environ, {"GOOGLE_API_KEY": test_key}):
        settings = Settings()
        assert settings.google_api_key == test_key


def test_google_api_key_has_default():
    """Test that google_api_key has a default value (empty or placeholder)."""
    from app.config import Settings

    settings = Settings()
    # API key should be a string (could be empty, placeholder, or actual key)
    assert isinstance(settings.google_api_key, str), "google_api_key should be a string"
    # This is acceptable - it can be empty, a placeholder, or a real key
    assert settings.google_api_key is not None, "google_api_key should not be None"


def test_google_genai_package_available():
    """Test that google-genai package is installed and importable."""
    try:
        import google.genai  # noqa: F401
        assert True, "google.genai package is available"
    except ImportError:
        pytest.fail("google-genai package is not installed. Run: pip install google-genai")


def test_google_genai_client_initialization():
    """Test that Google GenAI client can be initialized with an API key."""
    import google.genai as genai

    test_key = "AIzaSyTestKey123456789"

    # This should not raise an exception during initialization
    # (actual API calls would fail with fake key, but initialization should work)
    try:
        client = genai.Client(api_key=test_key)
        assert client is not None, "Client should be initialized"
    except Exception as e:
        pytest.fail(f"Failed to initialize Google GenAI client: {e}")


@pytest.mark.skipif(
    os.getenv("GOOGLE_API_KEY", "") == "",
    reason="GOOGLE_API_KEY not set in environment"
)
def test_google_api_key_authentication():
    """
    Test actual API key authentication (only runs if GOOGLE_API_KEY is set).

    This test is skipped if GOOGLE_API_KEY is not configured.
    """
    import google.genai as genai
    from app.config import settings

    client = genai.Client(api_key=settings.google_api_key)

    # Try to list models - this will fail if API key is invalid
    try:
        models = list(client.models.list())
        assert len(models) > 0, "Should have at least one model available"
    except Exception as e:
        pytest.fail(f"API key authentication failed: {e}")


@pytest.mark.skipif(
    os.getenv("GOOGLE_API_KEY", "") == "",
    reason="GOOGLE_API_KEY not set in environment"
)
def test_imagen_model_access():
    """
    Test access to Imagen model (only runs if GOOGLE_API_KEY is set).

    This test is skipped if GOOGLE_API_KEY is not configured.
    """
    import google.genai as genai
    from app.config import settings

    client = genai.Client(api_key=settings.google_api_key)

    try:
        models = list(client.models.list())
        imagen_models = [m for m in models if 'imagen' in m.name.lower()]

        assert len(imagen_models) > 0, (
            f"No Imagen models found. Available models: {[m.name for m in models[:5]]}"
        )
    except Exception as e:
        pytest.fail(f"Failed to check Imagen model access: {e}")


def test_api_key_format_validation():
    """Test validation of API key format."""

    def is_valid_google_api_key_format(key: str) -> bool:
        """Check if string matches expected Google API key format."""
        if not key:
            return False
        if len(key) < 20:
            return False
        if not key.startswith("AIza"):
            return False
        return True

    # Valid format
    assert is_valid_google_api_key_format("AIzaSyTestKey123456789") is True

    # Invalid formats
    assert is_valid_google_api_key_format("") is False
    assert is_valid_google_api_key_format("short") is False
    assert is_valid_google_api_key_format("WrongPrefixKey123456789") is False
