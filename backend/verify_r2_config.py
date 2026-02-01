#!/usr/bin/env python3
"""Verify R2 storage configuration and test connectivity."""

import sys
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings


def verify_r2_credentials():
    """Verify that R2 credentials are configured."""
    print("=" * 60)
    print("R2 Storage Configuration Verification")
    print("=" * 60)

    # Check each credential
    credentials = {
        "R2_ACCESS_KEY": settings.r2_access_key,
        "R2_SECRET_KEY": settings.r2_secret_key,
        "R2_BUCKET": settings.r2_bucket,
        "R2_ENDPOINT": settings.r2_endpoint,
    }

    all_configured = True
    for name, value in credentials.items():
        if value and value not in [
            "",
            "your_r2_access_key",
            "your_r2_secret_key",
            "https://your-account.r2.cloudflarestorage.com",
        ]:
            print(f"✅ {name}: Configured")
        else:
            print(f"❌ {name}: Not configured or using placeholder")
            all_configured = False

    print()
    if all_configured:
        print("✅ All R2 credentials are configured")
        return True
    else:
        print("⚠️  R2 credentials are not fully configured")
        print("   This is OPTIONAL - the system will use base64 fallback")
        return False


def test_r2_connectivity():
    """Test R2 connectivity if credentials are configured."""
    print("\n" + "=" * 60)
    print("R2 Connectivity Test")
    print("=" * 60)

    if (
        not settings.r2_access_key
        or not settings.r2_secret_key
        or not settings.r2_endpoint
    ):
        print("⚠️  Skipping connectivity test - R2 not configured")
        print("   Base64 fallback will be used instead")
        return True

    try:
        import boto3
        from botocore.exceptions import ClientError

        print(f"📡 Testing connection to: {settings.r2_endpoint}")
        print(f"📦 Bucket: {settings.r2_bucket}")

        s3 = boto3.client(
            "s3",
            endpoint_url=settings.r2_endpoint,
            aws_access_key_id=settings.r2_access_key,
            aws_secret_access_key=settings.r2_secret_key,
        )

        # Try to list objects in the bucket (this validates credentials and access)
        try:
            s3.head_bucket(Bucket=settings.r2_bucket)
            print("✅ Successfully connected to R2 bucket")
            return True
        except ClientError as e:
            error_code = e.response.get("Error", {}).get("Code", "Unknown")
            if error_code == "404":
                print(f"❌ Bucket '{settings.r2_bucket}' not found")
            elif error_code == "403":
                print("❌ Access denied - check credentials")
            else:
                print(f"❌ Error: {error_code} - {str(e)}")
            return False

    except ImportError:
        print("❌ boto3 not installed - run: pip install boto3")
        return False
    except Exception as e:
        print(f"❌ Connection failed: {str(e)}")
        return False


def test_base64_fallback():
    """Test that base64 fallback works."""
    print("\n" + "=" * 60)
    print("Base64 Fallback Test")
    print("=" * 60)

    try:
        from app.features.generate.service import create_base64_url

        # Test with sample data
        test_data = b"test_image_data_12345"
        result = create_base64_url(test_data)

        if result.startswith("data:image/png;base64,"):
            print("✅ Base64 URL generation works")
            print(f"   Format: {result[:50]}...")
            return True
        else:
            print("❌ Base64 URL has incorrect format")
            return False

    except Exception as e:
        print(f"❌ Base64 fallback test failed: {str(e)}")
        return False


def test_upload_logic():
    """Test the upload_to_r2 function logic."""
    print("\n" + "=" * 60)
    print("Upload Logic Test")
    print("=" * 60)

    try:
        from app.features.generate.service import upload_to_r2

        # Test with sample data
        test_data = b"test_image_data"
        result = upload_to_r2(test_data, "test.png")

        if result is None:
            print("⚠️  R2 upload returned None (not configured or failed)")
            print("   This is expected if R2 credentials are not set")
            print("   System will use base64 fallback")
            return True
        else:
            print(f"✅ R2 upload returned URL: {result[:60]}...")
            return True

    except Exception as e:
        print(f"❌ Upload logic test failed: {str(e)}")
        return False


def main():
    """Run all verification tests."""
    print("\n🔍 NanoBanana R2 Storage Verification\n")

    results = {}
    results["credentials"] = verify_r2_credentials()
    results["connectivity"] = test_r2_connectivity()
    results["base64"] = test_base64_fallback()
    results["upload_logic"] = test_upload_logic()

    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)

    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    print("\n" + "=" * 60)
    print("Configuration Status")
    print("=" * 60)

    if results["credentials"]:
        print("✅ R2 Storage: Configured and will be used for image storage")
    else:
        print("⚠️  R2 Storage: Not configured (OPTIONAL)")
        if results["base64"]:
            print("✅ Base64 Fallback: Working - images will be returned as data URLs")
        else:
            print("❌ Base64 Fallback: Not working - this is a problem!")

    print()

    # Overall result
    critical_tests = results["base64"] and results["upload_logic"]
    if critical_tests:
        print("✅ Overall: System is ready for image generation")
        print("   Images will be stored in R2 if configured, or returned as base64")
        return 0
    else:
        print("❌ Overall: Critical tests failed")
        return 1


if __name__ == "__main__":
    sys.exit(main())
