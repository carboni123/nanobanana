"""Tests for R2 storage configuration and base64 fallback."""

import base64
from unittest.mock import MagicMock, patch


from app.config import Settings
from app.features.generate.service import create_base64_url, upload_to_r2


class TestR2Configuration:
    """Test R2 storage configuration validation."""

    def test_r2_credentials_validation_all_present(self):
        """Test that R2 validation passes when all credentials are present."""
        settings = Settings(
            r2_access_key="test_access_key",
            r2_secret_key="test_secret_key",
            r2_bucket="test-bucket",
            r2_endpoint="https://test.r2.cloudflarestorage.com",
        )

        # All credentials present
        assert settings.r2_access_key
        assert settings.r2_secret_key
        assert settings.r2_endpoint
        assert settings.r2_bucket

    def test_r2_credentials_validation_missing(self):
        """Test that missing R2 credentials are detected."""
        settings = Settings(
            r2_access_key="",
            r2_secret_key="",
            r2_endpoint="",
        )

        # Credentials missing
        assert not settings.r2_access_key
        assert not settings.r2_secret_key
        assert not settings.r2_endpoint

    def test_upload_to_r2_returns_none_when_not_configured(self):
        """Test that upload_to_r2 returns None when credentials are missing."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.r2_access_key = ""
            mock_settings.r2_secret_key = ""
            mock_settings.r2_endpoint = ""

            result = upload_to_r2(b"test_image_bytes", "test.png")
            assert result is None

    def test_upload_to_r2_with_valid_config(self):
        """Test that upload_to_r2 works with valid configuration."""
        test_image = b"fake_png_data"
        test_filename = "test_image.png"

        with patch("app.features.generate.service.settings") as mock_settings:
            # Configure mock settings
            mock_settings.r2_access_key = "test_access_key"
            mock_settings.r2_secret_key = "test_secret_key"
            mock_settings.r2_endpoint = "https://test.r2.cloudflarestorage.com"
            mock_settings.r2_bucket = "test-bucket"

            # Mock boto3 at import time
            with patch("builtins.__import__") as mock_import:
                mock_boto3 = MagicMock()
                mock_s3_client = MagicMock()
                mock_boto3.client.return_value = mock_s3_client

                def import_side_effect(name, *args, **kwargs):
                    if name == "boto3":
                        return mock_boto3
                    return __import__(name, *args, **kwargs)

                mock_import.side_effect = import_side_effect

                # Call the function
                result = upload_to_r2(test_image, test_filename)

                # Verify boto3 client was created correctly
                mock_boto3.client.assert_called_once_with(
                    "s3",
                    endpoint_url="https://test.r2.cloudflarestorage.com",
                    aws_access_key_id="test_access_key",
                    aws_secret_access_key="test_secret_key",
                )

                # Verify put_object was called
                mock_s3_client.put_object.assert_called_once_with(
                    Bucket="test-bucket",
                    Key=f"images/{test_filename}",
                    Body=test_image,
                    ContentType="image/png",
                )

                # Verify URL format
                assert result is not None
                assert "images/test_image.png" in result

    def test_upload_to_r2_handles_boto3_error(self):
        """Test that upload_to_r2 returns None when boto3 raises an error."""
        with patch("app.features.generate.service.settings") as mock_settings:
            mock_settings.r2_access_key = "test_access_key"
            mock_settings.r2_secret_key = "test_secret_key"
            mock_settings.r2_endpoint = "https://test.r2.cloudflarestorage.com"

            # Mock boto3 to raise an exception
            with patch("builtins.__import__") as mock_import:

                def import_side_effect(name, *args, **kwargs):
                    if name == "boto3":
                        raise Exception("Connection failed")
                    return __import__(name, *args, **kwargs)

                mock_import.side_effect = import_side_effect

                result = upload_to_r2(b"test_data", "test.png")
                assert result is None


class TestBase64Fallback:
    """Test base64 fallback functionality."""

    def test_create_base64_url_format(self):
        """Test that base64 URL has correct format."""
        test_image = b"test_image_bytes"
        result = create_base64_url(test_image)

        assert result.startswith("data:image/png;base64,")
        assert len(result) > len("data:image/png;base64,")

    def test_create_base64_url_valid_encoding(self):
        """Test that base64 URL contains valid base64 encoding."""
        test_image = b"test_image_bytes"
        result = create_base64_url(test_image)

        # Extract base64 part
        base64_part = result.replace("data:image/png;base64,", "")

        # Verify it's valid base64 by decoding
        decoded = base64.b64decode(base64_part)
        assert decoded == test_image

    def test_create_base64_url_empty_image(self):
        """Test base64 URL creation with empty bytes."""
        result = create_base64_url(b"")
        assert result == "data:image/png;base64,"

    def test_create_base64_url_large_image(self):
        """Test base64 URL creation with larger image data."""
        # Create a 1KB test image
        test_image = b"x" * 1024
        result = create_base64_url(test_image)

        assert result.startswith("data:image/png;base64,")

        # Verify the encoded data
        base64_part = result.replace("data:image/png;base64,", "")
        decoded = base64.b64decode(base64_part)
        assert decoded == test_image


class TestStorageFallbackIntegration:
    """Test integration of R2 and base64 fallback."""

    @patch("app.features.generate.service.settings")
    def test_fallback_to_base64_when_r2_not_configured(self, mock_settings):
        """Test that system falls back to base64 when R2 is not configured."""
        mock_settings.r2_access_key = ""
        mock_settings.r2_secret_key = ""
        mock_settings.r2_endpoint = ""

        test_image = b"test_image_data"
        test_filename = "test.png"

        # Try R2 upload (should return None)
        r2_url = upload_to_r2(test_image, test_filename)
        assert r2_url is None

        # Fall back to base64
        base64_url = create_base64_url(test_image)
        assert base64_url.startswith("data:image/png;base64,")

    @patch("app.features.generate.service.settings")
    def test_fallback_to_base64_when_r2_fails(self, mock_settings):
        """Test that system falls back to base64 when R2 upload fails."""
        mock_settings.r2_access_key = "test_key"
        mock_settings.r2_secret_key = "test_secret"
        mock_settings.r2_endpoint = "https://test.r2.cloudflarestorage.com"

        test_image = b"test_image_data"
        test_filename = "test.png"

        # Mock boto3 to raise an exception
        with patch("builtins.__import__") as mock_import:

            def import_side_effect(name, *args, **kwargs):
                if name == "boto3":
                    raise Exception("Network error")
                return __import__(name, *args, **kwargs)

            mock_import.side_effect = import_side_effect

            # Try R2 upload (should return None due to error)
            r2_url = upload_to_r2(test_image, test_filename)
            assert r2_url is None

        # Fall back to base64
        base64_url = create_base64_url(test_image)
        assert base64_url.startswith("data:image/png;base64,")
